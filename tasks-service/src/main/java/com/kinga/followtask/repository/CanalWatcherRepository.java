package com.kinga.followtask.repository;

import com.kinga.followtask.entity.CanalWatcher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CanalWatcherRepository extends JpaRepository<CanalWatcher, Long> {
    Optional<CanalWatcher> findByCanallIdAndUserAppId(Long canallId, String userAppId);
    List<CanalWatcher> findByUserAppId(String userAppId);
    boolean existsByCanallIdAndUserAppId(Long canallId, String userAppId);
    void deleteByCanallIdAndUserAppId(Long canallId, String userAppId);
}