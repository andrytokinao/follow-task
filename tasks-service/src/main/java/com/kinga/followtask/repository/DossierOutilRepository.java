package com.kinga.followtask.repository;

import com.kinga.followtask.entity.DossierOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Dossiers du menu Outils (DT-019). « Visible depuis un espace » : partage
 * avec tous les espaces, ou cree dans cet espace.
 *
 * <p>Jointures {@code left join} explicites : un dossier partage n'a pas
 * d'espace, un dossier de premier niveau n'a pas de parent, et une jointure
 * implicite les ecarterait.</p>
 */
public interface DossierOutilRepository extends JpaRepository<DossierOutil, Long> {

    String DEPUIS = " from DossierOutil d left join d.project pr left join d.parent pa ";

    String VISIBLE = " d.deleted = false"
            + " and (d.portee = com.kinga.followtask.entity.enumapp.PorteeOutil.TOUS_LES_ESPACES"
            + "      or pr.id = :projectId) ";

    String SOUS = " d.typeOutil = :typeOutil"
            + " and ((:parentId is null and pa is null) or pa.id = :parentId) ";

    /** Sous-dossiers visibles d'un dossier, ou du dossier racine du type si parentId est null. */
    @Query("select d" + DEPUIS + "where" + VISIBLE + "and" + SOUS + "order by lower(d.nom)")
    List<DossierOutil> sousDossiersVisibles(@Param("projectId") Long projectId,
                                            @Param("typeOutil") TypeOutil typeOutil,
                                            @Param("parentId") Long parentId);

    /** Tous les dossiers visibles depuis l'espace : de quoi ecrire le chemin des resultats de recherche. */
    @Query("select d" + DEPUIS + "where" + VISIBLE)
    List<DossierOutil> visibles(@Param("projectId") Long projectId);

    /** Dossiers freres de meme nom, sans tenir compte de la casse ; pour refuser les doublons. */
    @Query("select d" + DEPUIS + "where d.deleted = false and" + SOUS + "and lower(d.nom) = lower(:nom)")
    List<DossierOutil> homonymes(@Param("typeOutil") TypeOutil typeOutil,
                                 @Param("parentId") Long parentId,
                                 @Param("nom") String nom);

    boolean existsByParentIdAndDeletedFalse(Long parentId);
}
