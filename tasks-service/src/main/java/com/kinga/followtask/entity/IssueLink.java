package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class IssueLink {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id ;
    private LinkType type ;
    @ManyToOne
    private Issue source;
    @ManyToOne
    private Issue destination;
}
