package com.kinga.followtask.repository;

import com.kinga.followtask.entity.DocumentReadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface DocumentReadStatusRepository extends JpaRepository<DocumentReadStatus,Long> {
    @Query("""
    SELECT COUNT(d) FROM Document d
    WHERE d.parent.id = :parentId
      AND d.typeDocument = 'RESPONSE_DOCUMENT'
      AND d.deleted = false
      AND NOT EXISTS (
          SELECT r FROM DocumentReadStatus r
          WHERE r.document = d AND r.user.id = :userId
      )
""")
    long countUnreadResponses(@Param("parentId") Long parentId,
                              @Param("userId") Long userId);
    @Query("""
    SELECT d.parent.id, COUNT(d)
    FROM Document d
    WHERE d.parent.id IN :parentIds
      AND d.typeDocument = 'RESPONSE_DOCUMENT'
      AND d.deleted = false
      AND NOT EXISTS (
          SELECT r FROM DocumentReadStatus r
          WHERE r.document = d AND r.user.id = :userId
      )
    GROUP BY d.parent.id
""")
    List<Object[]> countUnreadByParents(@Param("parentIds") List<Long> parentIds,
                                        @Param("userId") Long userId);

    boolean existsByDocumentIdAndUserId(Long documentId, String userId);
}
