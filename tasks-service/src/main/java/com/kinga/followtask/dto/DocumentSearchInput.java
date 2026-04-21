package com.kinga.followtask.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSearchInput {
    private List<String> typeDocuments;
    private Integer projectId;
    private List<Integer> issueIds;
    private List<String> memberUserIds;
    private String createdFrom;
    private String createdTo;
    private String keyword;
    private Boolean deleted;
}