package com.kinga.followtask.service;

import com.kinga.followtask.dto.DocumentPage;
import com.kinga.followtask.dto.DocumentSearchInput;
import com.kinga.followtask.entity.Document;
import com.kinga.followtask.entity.DocumentReadStatus;
import com.kinga.followtask.repository.DocumentReadStatusRepository;
import com.kinga.followtask.repository.DocumentRepository;
import com.kinga.followtask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    public DocumentPage searchDocuments(DocumentSearchInput search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "creation"));
        String typeDocument  = search != null ? search.getTypeDocument()  : null;
        Integer projectId    = search != null ? search.getProjectId()     : null;
        Integer issueId      = search != null ? search.getIssueId()       : null;
        String memberUserId  = search != null ? search.getMemberUserId()  : null;
        String keyword       = search != null ? search.getKeyword().toLowerCase()       : null;
        String createdFrom   = search != null ? search.getCreatedFrom()   : null;
        String createdTo     = search != null ? search.getCreatedTo()     : null;
        Boolean deleted      = search != null ? search.getDeleted()       : null;

        Page<Document> result = documentRepository.searchDocuments(
                typeDocument, projectId, issueId, memberUserId,
                keyword, createdFrom, createdTo, deleted, pageable
        );
        return toDocumentPage(result);
    }

    public DocumentPage getMyDocuments(String userId, DocumentSearchInput search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "creation"));
        String typeDocument  = search != null ? search.getTypeDocument()  : null;
        Integer projectId    = search != null ? search.getProjectId()     : null;
        Integer issueId      = search != null ? search.getIssueId()       : null;
        String keyword       = search != null ? search.getKeyword().toLowerCase()   : null;
        String createdFrom   = search != null ? search.getCreatedFrom()   : null;
        String createdTo     = search != null ? search.getCreatedTo()     : null;
        Boolean deleted      = search != null ? search.getDeleted()       : null;

        Page<Document> result = documentRepository.findMyDocuments(
                userId, typeDocument, projectId, issueId,
                keyword, createdFrom, createdTo, deleted, pageable
        );
        return toDocumentPage(result);
    }

    private DocumentPage toDocumentPage(Page<Document> page) {
        return new DocumentPage(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }
}
