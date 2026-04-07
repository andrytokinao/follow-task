package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "label",
        indexes = {
                @Index(name = "idx_label_project", columnList = "project_id")
        }
)
@Data
@NoArgsConstructor
public class Label {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(length = 50)
    private String style;

    @Column(length = 20)
    private String color;

    @ManyToOne
    @JoinColumn(name = "icone_id")
    private Icone icone;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
}