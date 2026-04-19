package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Document;
import com.kinga.followtask.entity.TypeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document,Long> {
    public List<Document> findByIssuesIdAndTypeDocumentAndDeleted(Long issueId, TypeDocument typeDocument,Boolean deleted);
    public List<Document> findByIssuesId(Long issueId);

    List<Document> findByParentIdAndDeleted(Long parentId, boolean b);
}
