package com.kinga.followtask.repository;


import com.kinga.followtask.entity.LinkCode;
import com.kinga.followtask.entity.enumapp.TypeContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface LinkCodeRepository extends JpaRepository<LinkCode, String> {
    Optional<LinkCode> findByCode(String code);

    @Modifying
    @Query("update LinkCode l set l.usedAt = :now " +
            "where l.code = :code and l.usedAt is null and l.expiresAt > :now")
    int consume(@Param("code") String code, @Param("now") LocalDateTime now);

    @Modifying
    @Query("update LinkCode l set l.usedAt = :now " +
            "where l.userApp.id = :userId and l.typeContact = :type and l.usedAt is null")
    int invalidateActive(@Param("userId") String userId,
                         @Param("type") TypeContact type,
                         @Param("now") LocalDateTime now);
    Optional<LinkCode> findFirstByCodeAndTypeContactAndUsedAtIsNullAndExpiresAtAfter(
            String code, TypeContact type, LocalDateTime now);

    @Modifying
    @Query("update LinkCode l set l.usedAt = :now where l.id = :id and l.usedAt is null")
    int consumeById(@Param("id") String id, @Param("now") LocalDateTime now);
    Optional<LinkCode> findFirstByUserApp_IdAndTypeContactAndUsedAtIsNullAndExpiresAtAfterOrderByExpiresAtDesc(
            String userId, TypeContact type, LocalDateTime now);
    boolean existsByCodeAndUsedAtIsNullAndExpiresAtAfter(String code, LocalDateTime now);
}