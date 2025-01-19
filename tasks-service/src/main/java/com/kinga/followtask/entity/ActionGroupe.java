package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
public class ActionGroupe {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    @OneToMany (mappedBy = "actionGroupe")
    private List<ActionItem> actions;
    @ManyToOne
    private UserApp user;
    @ManyToOne
    private Issue issue;
    private Date created;
}
