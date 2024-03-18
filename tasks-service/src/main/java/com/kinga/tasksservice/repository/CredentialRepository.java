package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Credential;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CredentialRepository extends JpaRepository<Credential,Long> {
}
