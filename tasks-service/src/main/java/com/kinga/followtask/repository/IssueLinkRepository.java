package com.kinga.followtask.repository;

import com.kinga.followtask.entity.IssueLink;
import com.kinga.followtask.entity.LinkType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface IssueLinkRepository extends JpaRepository<IssueLink, Long> {

    List<IssueLink> findBySourceIdAndRemovedAtIsNull(Long sourceId);

    List<IssueLink> findByDestinationIdAndRemovedAtIsNull(Long destinationId);

    /** Ligne existante, active ou retirée : la contrainte d'unicité porte sur ce triplet. */
    Optional<IssueLink> findBySourceIdAndDestinationIdAndType(Long sourceId, Long destinationId, LinkType type);

    /** Successeurs directs, par des liens actifs des types donnés : un pas du contrôle de cycle. */
    @Query("select distinct l.destination.id from IssueLink l " +
            "where l.source.id in :sourceIds and l.type in :types and l.removedAt is null")
    List<Long> findDestinationIds(@Param("sourceIds") Collection<Long> sourceIds,
                                  @Param("types") Collection<LinkType> types);
}
