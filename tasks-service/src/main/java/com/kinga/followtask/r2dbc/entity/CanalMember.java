package com.kinga.followtask.r2dbc.entity;

import com.kinga.followtask.entity.Canall;
import com.kinga.followtask.entity.StringListConverter;
import com.kinga.followtask.entity.UserApp;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.util.List;

@Data
@NoArgsConstructor
@Table
public class CanalMember {
    @Id
    private Long id;
    private UserApp user;
    private Canall canall;
    private List<String> credentials;

}
