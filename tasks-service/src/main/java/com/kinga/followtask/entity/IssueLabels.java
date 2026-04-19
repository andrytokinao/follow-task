package com.kinga.followtask.entity;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Label;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Data
public class IssueLabels {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(optional = false)
    @JoinColumn(name = "label_id", nullable = false)
    private Label label;
}