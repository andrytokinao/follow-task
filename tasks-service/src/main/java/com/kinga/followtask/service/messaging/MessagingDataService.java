package com.kinga.followtask.service.messaging;

import com.kinga.followtask.entity.*;
import com.kinga.followtask.service.messaging.dto.AttachmentDto;
import com.kinga.followtask.service.messaging.dto.CanalDto;
import com.kinga.followtask.service.messaging.dto.MessageDto;
import com.kinga.followtask.service.messaging.dto.MessageQueryDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface MessagingDataService {
    List<CanalDto> listCanaux(TypeCanal type);
    CanalDto getCanal(TypeCanal type, String externalId);
    Page<MessageDto> listMessages(TypeCanal type, String canalExternalId, MessageQueryDto query);
    Page<MessageApp> listMessagesEntity(TypeCanal type, String canalExternalId, MessageQueryDto query);
    MessageDto getMessage(TypeCanal type, String externalMessageId);
    List<AttachmentDto> listAttachments(TypeCanal type, String canalExternalId); // si les métadonnées sont en DB
    public IssueMessageLink linkIssueToMessage(Long issueId, String externalMessageId,UserApp currentUser);
    public Boolean unlinkIssueFromMessage(Long linkId, UserApp currentUser);
    public IssueCanalLink linkIssueToCanal(Long issueId, String canalExternalId, UserApp currentUser);
    public Boolean unlinkIssueFromCanal(Long linkId, UserApp currentUser);

    List<IssueMessageLink> linkIssuesToMessages(List<Long> issueIds, List<String> externalMessageIds, UserApp user);
}