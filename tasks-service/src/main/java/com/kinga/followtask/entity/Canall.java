package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "canall", indexes = {
        @Index(name = "idx_canall_ext", columnList = "external_id, type_canal")
})
public class Canall {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "canal_seq")
    @SequenceGenerator(name = "canal_seq", allocationSize = 1)
    private Long id;

    @Column(name = "external_id", unique = true, length = 255)
    private String externalId;

    private String pseudo; // Nom du groupe WhatsApp ou Nom/Prénom de l'utilisateur Facebook

    @Enumerated(EnumType.STRING)
    @Column(name = "type_canal", nullable = false)
    private TypeCanal typeCanal;

    @OneToMany(mappedBy = "canall", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MessageApp> messageApp;

    @OneToMany(mappedBy = "canall", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CanalContact> members;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project projects;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_master_id")
    private Issue issueMaster;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();



    public List<String> getMembersIds() {
        if (CollectionUtils.isEmpty(members))
            return new ArrayList<>();
        return members.stream()
                .map(m -> m.getContact().getId())
                .collect(Collectors.toList());
    }
}