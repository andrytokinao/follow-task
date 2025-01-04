package com.kinga.followtask.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Uploaded {
    private String name;
    private String encodedPath;
}
