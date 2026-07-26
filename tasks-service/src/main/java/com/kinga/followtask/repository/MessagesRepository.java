package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import com.kinga.followtask.entity.MessageApp;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessagesRepository extends JpaRepository<MessageApp,Long> {
    boolean existsByExternalMessageId(String externalMessageId);
}
