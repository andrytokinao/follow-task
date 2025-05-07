package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Uploaded;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UploadedRepository extends JpaRepository<Uploaded,Long> {
    public List<Uploaded> findByDocumentId(Long documentId);
}
