package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Phase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhaseRepository extends JpaRepository<Phase, Long> {
    /** Dans l'ordre de creation : c'est l'ordre d'affichage. */
    List<Phase> findByProjectIdOrderByIdAsc(Long projectId);
}
