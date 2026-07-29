package com.kinga.followtask.repository;

import com.kinga.followtask.entity.CanalContact;
import com.kinga.followtask.entity.Canall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CanalMemberRepository extends JpaRepository<CanalContact,Long> {
}
