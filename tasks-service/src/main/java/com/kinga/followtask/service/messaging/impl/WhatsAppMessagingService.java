package com.kinga.followtask.service.messaging.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinga.followtask.assistant.whatsapp.dto.DirectMessageReceivedEvent;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.entity.enumapp.TypeContact;
import com.kinga.followtask.repository.*;
import com.kinga.followtask.service.UserService;
import com.kinga.followtask.service.contactuser.ContactDejaLieException;
import com.kinga.followtask.service.contactuser.ContactLinkService;
import com.kinga.followtask.service.messaging.DirectMessageReader;
import com.kinga.followtask.service.messaging.MessagingService;
import com.kinga.followtask.service.messaging.dto.*;
import com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppMapper;
import com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppWebhookAdapter;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.*;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppMessagingService implements MessagingService, DirectMessageReader {

    /** Préfixe commun à tous les logs du traitement des webhooks (facile à filtrer : grep "WA-WEBHOOK"). */
    private static final String TAG = "[WA-WEBHOOK]";

    private final ObjectMapper objectMapper;
    private final WhatsAppWebhookAdapter adapter;
    private final CanalRepository canallRepository;
    private final MessagesRepository messageAppRepository;
    private final CanalMemberRepository canalMemberRepository;
    private final WhatsAppMapper mapper;
    private final ContactLinkService contactLinkService;
    private final ContactRepository contactRepository;
    private final CanalContactRepository canalContactRepository;
    private final ApplicationEventPublisher publisher;
    private final UserService userService;
    @Value("${messaging.whatsapp.base-url}")
    private String whatsAppListenerBaseUrl;

    /**
     * Si true, les messages des conversations privées sont aussi enregistrés (un canal est
     * créé à la volée). Par défaut false : listCanaux() ne garde que les groupes, et les
     * messages privés sont lus à la demande via recentDirectMessages().
     */
    @Value("${messaging.whatsapp.persist-direct-messages:false}")
    private boolean persistDirectMessages;

    private RestClient client() {
        return RestClient.builder().baseUrl(whatsAppListenerBaseUrl).build();
    }

    @Override
    public TypeCanal getType() {
        return TypeCanal.WHATSAPP;
    }

    // ---------- Utilitaires de log ----------

    /** Longueur du texte sans jamais l'exposer dans les logs (peut contenir un code de liaison). */
    private static String tailleTexte(String texte) {
        return texte == null ? "null" : texte.length() + " car.";
    }

    /** Aperçu tronqué du texte, sans retour à la ligne. Réservé aux logs DEBUG. */
    private static String apercu(String texte) {
        if (texte == null) return "null";
        String propre = texte.replaceAll("\\s+", " ").trim();
        return propre.length() <= 40 ? propre : propre.substring(0, 40) + "…";
    }

    private static long dureeMs(long debutNanos) {
        return (System.nanoTime() - debutNanos) / 1_000_000;
    }

    // ---------- Canaux ----------

    @Override
    public List<CanalDto> listCanaux() {
        log.debug("[WA] listCanaux : appel de {}/api/whatsapp/conversations-history", whatsAppListenerBaseUrl);
        long debut = System.nanoTime();

        WhatsAppRawConversationsResponse response = client().get()
                .uri("/api/whatsapp/conversations-history")
                .retrieve()
                .body(WhatsAppRawConversationsResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("[WA] listCanaux : réponse invalide depuis l'app WhatsApp externe (response null={}, succes={}) en {} ms",
                    response == null, response != null && response.isSucces(), dureeMs(debut));
            return List.of();
        }

        int total = response.getDonnees().size();
        List<CanalDto> groupes = response.getDonnees().stream()
                .map(mapper::toCanalDto)
                .filter(m -> m.isGroup())
                .toList();

        log.info("[WA] listCanaux : {} conversation(s) reçue(s), {} groupe(s) conservé(s) ({} privée(s) ignorée(s)) en {} ms",
                total, groupes.size(), total - groupes.size(), dureeMs(debut));
        return groupes;
    }

    /**
     * Conversations privees portant un message recent : ce sont les seules ou
     * un code de rattachement peut etre arrive.
     *
     * <p>Le tri par date du dernier message evite d'aller chercher l'historique
     * de toutes les conversations : une seule requete de liste, puis une
     * requete de messages par conversation ayant bouge depuis {@code since}.</p>
     */
    @Override
    public List<MessageDto> recentDirectMessages(LocalDateTime since) {
        log.debug("[WA] recentDirectMessages : début (since={})", since);
        long debut = System.nanoTime();

        WhatsAppRawConversationsResponse response = client().get()
                .uri("/api/whatsapp/conversations-history")
                .retrieve()
                .body(WhatsAppRawConversationsResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("[WA] recentDirectMessages : réponse invalide (conversations) depuis l'app WhatsApp externe (response null={})",
                    response == null);
            return List.of();
        }

        List<WhatsAppRawConversation> privees = response.getDonnees().stream()
                .filter(conversation -> !conversation.isEstGroupe())
                .toList();

        List<WhatsAppRawConversation> actives = privees.stream()
                .filter(conversation -> aBougeDepuis(conversation, since))
                .toList();

        log.debug("[WA] recentDirectMessages : {} conversation(s) au total, {} privée(s), {} active(s) depuis {}",
                response.getDonnees().size(), privees.size(), actives.size(), since);

        List<MessageDto> messages = actives.stream()
                .flatMap(conversation -> {
                    List<MessageDto> liste = listMessages(conversation.getJid(), null);
                    log.debug("[WA] recentDirectMessages : {} message(s) lu(s) pour {}", liste.size(), conversation.getJid());
                    return liste.stream();
                })
                .filter(message -> !message.isFromMe())
                .filter(message -> message.getCreatedAt() != null && !message.getCreatedAt().isBefore(since))
                .toList();

        log.info("[WA] recentDirectMessages : {} message(s) entrant(s) récent(s) retenu(s) sur {} conversation(s) active(s) en {} ms",
                messages.size(), actives.size(), dureeMs(debut));
        return messages;
    }

    /**
     * Le dernier message de la conversation est-il posterieur a l'instant
     * donne ? Une conversation sans horodatage lisible est retenue : mieux vaut
     * une requete de trop qu'un code manque.
     */
    private boolean aBougeDepuis(WhatsAppRawConversation conversation, LocalDateTime since) {
        WhatsAppRawLastMessage dernier = conversation.getDernierMessage();
        if (dernier == null || dernier.getHorodatage() == null) {
            log.debug("[WA] aBougeDepuis : {} sans horodatage de dernier message -> retenue par précaution",
                    conversation.getJid());
            return true;
        }
        LocalDateTime date = mapper.toLocalDateTime(dernier.getHorodatage());
        boolean retenue = date == null || !date.isBefore(since);
        log.trace("[WA] aBougeDepuis : {} dernier message={} since={} -> {}",
                conversation.getJid(), date, since, retenue);
        return retenue;
    }

    @Override
    public CanalDto getCanal(String canalExternalId) {
        log.debug("[WA] getCanal : lecture des membres de {}", canalExternalId);
        long debut = System.nanoTime();

        WhatsAppRawMembersResponse response = client().get()
                .uri("/api/whatsapp/groupes-history/{jid}/membres", canalExternalId)
                .retrieve()
                .body(WhatsAppRawMembersResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("[WA] getCanal : canal introuvable {} (response null={}) en {} ms",
                    canalExternalId, response == null, dureeMs(debut));
            throw new IllegalStateException("Canal introuvable : " + canalExternalId);
        }

        log.debug("[WA] getCanal : {} récupéré en {} ms", canalExternalId, dureeMs(debut));
        return mapper.toCanalDetailDto(response.getDonnees());
    }

    // ---------- Messages ----------

    @Override
    public List<MessageDto> listMessages(String canalExternalId, MessageQueryDto query) {
        log.debug("[WA] listMessages : canal={}", canalExternalId);
        long debut = System.nanoTime();

        WhatsAppRawMessagesResponse response = client().get()
                .uri("/api/whatsapp/conversations-history/{jid}/messages", canalExternalId)
                .retrieve()
                .body(WhatsAppRawMessagesResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("[WA] listMessages : réponse invalide pour le canal {} (response null={}) en {} ms",
                    canalExternalId, response == null, dureeMs(debut));
            return List.of();
        }

        int bruts = response.getDonnees().getMessages().size();
        List<MessageDto> messages = response.getDonnees().getMessages().stream()
                .map(raw -> mapper.toMessageDto(raw, canalExternalId))
                .filter(dto -> !WhatsAppTypeResolver.isIgnorable(dto.getMediaType()))
                .toList();

        log.debug("[WA] listMessages : canal={} {} message(s) bruts, {} conservé(s), {} ignoré(s) (type non pertinent) en {} ms",
                canalExternalId, bruts, messages.size(), bruts - messages.size(), dureeMs(debut));
        return messages;
    }

    @Override
    public MessageDto getMessage(String externalMessageId) {
        // Le provider WhatsApp actuel n'expose pas de lookup direct par messageId.
        // Non supporté tant que l'app externe n'ajoute pas cet endpoint.
        log.warn("[WA] getMessage : appel non supporté (messageId={})", externalMessageId);
        throw new UnsupportedOperationException(
                "getMessage non supporté par le provider WhatsApp pour le moment");
    }

    // ---------- Pièces jointes ----------

    @Override
    public List<AttachmentDto> listAttachments(String canalExternalId) {
        log.debug("[WA] listAttachments : canal={}", canalExternalId);
        long debut = System.nanoTime();

        WhatsAppRawFilesResponse response = client().get()
                .uri("/api/whatsapp/conversations-history/{jid}/fichiers", canalExternalId)
                .retrieve()
                .body(WhatsAppRawFilesResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("[WA] listAttachments : réponse invalide pour le canal {} (response null={}) en {} ms",
                    canalExternalId, response == null, dureeMs(debut));
            return List.of();
        }

        List<AttachmentDto> fichiers = response.getDonnees().getFichiers().stream()
                .map(mapper::toAttachmentDto)
                .toList();

        log.debug("[WA] listAttachments : canal={} {} fichier(s) en {} ms", canalExternalId, fichiers.size(), dureeMs(debut));
        return fichiers;
    }

    @Override
    public byte[] downloadAttachment(String externalAttachmentId) {
        // externalAttachmentId = messageId côté WhatsApp (1 fichier = 1 message)
        log.debug("[WA] downloadAttachment : messageId={}", externalAttachmentId);
        long debut = System.nanoTime();

        try {
            byte[] contenu = client().get()
                    .uri("/api/whatsapp/fichiers/{messageId}/telecharger", externalAttachmentId)
                    .retrieve()
                    .body(byte[].class);

            log.info("[WA] downloadAttachment : messageId={} -> {} octet(s) en {} ms",
                    externalAttachmentId, contenu == null ? 0 : contenu.length, dureeMs(debut));
            return contenu;
        } catch (RestClientResponseException e) {
            log.error("[WA] downloadAttachment : échec HTTP {} pour messageId={} : {}",
                    e.getStatusCode().value(), externalAttachmentId, e.getResponseBodyAsString());
            throw e;
        } catch (RuntimeException e) {
            log.error("[WA] downloadAttachment : échec pour messageId={} : {}", externalAttachmentId, e.getMessage(), e);
            throw e;
        }
    }

    // ---------- Envoi ----------

    @Override
    public MessageDto sendMessage(String canalExternalId, SendMessageRequestDto request) {
        // canalExternalId = numéro WhatsApp du destinataire (ex: 261340000000)
        if (request == null || request.getText() == null || request.getText().isBlank()) {
            log.warn("[WA] sendMessage : refusé, texte vide ou requête nulle (destinataire={})", canalExternalId);
            throw new IllegalArgumentException("Le texte du message est obligatoire");
        }

        if (request.getMediaUrl() != null && !request.getMediaUrl().isBlank()) {
            log.warn("[WA] sendMessage : refusé, envoi de média non supporté (destinataire={})", canalExternalId);
            throw new UnsupportedOperationException(
                    "L'envoi de média n'est pas encore supporté pour WhatsApp");
        }

        WhatsAppSendRequest body = WhatsAppSendRequest.builder()
                .to(canalExternalId)
                .txt(request.getText())
                .build();

        log.info("[WA] sendMessage : envoi vers {} ({})", canalExternalId, tailleTexte(request.getText()));
        long debut = System.nanoTime();

        try {
            // Réponse brute (Map) car sa structure exacte n'est pas confirmée
            Map<String, Object> response = client().post()
                    .uri("/api/whatsapp/envoyer")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            String messageId = extractMessageId(response);
            if (messageId == null) {
                log.warn("[WA] sendMessage : message envoyé à {} mais aucun id trouvé dans la réponse : {}",
                        canalExternalId, response);
            } else {
                log.info("[WA] sendMessage : message envoyé à {} (messageId={}) en {} ms",
                        canalExternalId, messageId, dureeMs(debut));
            }

            return MessageDto.builder()
                    .externalMessageId(messageId)
                    .canalExternalId(canalExternalId)
                    .text(request.getText())
                    .fromMe(true)
                    .hasAttachment(false)
                    .createdAt(LocalDateTime.now())
                    .build();

        } catch (RestClientResponseException e) {
            log.error("[WA] sendMessage : échec HTTP {} vers {} en {} ms : {}",
                    e.getStatusCode().value(), canalExternalId, dureeMs(debut), e.getResponseBodyAsString());
            throw new IllegalStateException(
                    "Échec de l'envoi WhatsApp (HTTP " + e.getStatusCode().value() + ") : "
                            + e.getResponseBodyAsString(), e);
        }
    }

    private String extractMessageId(Map<String, Object> response) {
        if (response == null) return null;
        for (String key : List.of("messageId", "id", "message_id", "whatsappId")) {
            Object value = response.get(key);
            if (value != null) return value.toString();
        }
        // /envoyer renvoie { succes, donnees: { whatsappId, ... } }
        Object donnees = response.get("donnees");
        if (donnees instanceof Map<?, ?> map) {
            Object whatsappId = map.get("whatsappId");
            if (whatsappId != null) return whatsappId.toString();
        }
        return null;
    }

    // ---------- Webhook ----------

    /**
     * Le gateway envoie deux familles de payloads :
     * <ul>
     *   <li>{@code evenement} = message.recu / message.envoye : le webhook détaillé (canalId,
     *       messageId WhatsApp, deMoi, traiteLe...). C'est le seul traité ici.</li>
     *   <li>{@code event} = message.created / media.created : relais temps réel avec un
     *       compteur interne et le JID téléphone. Doublon du précédent : ignoré, sinon chaque
     *       message serait enregistré deux fois sous un canal qui n'existe pas.</li>
     * </ul>
     * Ne lève jamais d'exception vers le contrôleur : le gateway ne rejoue pas les webhooks.
     */
    @Override
    public void handleIncomingEvent(Object rawPayload) {
        long debut = System.nanoTime();
        log.info("{} Payload reçu (classe={})", TAG, rawPayload == null ? "null" : rawPayload.getClass().getSimpleName());

        try {
            JsonNode node = objectMapper.valueToTree(rawPayload);

            if (node == null || node.isNull() || node.isMissingNode()) {
                log.warn("{} Payload vide ou nul : ignoré", TAG);
                return;
            }

            // Le payload complet peut contenir du texte privé : réservé au niveau TRACE.
            log.trace("{} Payload brut : {}", TAG, node);
            log.debug("{} Champs de premier niveau : {}", TAG, node.fieldNames().hasNext()
                    ? String.join(", ", (Iterable<String>) node::fieldNames)
                    : "(aucun)");

            if (node.has("evenement")) {
                log.info("{} Famille 'evenement' détectée ({}) -> traitement détaillé",
                        TAG, node.path("evenement").asText());
                WhatsAppIncomingWebhook webhook =
                        objectMapper.treeToValue(node, WhatsAppIncomingWebhook.class);
                handleWebhookMessage(webhook);
            } else if (node.has("event")) {
                log.debug("{} Événement temps réel ignoré (doublon du webhook détaillé) : {}",
                        TAG, node.path("event").asText());
            } else {
                log.warn("{} Format inconnu (ni 'evenement' ni 'event'), champs : {}", TAG, node);
            }
        } catch (JsonProcessingException e) {
            log.error("{} Payload invalide (désérialisation impossible) : {} | cause : {}",
                    TAG, rawPayload, e.getOriginalMessage(), e);
        } catch (RuntimeException e) {
            log.error("{} Échec du traitement : {}", TAG, e.getMessage(), e);
        } finally {
            log.debug("{} Traitement terminé en {} ms", TAG, dureeMs(debut));
        }
    }

    private void handleWebhookMessage(WhatsAppIncomingWebhook w) {
        String ctx = String.format("msg=%s canal=%s", w.messageId(), w.canalId());

        log.info("{} [{}] Début : evenement={}, deMoi={}, expediteur={}, nomExpediteur={}, texte={}",
                TAG, ctx, w.evenement(), w.deMoi(), w.expediteur(), w.nomExpediteur(), tailleTexte(w.texte()));

        // --- Étape 1 : validation ---
        if (StringUtils.isBlank(w.canalId()) || StringUtils.isBlank(w.messageId())) {
            log.warn("{} [{}] IGNORÉ : canalId ou messageId manquant (evenement={}, canalId={}, messageId={})",
                    TAG, ctx, w.evenement(), w.canalId(), w.messageId());
            return;
        }

        boolean groupe = w.canalGroupe();
        log.debug("{} [{}] Étape 1 OK : validation passée, groupe={}", TAG, ctx, groupe);

        // --- Étape 2 : liaison de compte (privé uniquement) ---
        if (groupe) {
            log.debug("{} [{}] Étape 2 : liaison de compte non tentée (message de groupe)", TAG, ctx);
        } else {
            log.debug("{} [{}] Étape 2 : tentative de liaison de compte (aperçu masqué, {})",
                    TAG, ctx, tailleTexte(w.texte()));
            if (tryLinkAccount(w)) {
                log.info("{} [{}] FIN : message de liaison traité, ni enregistré ni transmis plus loin", TAG, ctx);
                return;   // message de liaison : traité, ni enregistré ni transmis plus loin
            }
            log.debug("{} [{}] Étape 2 : pas un message de liaison, on continue", TAG, ctx);
        }

        // --- Étape 3 : assistant (message privé entrant) ---
        if (!groupe) {
            boolean entrant = estMessageEntrant(w);
            if (entrant) {
                log.info("{} [{}] Étape 3 : publication de DirectMessageReceivedEvent pour l'assistant ({})",
                        TAG, ctx, tailleTexte(w.texte()));
                try {
                    publisher.publishEvent(new DirectMessageReceivedEvent(
                            w.canalId(), w.texte(), w.nomExpediteur()));
                    log.debug("{} [{}] Étape 3 : événement assistant publié", TAG, ctx);
                } catch (RuntimeException e) {
                    log.error("{} [{}] Étape 3 : échec de publication de l'événement assistant : {}",
                            TAG, ctx, e.getMessage(), e);
                    throw e;
                }
            } else {
                log.debug("{} [{}] Étape 3 : message non entrant (deMoi={}, evenement={}) -> assistant non notifié",
                        TAG, ctx, w.deMoi(), w.evenement());
            }
        } else {
            log.debug("{} [{}] Étape 3 : assistant non notifié (message de groupe)", TAG, ctx);
        }

        // --- Étape 4 : doit-on persister ? ---
        if (!groupe && !persistDirectMessages) {
            log.info("{} [{}] FIN : message privé non enregistré (messaging.whatsapp.persist-direct-messages=false)",
                    TAG, ctx);
            return;
        }
        log.debug("{} [{}] Étape 4 : persistance autorisée (groupe={}, persistDirectMessages={})",
                TAG, ctx, groupe, persistDirectMessages);

        // --- Étape 5 : canal ---
        trouverOuCreerCanal(w, groupe);

        // --- Étape 6 : conversion + persistance ---
        WhatsAppRawMessage raw = adapter.toRawMessage(w);
        log.debug("{} [{}] Étape 6 : conversion webhook -> message brut effectuée", TAG, ctx);

        MessageDto dto = mapper.toMessageDto(raw, w.canalId());
        log.debug("{} [{}] Étape 6 : DTO prêt (mediaType={}, createdAt={}, expéditeur={}, texte={})",
                TAG, ctx, dto.getMediaType(), dto.getCreatedAt(), dto.getSenderDisplayName(), tailleTexte(dto.getText()));
        if (log.isTraceEnabled()) {
            log.trace("{} [{}] Aperçu du texte : {}", TAG, ctx, apercu(dto.getText()));
        }

        persistMessage(dto);
        log.info("{} [{}] FIN : traitement du webhook terminé", TAG, ctx);
    }


    private boolean estMessageEntrant(WhatsAppIncomingWebhook w) {
        if (w.deMoi()) {                                   // adapter : nom réel de l'accesseur
            return false;
        }
        return !"message.envoye".equals(w.evenement());
    }

    /**
     * Retrouve le canal par sa clé gateway, ou le crée. Synchronisé : deux webhooks
     * simultanés d'un nouveau canal ne doivent pas le créer deux fois.
     */
    private synchronized Canall trouverOuCreerCanal(WhatsAppIncomingWebhook w, boolean groupe) {
        Optional<Canall> existant = canallRepository.findByExternalId(w.canalId());
        if (existant.isPresent()) {
            log.debug("{} Canal déjà connu : {}", TAG, w.canalId());
            return existant.get();
        }

        log.info("{} Canal inconnu {} (groupe={}) : création à la volée", TAG, w.canalId(), groupe);

        CanalDto dto = null;

        if (groupe) {
            try {
                dto = getCanal(w.canalId());   // nom réel du groupe + membres
                log.debug("{} Détail du groupe {} récupéré (pseudo={}, membres={})",
                        TAG, w.canalId(), dto.getPseudo(),
                        dto.getMembers() == null ? 0 : dto.getMembers().size());
            } catch (Exception e) {
                log.warn("{} Détail du groupe {} indisponible, repli sur un canal minimal : {}",
                        TAG, w.canalId(), e.getMessage());
            }
        }

        if (dto == null) {
            String pseudo = groupe || StringUtils.isBlank(w.nomExpediteur()) ? w.canalId() : w.nomExpediteur();
            log.debug("{} Canal minimal construit pour {} (pseudo={}, groupe={})", TAG, w.canalId(), pseudo, groupe);
            dto = CanalDto.builder()
                    .externalId(w.canalId())
                    .pseudo(pseudo)
                    .typeCanal(TypeCanal.WHATSAPP.name())
                    .isGroup(groupe)
                    .build();
        }

        Canall canall = persistCanal(dto);
        log.info("{} Canal créé : {} (pseudo={}, groupe={})", TAG, dto.getExternalId(), dto.getPseudo(), groupe);

        try {
            persistMembers(dto);
        } catch (Exception e) {
            log.warn("{} Membres du canal {} non enregistrés : {}", TAG, w.canalId(), e.getMessage());
        }
        return canall;
    }

    // ---------- Synchronisation complète ----------

    @Override
    public void syncAll() {
        log.info("[WA-SYNC] Synchronisation complète : début");
        long debut = System.nanoTime();

        List<CanalDto> canaux = listCanaux();
        log.info("[WA-SYNC] {} canal(aux) à synchroniser", canaux.size());

        int[] compteur = {0, 0};   // [0] canaux OK, [1] canaux en échec partiel
        canaux.forEach(canalSummary -> {
            long debutCanal = System.nanoTime();
            try {
                CanalDto detail = getCanal(canalSummary.getExternalId());
                persistCanal(detail);
                persistMembers(detail);
                log.debug("[WA-SYNC] {} : détail et membres synchronisés", canalSummary.getExternalId());
            } catch (Exception e) {
                compteur[1]++;
                log.warn("[WA-SYNC] Échec sync détail/membres pour {} : {} (repli sur le résumé)",
                        canalSummary.getExternalId(), e.getMessage());
                persistCanal(canalSummary);
            }

            List<MessageDto> messages = listMessages(canalSummary.getExternalId(),
                    MessageQueryDto.builder().page(0).size(100).build());
            messages.forEach(this::persistMessage);
            compteur[0]++;
            log.info("[WA-SYNC] {} : {} message(s) traité(s) en {} ms",
                    canalSummary.getExternalId(), messages.size(), dureeMs(debutCanal));
        });

        log.info("[WA-SYNC] Synchronisation terminée : {} canal(aux) traité(s), {} avec repli, en {} ms",
                compteur[0], compteur[1], dureeMs(debut));
    }

    @Override
    public String getAvatarUrl(String externalId) {
        try {
            WhatsAppRawAvatarResponse response = client().get()
                    .uri("/api/whatsapp/contacts/{id}/photo", externalId)
                    .retrieve()
                    .body(WhatsAppRawAvatarResponse.class);

            if (response == null || !response.isSucces()) {
                log.debug("[WA] getAvatarUrl : pas d'avatar pour {} (response null={})", externalId, response == null);
                return null;
            }
            return response.getUrl();
        } catch (Exception e) {
            log.debug("Avatar indisponible pour {} : {}", externalId, e.getMessage());
            return null;
        }
    }

    // ---------- Persistance locale (upsert) ----------

    private Canall persistCanal(CanalDto dto) {
        Optional<Canall> existant = canallRepository.findByExternalId(dto.getExternalId());
        Canall canall = existant.orElseGet(Canall::new);
        canall.setExternalId(dto.getExternalId());
        canall.setPseudo(dto.getPseudo());
        canall.setTypeCanal(TypeCanal.WHATSAPP);
        Canall sauve = canallRepository.save(canall);
        log.debug("[WA-DB] Canal {} {} (pseudo={})",
                dto.getExternalId(), existant.isPresent() ? "mis à jour" : "créé", dto.getPseudo());
        return sauve;
    }

    private void persistMembers(CanalDto dto) {
        if (dto.getMembers() == null || dto.getMembers().isEmpty()) {
            log.debug("[WA-DB] persistMembers : aucun membre à enregistrer pour {}", dto.getExternalId());
            return;
        }

        Canall canall = canallRepository.findByExternalId(dto.getExternalId())
                .orElseThrow(() -> new IllegalStateException("Canal introuvable : " + dto.getExternalId()));

        log.debug("[WA-DB] persistMembers : {} membre(s) à enregistrer pour {}", dto.getMembers().size(), dto.getExternalId());
        if (dto.getMemberCount() == 0)
            return;
        if (!CollectionUtils.isEmpty(dto.getMembers())) {
            dto.getMembers().forEach(memberDto -> {
                Contact contact = upsertContact(memberDto);
                upsertCanalContact(canall, contact);
            });
            return;
        }



        log.info("[WA-DB] persistMembers : {} membre(s) enregistré(s) pour {}", dto.getMembers().size(), dto.getExternalId());
    }
    @Override
    public Contact upsertContact(MemberDto dto) {
        Optional<Contact> existant = contactRepository
                .findByTypeContactAndExternalId(TypeContact.WHATSAPP, dto.getExternalUserId());
        Contact contact = existant.orElseGet(Contact::new);

        contact.setTypeContact(TypeContact.WHATSAPP);
        contact.setExternalId(dto.getExternalUserId());
        contact.setValue(extractPhone(dto.getExternalUserId()));
        contact.setDisplayName(dto.getDisplayName());

        // Rattachement automatique : seulement si le contact n'a pas déjà d'utilisateur,
        // pour ne jamais écraser une liaison faite par code.
        if (contact.getUserApp() == null) {
            UserApp user = userService.findByPhone(contact.getValue());
            if (user != null) {
                contact.setUserApp(user);
                log.info("[WA-DB] Contact {} rattaché à l'utilisateur {}", contact.getValue(), user.getUsername());
            }
        }

        Contact sauve = contactRepository.save(contact);
        log.trace("[WA-DB] Contact {} {} (nom={})",
                dto.getExternalUserId(), existant.isPresent() ? "mis à jour" : "créé", dto.getDisplayName());
        return sauve;
    }

    private String extractPhone(String jid) {
        int at = jid.indexOf('@');
        return at > 0 ? jid.substring(0, at) : jid;
    }

    private void upsertCanalContact(Canall canall, Contact contact) {
        CanalContact link = canalContactRepository.findByCanallAndContact(canall, contact)
                .orElseGet(CanalContact::new);
        link.setCanall(canall);
        link.setContact(contact);
        canalContactRepository.save(link);
    }

    private void persistMessage(MessageDto dto) {
        String ctx = String.format("msg=%s canal=%s", dto.getExternalMessageId(), dto.getCanalExternalId());

        if (dto.getMediaType() == com.kinga.followtask.service.messaging.dto.MediaType.SYSTEM) {
            log.debug("[WA-DB] [{}] NON ENREGISTRÉ : message système", ctx);
            return;
        }
        if (messageAppRepository.existsByExternalMessageId(dto.getExternalMessageId())) {
            log.debug("[WA-DB] [{}] NON ENREGISTRÉ : déjà en base (doublon)", ctx);
            return;
        }

        Canall canall = canallRepository.findByExternalId(dto.getCanalExternalId())
                .orElseThrow(() -> {
                    log.error("[WA-DB] [{}] Canal introuvable en base au moment d'enregistrer le message", ctx);
                    return new IllegalStateException("Canal introuvable : " + dto.getCanalExternalId());
                });

        MessageApp message = new MessageApp();
        message.setExternalMessageId(dto.getExternalMessageId());
        if (StringUtils.isEmpty(dto.getText())) {
            log.debug("[WA-DB] [{}] NON ENREGISTRÉ : texte vide (mediaType={})", ctx, dto.getMediaType());
            return;
        }
        message.setCanall(canall);
        message.setText(dto.getText());
        message.setMediaType(dto.getMediaType().name());
        message.setCreated(dto.getCreatedAt() != null ? dto.getCreatedAt() : LocalDateTime.now());
        message.setFallbackSenderName(dto.getSenderDisplayName());
        messageAppRepository.save(message);
        log.info("[WA-DB] [{}] ENREGISTRÉ : mediaType={}, expéditeur={}, texte={}",
                ctx, dto.getMediaType(), dto.getSenderDisplayName(), tailleTexte(dto.getText()));
    }
    private boolean tryLinkAccount(WhatsAppIncomingWebhook w) {
        String texte = w.texte();                       // à adapter au nom réel de l'accesseur
        String externalId = w.canalId();

        if (!contactLinkService.looksLikeCode(texte)) {
            log.debug("[WA-LINK] [{}] Le texte ne ressemble pas à un code de liaison ({})", externalId, tailleTexte(texte));
            return false;
        }

        log.info("[WA-LINK] [{}] Le message ressemble à un code de liaison", externalId);

        if (contactLinkService.tropDEchecs(externalId)) {
            log.warn("Liaison WhatsApp : trop d'échecs pour {}, message ignoré", externalId);
            return true;                                // ignoré sans réponse
        }

        try {
            log.debug("[WA-LINK] [{}] Tentative de consommation du code (expéditeur={}, nom={})",
                    externalId, w.expediteur(), w.nomExpediteur());

            Optional<Contact> lie = contactLinkService.consumeFromMessage(
                    TypeContact.WHATSAPP,
                    texte,
                    externalId,
                    w.expediteur(),                     // numéro de téléphone du contact
                    w.nomExpediteur());                 // nom affiché, à adapter

            if (lie.isPresent()) {
                log.info("Compte WhatsApp lié : {}", externalId);
                repondre(externalId, "✅ Compte lié. Vous recevrez désormais vos notifications ici.");
            } else {
                log.info("[WA-LINK] [{}] Code invalide ou expiré", externalId);
                repondre(externalId, "Code invalide ou expiré. Générez-en un nouveau depuis votre profil.");
            }
        } catch (ContactDejaLieException e) {
            log.warn("[WA-LINK] [{}] Numéro déjà lié à un autre compte", externalId);
            repondre(externalId, "Ce numéro WhatsApp est déjà lié à un autre compte.");
        } catch (Exception e) {
            log.error("Erreur de liaison WhatsApp pour {}", externalId, e);
        }
        return true;
    }

    private void repondre(String externalId, String s) {
        SendMessageRequestDto body = SendMessageRequestDto.builder()
                .text(s)
                .build();
        log.debug("[WA] repondre : envoi d'une réponse automatique à {} ({})", externalId, tailleTexte(s));
        try {
            sendMessage(externalId, body);
        } catch (RuntimeException e) {
            // Une réponse automatique qui échoue ne doit pas faire échouer le traitement du webhook.
            log.error("[WA] repondre : échec de la réponse automatique à {} : {}", externalId, e.getMessage(), e);
        }
    }
}