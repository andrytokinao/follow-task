package com.kinga.followtask.repository;

import com.kinga.followtask.entity.WorkFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WorkFlowRepository extends JpaRepository<WorkFlow,Long> {
    public List<WorkFlow> findByProjectId(Long projectId);

    /**
     * Flux proposes dans un espace de travail : les siens, puis les flux
     * communs, chacun dans l'ordre de creation.
     */
    @Query("select w from WorkFlow w left join w.project pr"
            + " where pr.id = :projectId or pr is null"
            + " order by case when pr is null then 1 else 0 end, w.id")
    List<WorkFlow> findVisibles(@Param("projectId") Long projectId);
    public WorkFlow findWorkFlowByName(String name);
}
