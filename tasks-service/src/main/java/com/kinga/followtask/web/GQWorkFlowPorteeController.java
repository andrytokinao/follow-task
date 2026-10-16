package com.kinga.followtask.web;

import com.kinga.followtask.entity.WorkFlow;
import com.kinga.followtask.service.workflow.WorkFlowPorteeService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

/** Portee des flux de travail (schéma {@code workflow.graphqls}). */
@Controller
@RequiredArgsConstructor
public class GQWorkFlowPorteeController {

    private final WorkFlowPorteeService workFlowPorteeService;

    @MutationMapping
    public WorkFlow changerPorteeWorkFlow(@Argument Long workFlowId, @Argument Boolean commun,
                                          @Argument Long projectId) {
        return workFlowPorteeService.changerPortee(workFlowId, Boolean.TRUE.equals(commun), projectId);
    }
}
