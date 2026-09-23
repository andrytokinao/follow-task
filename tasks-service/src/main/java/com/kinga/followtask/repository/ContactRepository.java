package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Contact;
import com.kinga.followtask.entity.enumapp.TypeContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, String> {
    Optional<Contact> findByTypeContactAndValue(TypeContact typeContact, String value);

    /**
     * Contacts verifies d'un utilisateur pour un canal donne, du plus recent au
     * plus ancien. Requete ecrite plutot que derivee du nom : le champ
     * {@code isVerified} porte deja un prefixe booleen, que la derivation
     * confondrait avec le mot-cle d'egalite.
     */
    @Query("SELECT c FROM Contact c WHERE c.userApp.id = :userId AND c.typeContact = :type "
            + "AND c.isVerified = true ORDER BY c.createdAt DESC")
    List<Contact> findVerifiedByUser(@Param("userId") String userId, @Param("type") TypeContact type);
}