package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Phase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PhaseRepository extends JpaRepository<Phase, Long> {

    /**
     * Phases proposees dans un espace de travail : les siennes et les phases
     * communes, dans l'ordre du projet (rang, puis ordre de creation).
     */
    @Query("select p from Phase p left join p.project pr"
            + " where pr.id = :projectId or pr is null"
            + " order by coalesce(p.position, 2147483647), p.id")
    List<Phase> findVisibles(@Param("projectId") Long projectId);

    /** Phases deja liees au statut : un statut ne designe qu'une phase. */
    List<Phase> findByStatuses_Id(Long statusId);

    @Query("select coalesce(max(p.position), 0) from Phase p")
    int findMaxPosition();
}
