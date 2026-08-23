package com.kinga.followtask.web;

import com.kinga.followtask.dto.IssueCanalMessagesDto;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.service.IssueLinkService;
import com.kinga.followtask.service.IssueMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/issues/{issueId}")
public class IssueMessageController {

    private final IssueMessageService issueMessageService;
    private final IssueLinkService issueLinkService;

    // ---------- Lecture (données persistées, groupées par canal) ----------

    @GetMapping("/messages")
    public List<IssueCanalMessagesDto> getMessages(
            @PathVariable Long issueId,
            @AuthenticationPrincipal UserApp currentUser
    ) {
        return issueMessageService.getMessagesGroupedByCanal(issueId, currentUser);
    }

    // ---------- Liaison canal ----------

    @PostMapping("/canals/{canalId}/link")
    public void linkCanal(
            @PathVariable Long issueId,
            @PathVariable Long canalId,
            @AuthenticationPrincipal UserApp currentUser
    ) {
        issueLinkService.linkCanalToIssue(canalId, issueId, currentUser);
    }

    @DeleteMapping("/canals/{canalId}/link")
    public void unlinkCanal(@PathVariable Long issueId, @PathVariable Long canalId) {
        issueLinkService.unlinkCanalFromIssue(canalId, issueId);
    }


    @PostMapping("/messages/{messageId}/link")
    public void linkMessage(
            @PathVariable Long issueId,
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserApp currentUser
    ) {
        issueLinkService.linkMessageToIssue(messageId, issueId, currentUser);
    }
}