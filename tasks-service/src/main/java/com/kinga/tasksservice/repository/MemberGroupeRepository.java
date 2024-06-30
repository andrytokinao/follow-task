package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.GroupeUser;
import com.kinga.tasksservice.entity.MemberGroupe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MemberGroupeRepository extends JpaRepository<MemberGroupe,Long> {
    public List<MemberGroupe> findByUserId(String userId);
    public List<MemberGroupe> findByGroupeId(Long groupeId);
    public List<MemberGroupe> findByGroupeIdAndUserId(Long groupeId, String userId);
    public List<MemberGroupe> findByUserIdAndGroupeType(String userId,String groupeType);
}
