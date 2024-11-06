package com.kinga.followtask.dto;

import com.kinga.followtask.entity.CustomField;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.UserApp;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class    ValueDto {
    private Long id;
    private CustomField customField;
    private Issue issue;
    private String date;
    private String string;
    private UserApp user;
    private Integer numeric;
    private String text;
}
