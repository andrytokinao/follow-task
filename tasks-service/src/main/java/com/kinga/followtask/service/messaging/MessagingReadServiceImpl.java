package com.kinga.followtask.service.messaging;

import com.kinga.followtask.entity.Canall;
import com.kinga.followtask.entity.CanalContact;
import com.kinga.followtask.entity.MessageApp;
import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.repository.CanalContactRepository;
import com.kinga.followtask.repository.CanalRepository;
import com.kinga.followtask.repository.MessagesRepository;
import com.kinga.followtask.service.messaging.dto.AttachmentDto;
import com.kinga.followtask.service.messaging.dto.CanalDto;
import com.kinga.followtask.service.messaging.dto.MessageDto;
import com.kinga.followtask.service.messaging.dto.MessageQueryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessagingReadServiceImpl implements MessagingReadService {

    private final CanalRepository canallRepository;
    private final MessagesRepository messageAppRepository;
    private final CanalContactRepository canalContactRepository;
    private final MessagingMapper mapper;

    @Override
    public List<CanalDto> listCanaux(TypeCanal type) {
        return canallRepository.findByTypeCanal(type).stream()
                .map(mapper::toCanalDto)
                .toList();
    }

    @Override
    public CanalDto getCanal(TypeCanal type, String externalId) {
        Canall canall = canallRepository.findByExternalIdAfterAndTypeCanal(externalId, type)
                .orElseThrow(() -> new IllegalStateException("Canal introuvable : " + externalId));

        List<CanalContact> links = canalContactRepository.findByCanall(canall);
        return mapper.toCanalDetailDto(canall, links);
    }

    @Override
    public Page<MessageDto> listMessages(TypeCanal type, String canalExternalId, MessageQueryDto query) {
        Canall canall = canallRepository.findByExternalIdAndTypeCanal(canalExternalId, type)
                .orElseThrow(() -> new IllegalStateException("Canal introuvable : " + canalExternalId));

        Pageable pageable = PageRequest.of(query.getPage(), query.getSize(),
                Sort.by(Sort.Direction.DESC, "created"));

        Page<MessageApp> page = (query.getSince() != null || query.getUntil() != null)
                ? messageAppRepository.findByCanallAndCreatedBetween(
                canall, query.getSince(), query.getUntil(), pageable)
                : messageAppRepository.findByCanall(canall, pageable);

        return page.map(mapper::toMessageDto);
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
}