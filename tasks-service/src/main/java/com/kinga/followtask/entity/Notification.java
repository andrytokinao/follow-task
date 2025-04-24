package com.kinga.followtask.entity;

import ch.qos.logback.classic.pattern.DateConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titre ;
    @ManyToOne(fetch = FetchType.EAGER)
    private Project project;
    private String message;
    @Convert(converter = StringSetConverter.class)
    private Set<String> userIds;
    @Convert(converter = StringListConverter.class)
    private List<String> seenUserIds;
    @ManyToOne
    private ActionGroupe action;
}
