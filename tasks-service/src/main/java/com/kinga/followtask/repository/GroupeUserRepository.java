package com.kinga.followtask.repository;

import com.kinga.followtask.entity.GroupeUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupeUserRepository extends JpaRepository<GroupeUser,Long> {
    public GroupeUser findByName(String name);
    public List<GroupeUser> findByType(String type);
    public List<GroupeUser> findByPrefix(String prefix);
}
