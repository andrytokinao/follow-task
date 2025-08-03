package com.kinga.followtask.lincense.repository;

import com.kinga.followtask.lincense.entity.LicenseInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.history.RevisionRepository;

import java.util.Optional;

public interface LicendeRepository extends JpaRepository<LicenseInfo, Long>, RevisionRepository<LicenseInfo, Long, Integer> {
  Optional<LicenseInfo> findTopByOrderByIdDesc();
}
