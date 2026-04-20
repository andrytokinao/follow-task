package com.kinga.followtask.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSearchInput {
    private String typeDocument;
    private Integer projectId;
    private Integer issueId;
    private String memberUserId;
    private String createdFrom;
    private String createdTo;
    private String keyword;
    private Boolean deleted;
}