package com.kinga.followtask.dto;

import lombok.Data;

import java.util.List;

/** Criteres de la recherche paginee d'utilisateurs. */
@Data
public class UserSearchDTO {
    /** Recherche libre sur nom, prenom, identifiant, e-mail, CIN et contact. */
    private String text;
    /** Page demandee, a partir de zero. */
    private Integer page;
    /** Taille de page. Bornee cote serveur. */
    private Integer size;
    /** `name`, `username` ou `cin`. */
    private String sortBy;
    private Boolean sortAsc;
}
