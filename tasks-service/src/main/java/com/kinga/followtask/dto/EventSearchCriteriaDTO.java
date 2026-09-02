package com.kinga.followtask.dto;

import com.kinga.followtask.entity.CustomField;
import com.kinga.followtask.entity.enumapp.Niveau;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
@Data
public class EventSearchCriteriaDTO {

    private List<String> userIds;
    private List<Long> issueIds;
    private List<Long> parrentIds;
    private List<Long> customFieldIds;
    private Long projectId;
    private LocalDateTime start;
    private LocalDateTime end;
    /**
     * Restreint les dates issues des champs personnalisés au niveau de tâche
     * demandé. Vide : tous les niveaux, comportement d'origine.
     */
    private List<Niveau> issueTypeLevels;
    public EventSearchCriteriaDTO(){

    }
}
