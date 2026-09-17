package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ActionItemRepository extends JpaRepository<ActionItem,Long> {

    /**
     * Historique d'une issue, du plus récent au plus ancien.
     *
     * L'issue est cherchée sur l'action et sur son groupe : selon le chemin de
     * création, c'est l'un ou l'autre qui a été renseigné en premier.
     *
     * Les actions sans date — antérieures à la correction de saveAction — sont
     * rangées en fin de liste, quel que soit le SGBD : sans « nulls last »,
     * certains les placeraient en tête, au-dessus des plus récentes.
     */
    @Query("""
            select a from ActionItem a
            left join fetch a.actionGroupe g
            where a.issue.id = :issueId or g.issue.id = :issueId
            order by g.created desc nulls last, a.id desc
            """)
    List<ActionItem> findHistoriqueByIssueId(@Param("issueId") Long issueId);
}
