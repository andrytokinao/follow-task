package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity(name = "issue_label")
@Data
@NoArgsConstructor
public class IssueLabels {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private Issue issue;
    @ManyToOne
    private Label label;
}
