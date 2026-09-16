package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification,Long> {

    /**
     * Les destinataires sont stockés dans une colonne texte « a,b,c ». Un
     * simple LIKE %id% rapprocherait deux identifiants dont l'un est le
     * préfixe de l'autre : on encadre donc la colonne et le motif de virgules
     * pour ne comparer que des éléments entiers. CONCAT fonctionne aussi bien
     * sous H2 que sous MySQL, contrairement à FIND_IN_SET.
     */
    String CIBLE = " CONCAT(',', n.userIds, ',') LIKE CONCAT('%,', :userId, ',%') ";
    String NON_VUE = " (n.seenUserIds IS NULL OR CONCAT(',', n.seenUserIds, ',') NOT LIKE CONCAT('%,', :userId, ',%')) ";
    String NON_LUE = " (n.readUserIds IS NULL OR CONCAT(',', n.readUserIds, ',') NOT LIKE CONCAT('%,', :userId, ',%')) ";

    @Query(value = "SELECT * FROM Notification n WHERE " + CIBLE + " ORDER BY n.id DESC", nativeQuery = true)
    List<Notification> findByUserId(@Param("userId") String userId);

    @Query(value = "SELECT * FROM Notification n WHERE " + CIBLE + " AND " + NON_VUE + " ORDER BY n.id DESC", nativeQuery = true)
    List<Notification> findUnseens(@Param("userId") String userId);

    /**
     * Non lues, c'est-à-dire dont la tâche concernée n'a pas encore été
     * ouverte. C'est cet ensemble qui alimente les pastilles des menus.
     */
    @Query(value = "SELECT * FROM Notification n WHERE " + CIBLE + " AND " + NON_LUE + " ORDER BY n.id DESC", nativeQuery = true)
    List<Notification> findUnreads(@Param("userId") String userId);
}
