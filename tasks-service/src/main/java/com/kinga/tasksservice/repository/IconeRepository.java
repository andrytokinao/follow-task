package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Comment;
import com.kinga.tasksservice.entity.Icone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IconeRepository extends JpaRepository<Icone,String> {
}
