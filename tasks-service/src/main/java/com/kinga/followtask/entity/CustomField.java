package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
public class CustomField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Convert(converter = StringListConverter.class)
    private List<String> options;
    @Convert(converter = StringListConverter.class)
    private List<String> configDisplay;
    @OneToMany(mappedBy = "customField")
    @EqualsAndHashCode.Exclude
    private List<UsingCustomField> issueTypes;
    private String type;
    @ManyToOne
    private Project project;
    /**
     * Portee du champ. Vide : le champ n'est utilise que par les types de tache
     * auxquels il est rattache un par un. {@link #PORTEE_PROJET} : tous les types
     * de son espace de travail. {@link #PORTEE_APPLICATION} : tous les types de
     * tous les espaces de travail.
     */
    private String portee;
    /**
     * Code stable d'un champ cree par l'application (date de demarrage,
     * deadline). Le nom reste modifiable : c'est par ce code que le reste de
     * l'application (diagramme de Gantt...) retrouve le champ.
     */
    private String code;

    public static final String PORTEE_PROJET = "PROJET";
    public static final String PORTEE_APPLICATION = "APPLICATION";
    public static final String CODE_DATE_DEMARRAGE = "DATE_DEMARRAGE";
    public static final String CODE_DEADLINE = "DEADLINE";

    /** Le champ s'applique-t-il d'office a tous les types, sans rattachement choisi ? */
    public boolean isCommun() {
        return PORTEE_PROJET.equals(portee) || PORTEE_APPLICATION.equals(portee);
    }
}
