package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Document;
import com.kinga.followtask.entity.TypeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document,Long> {
    public List<Document> findByIssuesIdAndTypeDocument(Long issueId, TypeDocument typeDocument);
}
