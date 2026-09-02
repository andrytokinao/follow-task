package com.kinga.followtask.repository;

import com.kinga.followtask.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;

public interface ValueDaoRepository extends JpaRepository<CustomFieldValue,Long> {
    public List<CustomFieldValue> findCustomFieldValueByIssueId(Long id);

    /**
     * Valeurs de champ personnalisé de type Date portées par les tâches d'un
     * projet sur une période.
     *
     * La requête porte sur la sous-classe {@code DateCustomFieldValue} : la
     * table est commune à tous les types de valeur, interroger la classe mère
     * ramènerait aussi les textes et les nombres.
     */
    @Query("select v from DateCustomFieldValue v " +
            "where v.issue.project.id = :projectId " +
            "and v.date >= :start and v.date < :end " +
            "order by v.date asc")
    List<CustomFieldValue> findProjectDateValues(@Param("projectId") Long projectId,
                                                 @Param("start") Date start,
                                                 @Param("end") Date end);
}
