package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Fichier d'un outil (DT-019) : installeur, modele, video...
 *
 * <p>Sur le disque, le fichier porte un nom genere ({@code nomStockage}) :
 * le nom envoye par le navigateur n'entre jamais dans un chemin, ce qui ferme
 * la porte aux « ../ » et aux collisions. Le nom d'origine ne sert qu'a
 * l'affichage et au telechargement.</p>
 */
@Entity
@Table(name = "outil_fichier", indexes = {
        @Index(name = "ix_outil_fichier_outil", columnList = "outil_id")
})
@Getter
@Setter
@NoArgsConstructor
public class FichierOutil {

    public static final int NOM_MAX = 255;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "outil_id", nullable = false, foreignKey = @ForeignKey(name = "fk_outil_fichier_outil"))
    private Outil outil;

    @Column(name = "nom_origine", nullable = false, length = NOM_MAX)
    private String nomOrigine;

    @Column(name = "nom_stockage", nullable = false, length = 80, unique = true)
    private String nomStockage;

    @Column(name = "type_mime", length = 150)
    private String typeMime;

    @Column(name = "taille", nullable = false)
    private Long taille;

    @ManyToOne
    @JoinColumn(name = "user_app_id", nullable = false, foreignKey = @ForeignKey(name = "fk_outil_fichier_auteur"))
    private UserApp auteur;

    @Column(name = "date_ajout", nullable = false)
    private LocalDateTime dateAjout;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;
}
