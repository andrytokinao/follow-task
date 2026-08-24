package com.kinga.followtask.service.messaging;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.dto.AttachmentDto;
import com.kinga.followtask.service.messaging.dto.CanalDto;
import com.kinga.followtask.service.messaging.dto.MessageDto;
import com.kinga.followtask.service.messaging.dto.MessageQueryDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface MessagingReadService {
    List<CanalDto> listCanaux(TypeCanal type);
    CanalDto getCanal(TypeCanal type, String externalId);
    Page<MessageDto> listMessages(TypeCanal type, String canalExternalId, MessageQueryDto query);
    MessageDto getMessage(TypeCanal type, String externalMessageId);
    List<AttachmentDto> listAttachments(TypeCanal type, String canalExternalId); // si les métadonnées sont en DB
}