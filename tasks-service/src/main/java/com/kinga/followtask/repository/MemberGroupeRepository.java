package com.kinga.followtask.repository;

import com.kinga.followtask.entity.GroupeUser;
import com.kinga.followtask.entity.MemberGroupe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface MemberGroupeRepository extends JpaRepository<MemberGroupe,Long> {
    public List<MemberGroupe> findByUserId(String userId);
    public List<MemberGroupe> findByGroupeId(Long groupeId);
    public List<MemberGroupe> findByGroupeIdAndUserId(Long groupeId, String userId);
    public List<MemberGroupe> findByUserIdAndGroupeType(String userId,String groupeType);
}
