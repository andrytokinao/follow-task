package com.kinga.followtask.repository;

import com.kinga.followtask.entity.UserApp;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRepository extends JpaRepository<UserApp,String> {
    UserApp findByUsername(String argument);
    UserApp findByEmail(String email);
    UserApp findByContact(String contact);
    UserApp findByCin(String cin);

    /**
     * Recherche paginee sur les champs d'identite.
     *
     * Le filtrage se fait en base et non en memoire : la page d'administration
     * chargeait la totalite des comptes pour n'en afficher que vingt.
     *
     * `lower(...) like` plutot qu'une projection derivee : la recherche porte
     * sur six colonnes a la fois, ce qu'un nom de methode derive ne sait pas
     * exprimer lisiblement.
     *
     * Les comptes desactives sont exclus, sauf si `inclureInactifs` : seule
     * l'administration doit encore les voir, pour pouvoir les reactiver.
     */
    @Query("""
            select u from UserApp u
            where (:inclureInactifs = true or coalesce(u.active, true) = true)
              and (:terme is null
               or lower(coalesce(u.lastName,  '')) like :terme
               or lower(coalesce(u.firstName, '')) like :terme
               or lower(coalesce(u.username,  '')) like :terme
               or lower(coalesce(u.email,     '')) like :terme
               or lower(coalesce(u.cin,       '')) like :terme
               or lower(coalesce(u.contact,   '')) like :terme)
            """)
    Page<UserApp> rechercher(@Param("terme") String terme,
                             @Param("inclureInactifs") boolean inclureInactifs,
                             Pageable pageable);

    /** Comptes actifs ; `null` vaut actif. */
    @Query("select u from UserApp u where coalesce(u.active, true) = true")
    List<UserApp> findAllActifs();
}
