package com.kinga.followtask.service.messaging.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageQueryDto {
    private int page;
    private int size;
    private LocalDateTime since;
    private LocalDateTime until;
}