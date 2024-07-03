package com.kinga.tasksservice.entity;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAppRepository extends JpaRepository<UserApp, String> {
}
