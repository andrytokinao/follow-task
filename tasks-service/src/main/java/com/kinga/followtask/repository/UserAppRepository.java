package com.kinga.followtask.repository;

import com.kinga.followtask.entity.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAppRepository extends JpaRepository<UserApp, String> {
    public UserApp findUserAppByUsername(String username);
}
