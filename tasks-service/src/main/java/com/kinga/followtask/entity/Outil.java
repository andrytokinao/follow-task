package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Outil du menu Outils (DT-019) : logiciel, modele de document, tutoriel
 * video ou lien. Ses fichiers sont dans {@link FichierOutil}.
 *
 * <p>Table a part plutot que {@link Document} : un document appartient a la
 * messagerie et aux issues (membres, lecture, reponses), alors qu'un outil
 * peut n'appartenir a aucun espace de travail.</p>
 */
@Entity
@Table(name = "outil", indexes = {
        @Index(name = "ix_outil_rangement", columnList = "type_outil, dossier_id"),
        @Index(name = "ix_outil_project", columnList = "project_id")
})
@Getter
@Setter
@NoArgsConstructor
public class Outil implements RattachementOutil {

    public static final int TITRE_MAX = 200;
    public static final int URL_MAX = 2000;
    public static final int VERSION_MAX = 50;
    public static final int DESCRIPTION_MAX = 10000;
    public static final int ICONE_MAX = 100;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "titre", nullable = false, length = TITRE_MAX)
    private String titre;

    @Lob
    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_outil", nullable = false, length = 30)
    private TypeOutil typeOutil;

    @Enumerated(EnumType.STRING)
    @Column(name = "portee", nullable = false, length = 20)
    private PorteeOutil portee;

    /** Null : a la racine du dossier de son type. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", foreignKey = @ForeignKey(name = "fk_outil_dossier"))
    private DossierOutil dossier;

    @ManyToOne
    @JoinColumn(name = "project_id", foreignKey = @ForeignKey(name = "fk_outil_project"))
    private Project project;

    /** Lien de telechargement, video en ligne ou page web. */
    @Column(name = "url", length = URL_MAX)
    private String url;

    @Column(name = "version", length = VERSION_MAX)
    private String version;

    /**
     * Icone Font Awesome choisie pour l'outil (« fab fa-windows ») ; null :
     * celle de son type.
     */
    @Column(name = "icone", length = ICONE_MAX)
    private String icone;

    @ManyToOne
    @JoinColumn(name = "user_app_id", nullable = false, foreignKey = @ForeignKey(name = "fk_outil_auteur"))
    private UserApp auteur;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;
}
