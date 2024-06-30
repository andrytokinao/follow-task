package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserRepository extends JpaRepository<UserApp,String> {
    UserApp findByUsername(String argument);
    UserApp findByEmail(String email);
    UserApp findByContact(String contact);
    UserApp findByCin(String cin);


}
