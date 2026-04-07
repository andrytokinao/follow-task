package com.kinga.followtask.entity;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Label;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "issue_label",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_issue_label", columnNames = {"issue_id", "label_id"})
        },
        indexes = {
                @Index(name = "idx_issue_label_issue", columnList = "issue_id"),
                @Index(name = "idx_issue_label_label", columnList = "label_id")
        }
)
@Data
@NoArgsConstructor
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