package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
public class CustomField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Convert(converter = StringListConverter.class)
    private List<String> options;
    @Convert(converter = StringListConverter.class)
    private List<String> configDisplay;
    @OneToMany
    @EqualsAndHashCode.Exclude
    private List<UsingCustomField> issueTypes;
    private String type;
    @ManyToOne
    private Project project;
}
