package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.State;
import com.kinga.tasksservice.entity.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserApp,Long> {
}
