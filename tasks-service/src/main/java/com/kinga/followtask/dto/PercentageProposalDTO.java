package com.kinga.followtask.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

// DTO retourné au front pour alimenter le dialogue
@Builder
@Data
public class PercentageProposalDTO {
    private int proposed;          // valeur mise en avant dans le slider
    private Integer lastKnown;     // dernier % connu (affiché en info)
    private Integer averageStep;   // pas moyen calculé (debug/info)
    private String reason;         // phrase explicative pour l'utilisateur
    private List<Integer> candidates; // boutons de sélection rapide
}