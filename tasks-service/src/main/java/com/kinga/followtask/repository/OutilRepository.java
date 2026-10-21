package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Outil;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Outils du menu Outils (DT-019). « Visible depuis un espace » : partage avec
 * tous les espaces, ou cree dans cet espace.
 *
 * <p>Jointures {@code left join} explicites : un outil partage n'a pas
 * d'espace, un outil a la racine n'a pas de dossier.</p>
 */
public interface OutilRepository extends JpaRepository<Outil, Long> {

    String DEPUIS = " from Outil o left join o.project pr left join o.dossier d left join d.project dpr ";

    String VISIBLE = " o.deleted = false"
            + " and (o.portee = com.kinga.followtask.entity.enumapp.PorteeOutil.TOUS_LES_ESPACES"
            + "      or pr.id = :projectId) ";

    /** Outils visibles rangés directement dans le dossier. */
    @Query("select o" + DEPUIS + "where" + VISIBLE
            + " and o.typeOutil = :typeOutil and d.id = :dossierId"
            + " order by lower(o.titre)")
    List<Outil> visiblesDansDossier(@Param("projectId") Long projectId,
                                    @Param("typeOutil") TypeOutil typeOutil,
                                    @Param("dossierId") Long dossierId);

    /**
     * Outils visibles a la racine du type : ceux sans dossier, et ceux dont le
     * dossier a disparu ou n'est pas visible depuis l'espace. Un outil n'est
     * jamais perdu dans un dossier qu'on ne peut pas ouvrir.
     */
    @Query("select o" + DEPUIS + "where" + VISIBLE
            + " and o.typeOutil = :typeOutil"
            + " and (d is null or d.deleted = true"
            + "      or (d.portee = com.kinga.followtask.entity.enumapp.PorteeOutil.ESPACE"
            + "          and (dpr is null or dpr.id <> :projectId)))"
            + " order by lower(o.titre)")
    List<Outil> visiblesALaRacine(@Param("projectId") Long projectId,
                                  @Param("typeOutil") TypeOutil typeOutil);

    /** Recherche a plat, tous types et dossiers confondus, sur le titre, la description et la version. */
    @Query("select o" + DEPUIS + "where" + VISIBLE
            + " and (lower(o.titre) like lower(concat('%', :texte, '%'))"
            + "      or lower(o.description) like lower(concat('%', :texte, '%'))"
            + "      or lower(o.version) like lower(concat('%', :texte, '%')))"
            + " order by lower(o.titre)")
    List<Outil> rechercher(@Param("projectId") Long projectId, @Param("texte") String texte);

    boolean existsByDossierIdAndDeletedFalse(Long dossierId);
}
