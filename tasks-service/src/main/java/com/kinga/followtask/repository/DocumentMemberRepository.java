package com.kinga.followtask.repository;

import com.kinga.followtask.entity.DocumentMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentMemberRepository extends JpaRepository<DocumentMember, Long> {
  public List<DocumentMember> findByDocumentIdAndUserId(Long documentId, String userId);
}
