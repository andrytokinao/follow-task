package com.kinga.followtask.service.contactuser;

import com.kinga.followtask.entity.Contact;
import com.kinga.followtask.entity.LinkCode;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.TypeContact;
import com.kinga.followtask.repository.ContactRepository;
import com.kinga.followtask.repository.LinkCodeRepository;
import com.kinga.followtask.repository.UserAppRepository;
import com.kinga.followtask.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Liaison d'un contact (WhatsApp...) à un compte :
 *  - par code à 6 chiffres (l'utilisateur génère le code dans son profil puis l'envoie lui-même) ;
 *  - par confirmation directe quand le numéro correspond déjà à userapp.contact.
 * Le système n'écrit jamais en premier dans le flux par code (pas de risque de spam).
 */
@Service
@RequiredArgsConstructor
public class ContactLinkService {
    private final WhatsAppSystemNumberProvider systemNumberProvider;
    private final UserService userService;
    /** Le message doit contenir uniquement le code : "483921", "483 921" ou "483-921". */
    private static final Pattern CODE = Pattern.compile("^\\s*(\\d{3})[\\s-]?(\\d{3})\\s*$");
    private static final Duration TTL = Duration.ofMinutes(5);
    private static final Duration RESTANT_MIN = Duration.ofSeconds(30);
    private static final int MAX_ECHECS = 5;
    private static final Duration FENETRE_ECHECS = Duration.ofHours(1);
    private static final int PURGE_SEUIL = 10_000;

    private static final Set<String> TRIVIAL = Set.of(
            "000000", "111111", "222222", "333333", "444444", "555555",
            "666666", "777777", "888888", "999999", "123456", "654321", "012345");

    private record Echecs(LocalDateTime debut, int nombre) {}

    private final SecureRandom random = new SecureRandom();
    private final Map<String, Echecs> echecs = new ConcurrentHashMap<>();

    private final LinkCodeRepository linkCodeRepository;
    private final ContactRepository contactRepository;
    private final UserAppRepository userAppRepository;

    // ---------- Détection ----------

    public boolean looksLikeCode(String text) {
        return text != null && CODE.matcher(text).matches();
    }

    private String extractCode(String text) {
        if (text == null) return null;
        Matcher m = CODE.matcher(text);
        return m.matches() ? m.group(1) + m.group(2) : null;
    }

    // ---------- Anti-devinette ----------

    /** Vrai si cet expéditeur a trop échoué récemment : ses messages sont alors ignorés sans réponse. */
    public boolean tropDEchecs(String externalId) {
        Echecs e = echecs.get(externalId);
        if (e == null) return false;
        if (e.debut().plus(FENETRE_ECHECS).isBefore(LocalDateTime.now())) {
            echecs.remove(externalId);
            return false;
        }
        return e.nombre() >= MAX_ECHECS;
    }

    private void enregistrerEchec(String externalId) {
        LocalDateTime now = LocalDateTime.now();
        if (echecs.size() > PURGE_SEUIL) {
            echecs.values().removeIf(e -> e.debut().plus(FENETRE_ECHECS).isBefore(now));
        }
        echecs.compute(externalId, (k, v) ->
                v == null || v.debut().plus(FENETRE_ECHECS).isBefore(now)
                        ? new Echecs(now, 1)
                        : new Echecs(v.debut(), v.nombre() + 1));
    }

    // ---------- Génération ----------

    @Transactional
    public LinkCodeResponse generate(String userId, TypeContact type) {
        LocalDateTime now = LocalDateTime.now();

        // Réutilise le code actif (non utilisé, non expiré) de cet utilisateur
        Optional<LinkCode> existing = linkCodeRepository
                .findFirstByUserApp_IdAndTypeContactAndUsedAtIsNullAndExpiresAtAfterOrderByExpiresAtDesc(
                        userId, type, now.plus(RESTANT_MIN));
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        // Sinon : invalide les restes (code presque expiré) et en crée un nouveau
        linkCodeRepository.invalidateActive(userId, type, now);

        String code;
        do {
            code = String.format("%06d", random.nextInt(1_000_000));
        } while (TRIVIAL.contains(code)
                || linkCodeRepository.existsByCodeAndUsedAtIsNullAndExpiresAtAfter(code, now));

        LinkCode lc = new LinkCode();
        lc.setUserApp(userAppRepository.getReferenceById(userId));
        lc.setTypeContact(type);
        lc.setCode(code);
        lc.setExpiresAt(now.plus(TTL));
        linkCodeRepository.save(lc);

        return toResponse(lc);
    }

    private LinkCodeResponse toResponse(LinkCode lc) {
        String code = lc.getCode();
        String affichage = code.substring(0, 3) + " " + code.substring(3);   // "483 921"
        String link = "https://wa.me/" + systemNumberProvider.get() + "?text=" + code;
        return new LinkCodeResponse(affichage, lc.getExpiresAt(), link);
    }

    // ---------- Consommation d'un code ----------

    /**
     * Valide le code reçu et rattache le contact au compte.
     * Lève {@link ContactDejaLieException} si le contact appartient déjà à un autre compte
     * (rollback : le code n'est pas consommé).
     *
     * @return le contact lié, ou vide si le code est invalide ou expiré
     */
    @Transactional
    public Optional<Contact> consumeFromMessage(TypeContact type, String text,
                                                String externalId, String phone, String displayName) {
        String code = extractCode(text);
        if (code == null) return Optional.empty();

        LocalDateTime now = LocalDateTime.now();
        Optional<LinkCode> active = linkCodeRepository
                .findFirstByCodeAndTypeContactAndUsedAtIsNullAndExpiresAtAfter(code, type, now);

        // consumeById est atomique : un webhook rejoué ou deux envois simultanés ne valident qu'une fois
        if (active.isEmpty() || linkCodeRepository.consumeById(active.get().getId(), now) != 1) {
            enregistrerEchec(externalId);
            return Optional.empty();
        }
        LinkCode lc = active.get();

        return Optional.of(upsertContact(type, externalId, phone, displayName, lc.getUserApp(), true));
    }

    // ---------- Liaison par confirmation directe (numéro déjà présent dans userapp.contact) ----------

    /**
     * Lie un contact à un compte après confirmation « OUI » de l'utilisateur, sans code.
     * Lève {@link ContactDejaLieException} si le contact appartient déjà à un autre compte.
     *
     * @return le contact lié, ou vide si le compte est introuvable ou inactif
     */
    @Transactional
    public Optional<Contact> linkConfirmed(TypeContact type, String userId,
                                           String externalId, String phone, String displayName) {
        Optional<UserApp> user = userAppRepository.findById(userId);
        if (user.isEmpty() || !user.get().estActif()) {
            return Optional.empty();
        }
        String name = (displayName != null && !displayName.isBlank())
                ? displayName
                : user.get().getFullName();

        // verified = false : un simple OUI prouve moins qu'un code envoyé depuis le profil.
        // Passez à true si votre code métier exige verified pour utiliser l'assistant.
        return Optional.of(upsertContact(type, externalId, phone, name, user.get(), false));
    }

    // ---------- Commun ----------

    private Contact upsertContact(TypeContact type, String externalId, String phone,
                                  String displayName, UserApp owner, boolean verified) {
        Contact contact = contactRepository.findByTypeContactAndExternalId(type, externalId)
                .orElseGet(Contact::new);
        if (contact.getUserApp() != null
                && !contact.getUserApp().getId().equals(owner.getId())) {
            throw new ContactDejaLieException();
        }

        contact.setTypeContact(type);
        contact.setExternalId(externalId);
        contact.setValue(phone);
        contact.setDisplayName(displayName);
        contact.setUserApp(owner);
        contact.setVerified(verified);   // adapter au nom réel du champ (is_verified)
        return contactRepository.save(contact);
    }
}