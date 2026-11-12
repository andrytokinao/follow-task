package com.kinga.followtask.repository;

import com.kinga.followtask.entity.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAppRepository extends JpaRepository<UserApp, String> {
    public UserApp findUserAppByUsername(String username);

    List<UserApp> findByContactIn(List<String> variants);
}
