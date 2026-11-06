package com.kinga.followtask.service.contactuser;

import com.kinga.followtask.entity.Contact;
import com.kinga.followtask.entity.LinkCode;
import com.kinga.followtask.entity.enumapp.TypeContact;
import com.kinga.followtask.repository.ContactRepository;
import com.kinga.followtask.repository.LinkCodeRepository;
import com.kinga.followtask.repository.UserAppRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
 * Liaison d'un contact (WhatsApp...) à un compte par code à 6 chiffres.
 * L'utilisateur génère le code dans son profil puis l'envoie lui-même au numéro du système :
 * le système n'écrit jamais en premier (pas de risque de spam).
 */
@Service
@RequiredArgsConstructor
public class ContactLinkService {
    private final WhatsAppSystemNumberProvider systemNumberProvider;
    /** Le message doit contenir uniquement le code : "483921", "483 921" ou "483-921". */
    private static final Pattern CODE = Pattern.compile("^\\s*(\\d{3})[\\s-]?(\\d{3})\\s*$");
    private static final Duration TTL = Duration.ofMinutes(5);

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

        String affichage = code.substring(0, 3) + " " + code.substring(3);   // "483 921"
        String link = "https://wa.me/" + systemNumberProvider.get() + "?text=" + code;        return new LinkCodeResponse(affichage, lc.getExpiresAt(), link);
    }

    // ---------- Consommation ----------

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

        Contact contact = contactRepository.findByTypeContactAndExternalId(type, externalId)
                .orElseGet(Contact::new);
        if (contact.getUserApp() != null
                && !contact.getUserApp().getId().equals(lc.getUserApp().getId())) {
            throw new ContactDejaLieException();
        }

        contact.setTypeContact(type);
        contact.setExternalId(externalId);
        contact.setValue(phone);
        contact.setDisplayName(displayName);
        contact.setUserApp(lc.getUserApp());
        contact.setVerified(true);   // adapter au nom réel du champ (is_verified)
        return Optional.of(contactRepository.save(contact));
    }
}