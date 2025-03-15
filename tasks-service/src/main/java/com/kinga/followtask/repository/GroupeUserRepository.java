package com.kinga.followtask.repository;

import com.kinga.followtask.entity.GroupeUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface GroupeUserRepository extends JpaRepository<GroupeUser,Long> {
    public GroupeUser findByName(String name);
    public List<GroupeUser> findByType(String type);
    public List<GroupeUser> findByPrefix(String prefix);
}
