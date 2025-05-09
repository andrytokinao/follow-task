package com.kinga.followtask.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Response {
    private String message;
    private String code;
    private String status;
}
