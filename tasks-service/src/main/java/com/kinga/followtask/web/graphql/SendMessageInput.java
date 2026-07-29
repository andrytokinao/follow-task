package com.kinga.followtask.web.graphql;

import com.kinga.followtask.service.messaging.dto.MediaType;

public record SendMessageInput(
        String text,
        String mediaUrl,
        MediaType mediaType
) {}