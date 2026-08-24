package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Canall;
import com.kinga.followtask.entity.CanalContact;
import com.kinga.followtask.entity.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CanalContactRepository extends JpaRepository<CanalContact, Long> {
    Optional<CanalContact> findByCanallAndContact(Canall canall, Contact contact);
    boolean existsByCanallIdAndContactUserAppId(Long canallId, String userAppId);

    List<CanalContact> findByCanall(Canall canall);
}