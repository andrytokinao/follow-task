package com.kinga.followtask.service.messaging;

import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.*;
import com.kinga.followtask.service.messaging.dto.AttachmentDto;
import com.kinga.followtask.service.messaging.dto.CanalDto;
import com.kinga.followtask.service.messaging.dto.MessageDto;
import com.kinga.followtask.service.messaging.dto.MessageQueryDto;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessagingDataServiceImpl implements MessagingDataService {

    private final CanalRepository canallRepository;
    private final MessagesRepository messageAppRepository;
    private final CanalContactRepository canalContactRepository;
    private final MessagingMapper mapper;
    private final IssueCanalLinkRepository canalLinkRepository;
    private final IssueMessageLinkRepository messageLinkRepository;
    private final IssueRepository issueRepository;

    @Override
    public List<CanalDto> listCanaux(TypeCanal type) {
        return canallRepository.findByTypeCanal(type).stream()
                .map(mapper::toCanalDto)
                .toList();
    }

    @Override
    public CanalDto getCanal(TypeCanal type, String externalId) {
        Canall canall = canallRepository.findByExternalIdAndTypeCanal(externalId, type)
                .orElseThrow(() -> new IllegalStateException("Canal introuvable : " + externalId));

        List<CanalContact> links = canalContactRepository.findByCanall(canall);
        // Seuls les liens encore ouverts : unlinkIssueFromCanal clôture le lien
        // (endedAt) au lieu de le supprimer, canall.getIssueLinks() remonterait
        // donc aussi les liaisons déjà retirées.
        List<IssueCanalLink> issueLinks = canalLinkRepository.findByCanalIdAndEndedAtIsNull(canall.getId());
        return mapper.toCanalDetailDto(canall, links, issueLinks);
    }

    @Override
    public Page<MessageDto> listMessages(TypeCanal type, String canalExternalId, MessageQueryDto query) {

        Page<MessageApp> page = listMessagesEntity(type, canalExternalId, query);
        return page.map(mapper::toMessageDto);
    }

    @Override
    public Page<MessageApp> listMessagesEntity(TypeCanal type, String canalExternalId, MessageQueryDto query) {
        Canall canall = canallRepository.findByExternalIdAndTypeCanal(canalExternalId, type)
                .orElseThrow(() -> new IllegalStateException("Canal introuvable : " + canalExternalId));

        Pageable pageable = PageRequest.of(query.getPage(), query.getSize(),
                Sort.by(Sort.Direction.DESC, "created"));

        Page<MessageApp> page = (query.getSince() != null || query.getUntil() != null)
                ? messageAppRepository.findByCanallAndCreatedBetween(
                canall, query.getSince(), query.getUntil(), pageable)
                : messageAppRepository.findByCanall(canall, pageable);
        return page;
    }

    @Override
    public MessageDto getMessage(TypeCanal type, String externalMessageId) {
        return messageAppRepository.findByExternalMessageId(externalMessageId)
                .map(mapper::toMessageDto)
                .orElseThrow(() -> new IllegalStateException("Message introuvable : " + externalMessageId));
    }

    @Override
    public List<AttachmentDto> listAttachments(TypeCanal type, String canalExternalId) {
        // métadonnées d'attachments non persistées pour l'instant (cf. décision précédente) :
        // déléguer au provider live plutôt que renvoyer une liste vide trompeuse.
        throw new UnsupportedOperationException(
                "listAttachments doit encore passer par MessagingServiceRegistry.get(type) tant que les pièces jointes ne sont pas persistées");
    }

    // ---------- Issue <-> Message ----------

    @Override
    public IssueMessageLink linkIssueToMessage(Long issueId, String externalMessageId, UserApp currentUser) {
        MessageApp message = messageAppRepository.findByExternalMessageId(externalMessageId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Message non trouvé/synchronisé : " + externalMessageId));

        Optional<IssueMessageLink> existing =
                messageLinkRepository.findByIssueIdAndMessageId(issueId, message.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        IssueMessageLink link = new IssueMessageLink();
        link.setIssue(issueRepository.getReferenceById(issueId));
        link.setMessage(message);
        link.setLinkedAt(LocalDateTime.now());
        link.setLinkedBy(currentUser);

        return messageLinkRepository.save(link);
    }

    @Override
    public Boolean unlinkIssueFromMessage(Long linkId, UserApp currentUser) {
        if (!messageLinkRepository.existsById(linkId)) {
            return false;
        }
        messageLinkRepository.deleteById(linkId);
        return true;
    }

    // ---------- Issue <-> Canal ----------

    @Override
    public IssueCanalLink linkIssueToCanal(Long issueId, String canalExternalId, UserApp currentUser) {
        Canall canal = canallRepository.findByExternalId(canalExternalId)
                .orElseThrow(() -> new EntityNotFoundException("Canal introuvable : " + canalExternalId));

        // Un lien "actif" = pas encore terminé (endedAt == null).
        Optional<IssueCanalLink> existing =
                canalLinkRepository.findByIssueIdAndCanalIdAndEndedAtIsNull(issueId, canal.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        LocalDateTime now = LocalDateTime.now();
        IssueCanalLink link = new IssueCanalLink();
        link.setIssue(issueRepository.getReferenceById(issueId));
        link.setCanal(canal);
        link.setSince(now);
        link.setLinkedAt(now);
        link.setLinkedBy(currentUser);

        return canalLinkRepository.save(link);
    }

    @Override
    public Boolean unlinkIssueFromCanal(Long linkId, UserApp currentUser) {
        Optional<IssueCanalLink> link = canalLinkRepository.findById(linkId);
        if (link.isEmpty()) {
            return false;
        }
        // Lien basé sur une période (since/endedAt) : on clôture plutôt que de supprimer,
        // pour conserver l'historique des messages déjà associés pendant cette période.
        link.get().setEndedAt(LocalDateTime.now());
        canalLinkRepository.save(link.get());
        return true;
    }

    @Override
    public List<IssueMessageLink> linkIssuesToMessages(List<Long> issueIds, List<String> externalMessageIds, UserApp user) {
        List<IssueMessageLink> messageLinks = new ArrayList<>();
        for (Long issueId: issueIds) {
            for (String externalId : externalMessageIds) {
                messageLinks.add(linkIssueToMessage(issueId,externalId,user));
            }
        }
        return messageLinks;
    }

    @Override
    public List<IssueCanalLink> linkIssuesToCanal(List<Long> issueIds, String canalExternalId, UserApp user) {
        List<IssueCanalLink> canalLinks = new ArrayList<>();
        if (issueIds == null) {
            return canalLinks;
        }
        for (Long issueId : issueIds) {
            canalLinks.add(linkIssueToCanal(issueId, canalExternalId, user));
        }
        return canalLinks;
    }
}