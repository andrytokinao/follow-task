package com.kinga.followtask.dto;

/**
 * Dépendance d'une tâche vers une autre, pour le diagramme de Gantt du cockpit
 * de direction : une flèche de la tâche qui la porte vers {@code destinationId}.
 *
 * @param type          {@code LinkType} du lien : BLOCKS, PRECEDES, TRIGGERS
 * @param libelle       libellé lu depuis la source : « bloque », « précède »...
 * @param destinationId tâche qui dépend de celle-ci ; elle peut appartenir à
 *                      un autre projet, le diagramme ne la dessine alors pas
 */
public record DependanceTacheDTO(Long id,
                                 String type,
                                 String libelle,
                                 Long destinationId) {
}
