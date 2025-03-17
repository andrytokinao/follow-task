package com.kinga.followtask.entity;

import com.kinga.followtask.entity.converter.IssueCriteriaCoverter;
import com.kinga.followtask.repository.criteria.IssueSearchCriteria;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssueFilter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Long projectId;
    private String description;
    @Lob
    @Convert(converter = IssueCriteriaCoverter.class)
    @Column(columnDefinition = "LONGTEXT")
    private IssueSearchCriteria criteria;
    @ManyToOne
    private UserApp user;
}
