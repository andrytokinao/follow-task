package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "action_type", discriminatorType = DiscriminatorType.STRING)
@Data
@NoArgsConstructor
public abstract class ActionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "action_type")
    @Transient
    private ActionType actionType;
    @ManyToOne
    private ActionGroupe actionGroupe;
    @Convert(converter = MapToJsonConverter.class)
    private Map<String,String> details;

}
