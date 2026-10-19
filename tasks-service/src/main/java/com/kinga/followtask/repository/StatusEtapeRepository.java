package com.kinga.followtask.repository;

import com.kinga.followtask.entity.StatusEtape;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StatusEtapeRepository extends JpaRepository<StatusEtape, Long> {

    Optional<StatusEtape> findByStatusId(Long statusId);

    List<StatusEtape> findByStatusIdIn(Collection<Long> statusIds);
}
