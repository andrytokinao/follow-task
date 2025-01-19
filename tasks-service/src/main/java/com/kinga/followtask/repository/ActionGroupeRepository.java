package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionGroupe;
import com.kinga.followtask.entity.ActionItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActionGroupeRepository extends JpaRepository<ActionGroupe,Long> {
}
