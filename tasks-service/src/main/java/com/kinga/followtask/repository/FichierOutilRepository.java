package com.kinga.followtask.repository;

import com.kinga.followtask.entity.FichierOutil;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/** Fichiers des outils (DT-019). */
public interface FichierOutilRepository extends JpaRepository<FichierOutil, Long> {

    List<FichierOutil> findByOutilIdAndDeletedFalseOrderByDateAjoutAsc(Long outilId);

    /** Fichiers de plusieurs outils en une requete, pour une page de dossier. */
    List<FichierOutil> findByOutilIdInAndDeletedFalseOrderByDateAjoutAsc(Collection<Long> outilIds);
}
