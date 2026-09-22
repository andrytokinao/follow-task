package com.kinga.followtask.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Nouveau type a donner a une tache avant la suppression de son type actuel.
 */
@Data
@NoArgsConstructor
public class IssueTypeReassignmentInput {
    private Long issueId;
    private Long issueTypeId;
    /** Donne aussi a la tache une nouvelle cle avec le prefixe du nouveau type (PROJ-12 -> DATA-102). */
    private Boolean renameKey;
}
