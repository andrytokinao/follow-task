package com.kinga.followtask.repository;

import com.kinga.followtask.dto.MetaUpload;
import com.kinga.followtask.entity.Uploaded;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UploadedRepository extends JpaRepository<Uploaded,Long> {
    public List<Uploaded> findByDocumentId(Long documentId);

    /** Toutes les lignes situees sous un dossier, pour enrichir une arborescence. */
    List<Uploaded> findByPathStartingWith(String prefix);

    /**
     * Auteur et date des uploads situes sous un dossier, en une requete et sans
     * entites : ni Document ni UserApp ne sont charges ligne par ligne. Par id
     * croissant : le dernier enregistre d'un meme chemin vient en dernier.
     */
    @Query("select new com.kinga.followtask.dto.MetaUpload(u.path, a.firstName, a.lastName, a.username, a.photo, u.uploadDate) "
            + "from Uploaded u left join u.userApp a where u.path like concat(:prefixe, '%') order by u.id")
    List<MetaUpload> metadonneesSous(@Param("prefixe") String prefixe);
}
