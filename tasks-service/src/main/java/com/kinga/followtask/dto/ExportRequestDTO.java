package com.kinga.followtask.dto;

import lombok.Data;

import java.util.List;

/**
 * Demande d'export d'une liste de demandes vers un classeur Excel.
 *
 * Le client envoie les identifiants qu'il affiche : ce qui est filtré à l'écran
 * est exactement ce qui part dans le fichier, sans rejouer la recherche côté
 * serveur au risque d'un résultat différent.
 */
@Data
public class ExportRequestDTO {

    private List<Long> issueIds;

    /**
     * Clés de colonnes retenues, dans l'ordre d'affichage souhaité.
     * Vide : toutes les colonnes standard.
     */
    private List<String> columns;

    /** Nom de la feuille principale. */
    private String sheetName;

    /** Ajouter la feuille « Sous-tâches ». */
    private Boolean includeSubtasks;
}
