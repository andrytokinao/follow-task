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
      AND (:typeDocuments IS NULL OR d.typeDocument IN :typeDocuments)
      AND (:projectId IS NULL OR d.project.id = :projectId)
      AND (:issueIds IS NULL OR d.issues.id IN :issueIds)
      AND (:memberUserIds IS NULL OR dm.user.id IN :memberUserIds)
      AND (:keyword IS NULL
           OR d.titre LIKE :keyword
           OR d.description LIKE :keyword)
      AND (:createdFrom IS NULL OR d.creation >= :createdFrom)
      AND (:createdTo IS NULL OR d.creation <= :createdTo)
      AND (:deleted IS NULL OR d.deleted = :deleted)
""")
    Page<Document> searchDocuments(
            @Param("typeDocuments") List<String> typeDocuments,
            @Param("projectId") Integer projectId,
            @Param("issueIds") List<Integer> issueIds,
            @Param("memberUserIds") List<String> memberUserIds,
            @Param("keyword") String keyword,
            @Param("createdFrom") String createdFrom,
            @Param("createdTo") String createdTo,
            @Param("deleted") Boolean deleted,
            Pageable pageable
    );

    @Query("""
    SELECT DISTINCT d FROM Document d
    LEFT JOIN d.documentMembers dm
    WHERE d.parent IS NULL
      AND (:userIds IS NULL OR dm.user.id IN :userIds)
      AND (:typeDocuments IS NULL OR d.typeDocument IN :typeDocuments)
      AND (:projectId IS NULL OR d.project.id = :projectId)
      AND (:issueIds IS NULL OR d.issues.id IN :issueIds)
      AND (:keyword IS NULL
           OR d.titre LIKE :keyword
           OR d.description LIKE :keyword)
      AND (:createdFrom IS NULL OR d.creation >= :createdFrom)
      AND (:createdTo IS NULL OR d.creation <= :createdTo)
      AND (:deleted IS NULL OR d.deleted = :deleted)
""")
    Page<Document> findMyDocuments(
            @Param("userIds") List<String> userIds,
            @Param("typeDocuments") List<String> typeDocuments,
            @Param("projectId") Integer projectId,
            @Param("issueIds") List<Integer> issueIds,
            @Param("keyword") String keyword,
            @Param("createdFrom") String createdFrom,
            @Param("createdTo") String createdTo,
            @Param("deleted") Boolean deleted,
            Pageable pageable
    );
}