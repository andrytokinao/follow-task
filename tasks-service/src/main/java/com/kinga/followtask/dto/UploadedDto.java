package com.kinga.followtask.dto;

import com.kinga.followtask.entity.Document;
import com.kinga.utils.KingaUtils;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UploadedDto {
    private Long id;
    private String name;
    private String path;
    private String encodedPath;
}
