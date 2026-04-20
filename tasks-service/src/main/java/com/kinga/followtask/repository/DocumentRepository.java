package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Document;
import com.kinga.followtask.entity.TypeDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByIssuesIdAndTypeDocumentAndDeleted(Long issueId, TypeDocument typeDocument, Boolean deleted);
    List<Document> findByIssuesId(Long issueId);
    List<Document> findByParentIdAndDeleted(Long parentId, boolean deleted);

    @Query("""
        SELECT DISTINCT d FROM Document d
        LEFT JOIN d.documentMembers dm
        WHERE d.parent IS NULL
          AND (:typeDocument IS NULL OR CAST(d.typeDocument AS String) = :typeDocument)
          AND (:projectId    IS NULL OR d.project.id = :projectId)
          AND (:issueId      IS NULL OR d.issues.id  = :issueId)
          AND (:memberUserId IS NULL OR dm.user.id   = :memberUserId)
          AND (:keyword      IS NULL
               OR d.titre       LIKE :keyword
               OR d.description LIKE :keyword)
          AND (:createdFrom  IS NULL OR d.creation >= :createdFrom)
          AND (:createdTo    IS NULL OR d.creation <= :createdTo)
          AND (:deleted      IS NULL OR d.deleted  = :deleted)
    """)
    Page<Document> searchDocuments(
            @Param("typeDocument")  String typeDocument,
            @Param("projectId")     Integer projectId,
            @Param("issueId")       Integer issueId,
            @Param("memberUserId")  String memberUserId,
            @Param("keyword")       String keyword,
            @Param("createdFrom")   String createdFrom,
            @Param("createdTo")     String createdTo,
            @Param("deleted")       Boolean deleted,
            Pageable pageable
    );

    @Query("""
        SELECT DISTINCT d FROM Document d
        LEFT JOIN d.documentMembers dm
        WHERE d.parent IS NULL
          AND (d.userApp.id = :userId OR dm.user.id = :userId)
          AND (:typeDocument IS NULL OR CAST(d.typeDocument AS String) = :typeDocument)
          AND (:projectId    IS NULL OR d.project.id = :projectId)
          AND (:issueId      IS NULL OR d.issues.id  = :issueId)
          AND (:keyword      IS NULL
               OR d.titre       LIKE :keyword
               OR d.description LIKE :keyword)
          AND (:createdFrom  IS NULL OR d.creation >= :createdFrom)
          AND (:createdTo    IS NULL OR d.creation <= :createdTo)
          AND (:deleted      IS NULL OR d.deleted  = :deleted)
    """)
    Page<Document> findMyDocuments(
            @Param("userId")       String userId,
            @Param("typeDocument") String typeDocument,
            @Param("projectId")    Integer projectId,
            @Param("issueId")      Integer issueId,
            @Param("keyword")      String keyword,
            @Param("createdFrom")  String createdFrom,
            @Param("createdTo")    String createdTo,
            @Param("deleted")      Boolean deleted,
            Pageable pageable
    );
}