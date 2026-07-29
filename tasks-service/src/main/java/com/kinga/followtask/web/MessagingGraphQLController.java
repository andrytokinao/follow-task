package com.kinga.followtask.web.graphql;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.MessagingServiceRegistry;
import com.kinga.followtask.service.messaging.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class MessagingGraphQLController {

    private final MessagingServiceRegistry registry;

    // ---------- Queries ----------

    @QueryMapping
    public List<CanalDto> listCanaux(@Argument TypeCanal type) {
        return registry.get(type).listCanaux();
    }

    @QueryMapping
    public CanalDto getCanal(@Argument TypeCanal type, @Argument String externalId) {
        return registry.get(type).getCanal(externalId);
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
        return registry.get(type).listMessages(canalExternalId, queryDto);
    }

    @QueryMapping
    public List<AttachmentDto> listAttachments(@Argument TypeCanal type, @Argument String canalExternalId) {
        return registry.get(type).listAttachments(canalExternalId);
    }

    // ---------- Mutations ----------

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