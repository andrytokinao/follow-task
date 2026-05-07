package com.kinga.followtask.service;

import com.kinga.followtask.dto.DocumentPage;
import com.kinga.followtask.dto.DocumentSearchInput;
import com.kinga.followtask.dto.IssuePlanningSummary;
import com.kinga.followtask.entity.Document;
import com.kinga.followtask.entity.DocumentReadStatus;
import com.kinga.followtask.entity.DocumentUsageType;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.converter.IssueDocumentUsage;
import com.kinga.followtask.repository.DocumentReadStatusRepository;
import com.kinga.followtask.repository.DocumentRepository;
import com.kinga.followtask.repository.IssueDocumentUsageRepository;
import com.kinga.followtask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentReadStatusRepository readStatusRepo;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepo;
    private final IssueService issueService;
    private final IssueDocumentUsageRepository documentUsageRepository;

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
        List<String> typeDocuments  = search != null ? search.getTypeDocuments()  : null;
        Integer projectId    = search != null ? search.getProjectId()     : null;
        List<Integer> issueIds      = search != null ? search.getIssueIds()   : null;
        List<String> memberUserIds  = search != null ? search.getMemberUserIds()  : null;
        String keyword       =( search != null && search.getKeyword() != null) ? search.getKeyword().toLowerCase()       : null;
        String createdFrom   = search != null ? search.getCreatedFrom()   : null;
        String createdTo     = search != null ? search.getCreatedTo()     : null;
        Boolean deleted      = search != null ? search.getDeleted()       : null;

        Page<Document> result = documentRepository.searchDocuments(
                typeDocuments, projectId, issueIds, memberUserIds,
                keyword, createdFrom, createdTo, deleted, pageable
        );
        return toDocumentPage(result);
    }

    public DocumentPage getMyDocuments(String userId, DocumentSearchInput search, int page, int size) {
        List<String> userIds = userId != null
                ? Collections.singletonList(userId)
                : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "creation"));
        List<String> typeDocument  = search != null ? search.getTypeDocuments()  : null;
        Integer projectId    = search != null ? search.getProjectId()     : null;
        List<Integer> issueId      = search != null ? search.getIssueIds()       : null;
        String keyword       = search != null ? search.getKeyword().toLowerCase()   : null;
        String createdFrom   = search != null ? search.getCreatedFrom()   : null;
        String createdTo     = search != null ? search.getCreatedTo()     : null;
        Boolean deleted      = search != null ? search.getDeleted()       : null;

        Page<Document> result = documentRepository.findMyDocuments(
                userIds, typeDocument, projectId, issueId,
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

    public IssuePlanningSummary attachDocumentToIssue(Long issueId, Long documentId, List<String> usages) {
        List<IssueDocumentUsage> existing = documentUsageRepository.findByIssueIdAndDocumentId(issueId, documentId);
        IssueDocumentUsage usage = null;
        if (!CollectionUtils.isEmpty(existing)) {
            if (CollectionUtils.isEmpty(usages)) {
                documentUsageRepository.deleteAll(existing);
                return null;
            }

            usage = existing.get(1);
            if (existing.size() >1 ) {
                documentUsageRepository.deleteAll(existing);
            }
        } else {
            usage = new IssueDocumentUsage();
            Issue issue = new Issue();
            issue.setId(issueId);
            Document doc = new Document();
            doc.setId(documentId);
            usage.setIssue(issue);
            usage.setDocument(doc);
        }
        List<DocumentUsageType> usageTypes = usages.stream().map(DocumentUsageType::valueOf).collect(Collectors.toList());

        usage.setUsages(usageTypes);
        documentUsageRepository.save(usage);
        return issueService.getIssuePlanningSummary(issueId);
    }

    public List<IssueDocumentUsage> getAtachedDocumentIssue(Long documentId) {
        return documentUsageRepository.findByDocumentId(documentId);
    }
}
