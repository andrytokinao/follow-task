package com.kinga.followtask.service;

import com.kinga.followtask.entity.Document;
import com.kinga.followtask.entity.DocumentReadStatus;
import com.kinga.followtask.repository.DocumentReadStatusRepository;
import com.kinga.followtask.repository.DocumentRepository;
import com.kinga.followtask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentReadStatusRepository readStatusRepo;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepo;

    public void markAsRead(Long documentId, String userId) {
        boolean exists = readStatusRepo.existsByDocumentIdAndUserId(documentId, userId);
        if (!exists) {
            DocumentReadStatus status = new DocumentReadStatus();
            status.setDocument(documentRepository.getReferenceById(documentId));
            status.setUser(userRepo.findById(userId).orElse(null));
            status.setReadAt(LocalDateTime.now());
            readStatusRepo.save(status);
        }
    }
    public void markThreadAsRead(Long parentId, String userId) {
        List<Document> responses = documentRepository.findByParentIdAndDeleted(parentId, false);
        responses.forEach(doc -> markAsRead(doc.getId(), userId));
        markAsRead(parentId, userId);
    }
    public Document loadDocumentById(Long documentId) {
        return this.documentRepository.getById(documentId);
    }
}
