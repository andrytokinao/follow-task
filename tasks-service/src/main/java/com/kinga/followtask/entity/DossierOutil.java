package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Dossier du menu Outils (DT-019), cree par un utilisateur sous un type
 * d'outil (dossier racine fixe), sur deux niveaux au plus.
 *
 * <p>Noms de table et de colonnes ecrits en toutes lettres : renommer un
 * attribut Java ne doit jamais renommer, ni dupliquer, une colonne en base.</p>
 */
@Entity
@Table(name = "dossier_outil", indexes = {
        @Index(name = "ix_dossier_outil_rangement", columnList = "type_outil, parent_id"),
        @Index(name = "ix_dossier_outil_project", columnList = "project_id")
})
@Getter
@Setter
@NoArgsConstructor
public class DossierOutil implements RattachementOutil {

    public static final int NOM_MAX = 120;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "nom", nullable = false, length = NOM_MAX)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_outil", nullable = false, length = 30)
    private TypeOutil typeOutil;

    @Enumerated(EnumType.STRING)
    @Column(name = "portee", nullable = false, length = 20)
    private PorteeOutil portee;

    /** Null : directement sous le dossier racine du type. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", foreignKey = @ForeignKey(name = "fk_dossier_outil_parent"))
    private DossierOutil parent;

    @ManyToOne
    @JoinColumn(name = "project_id", foreignKey = @ForeignKey(name = "fk_dossier_outil_project"))
    private Project project;

    @ManyToOne
    @JoinColumn(name = "user_app_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dossier_outil_auteur"))
    private UserApp auteur;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;
}
