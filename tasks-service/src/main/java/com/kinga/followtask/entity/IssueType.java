package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.Niveau;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssueType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private String prefix;
    private Niveau level;
    @ManyToOne
    private Icone icone;
    @ManyToOne
    private Project project;
    private String style;
    private String color;

    @OneToMany(mappedBy = "issueType")
    private List<Issue> issues;
    @OneToMany(mappedBy = "issueType")
    private List<UsingCustomField> usingCustomFields;
    @ManyToOne
    private WorkFlow curentWorkFlow;

    /** Types principaux sous lesquels ce type peut etre utilise comme sous-tache. */
    @ManyToMany
    @JoinTable(name = "issue_type_parent_child",
            joinColumns = @JoinColumn(name = "child_id"),
            inverseJoinColumns = @JoinColumn(name = "parent_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"child_id", "parent_id"}))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<IssueType> parents;

    @ManyToMany(mappedBy = "parents")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<IssueType> children;

    /**
     * Ancienne relation OneToMany (colonne parent_id). Conservee uniquement pour
     * migrer les donnees existantes vers {@link #parents} au demarrage.
     */
    @Deprecated
    @ManyToOne
    @JoinColumn(name = "parent_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private IssueType legacyParent;

}
