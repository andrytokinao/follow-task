package com.kinga.followtask.web;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.MessagingReadService;
import com.kinga.followtask.service.messaging.MessagingServiceRegistry;
import com.kinga.followtask.service.messaging.dto.*;
import com.kinga.followtask.web.graphql.MessageQueryInput;
import com.kinga.followtask.web.graphql.SendMessageInput;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class MessagingGraphQLController {

    private final MessagingServiceRegistry registry;   // sync, send (actions live)
    private final MessagingReadService readService;     // toute la lecture (DB)

    // ---------- Queries (lecture DB) ----------

    @QueryMapping
    public List<CanalDto> listCanaux(@Argument TypeCanal type) {
        return readService.listCanaux(type);
    }

    @QueryMapping
    public CanalDto getCanal(@Argument TypeCanal type, @Argument String externalId) {
        return readService.getCanal(type, externalId);
    }

    @QueryMapping
    public List<MessageDto> listMessages(
            @Argument TypeCanal type,
            @Argument String canalExternalId,
            @Argument MessageQueryInput query
    ) {
        MessageQueryDto queryDto = MessageQueryDto.builder()
                .page(query != null && query.page() != null ? query.page() : 0)
                .size(query != null && query.size() != null ? query.size() : 20)
                .since(query != null ? query.since() : null)
                .until(query != null ? query.until() : null)
                .build();

        Page<MessageDto> page = readService.listMessages(type, canalExternalId, queryDto);
        return page.getContent();
    }

    @QueryMapping
    public MessageDto getMessage(@Argument TypeCanal type, @Argument String externalMessageId) {
        return readService.getMessage(type, externalMessageId);
    }

    @QueryMapping
    public List<AttachmentDto> listAttachments(@Argument TypeCanal type, @Argument String canalExternalId) {
        return readService.listAttachments(type, canalExternalId);
    }

    // ---------- Mutations (écriture / actions live) ----------

    @MutationMapping
    public MessageDto sendExternalMessage(
            @Argument TypeCanal type,
            @Argument String canalExternalId,
            @Argument SendMessageInput input
    ) {
        SendMessageRequestDto request = SendMessageRequestDto.builder()
                .text(input.text())
                .mediaUrl(input.mediaUrl())
                .mediaType(input.mediaType() != null ? input.mediaType().name() : null)
                .build();
        return registry.get(type).sendMessage(canalExternalId, request);
    }

    @MutationMapping
    public boolean syncCanal(@Argument TypeCanal type) {
        registry.get(type).syncAll();
        return true;
    }
}