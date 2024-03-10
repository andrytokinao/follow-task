package com.kinga.tasksservice.service;

import com.kinga.tasksservice.entity.Comment;
import com.kinga.tasksservice.entity.Issue;
import com.kinga.tasksservice.entity.Status;
import com.kinga.tasksservice.repository.CommentRepository;
import com.kinga.tasksservice.repository.IssueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IssueService {
    @Autowired
    public IssueRepository issueRepository;
    @Autowired
    public CommentRepository commentRepository;
    @Autowired
    public StatusService statusService;
    public Issue save(Issue issue){
        if(issue.getStatus() == null){
            Status status = statusService.getById(1L);
            if(status != null)
                issue.setStatus(status);
        }
        return issueRepository.save(issue);
    }
    public List<Issue> findAllIssue(){
        return issueRepository.findAll();
    }
    public List<Issue> findByAssigneId(String id){
        return issueRepository.findByAssigneId(id);
    }

    public List<Comment> allComment(Long issueId) {
         return commentRepository.findByIssueId(issueId);
    }
    public List<Comment> addComment(Comment comment) {
       commentRepository.save(comment);
       return commentRepository.findByIssueId(comment.getIssue().getId());
    }
}
