package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Uploaded;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UploadedRepository extends JpaRepository<Uploaded,Long> {
}
