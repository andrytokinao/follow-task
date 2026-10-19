package com.kinga.followtask.web;

import com.kinga.followtask.entity.Status;
import com.kinga.followtask.entity.enumapp.EtapeAvancement;
import com.kinga.followtask.service.avancement.EtapeStatutService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

/** Avancement automatique des taches (schema {@code avancement.graphqls}, DT-007). */
@Controller
@RequiredArgsConstructor
public class GQAvancementController {

    private final EtapeStatutService etapeStatutService;

    @SchemaMapping(typeName = "Status", field = "etapeAvancement")
    public EtapeAvancement etapeAvancement(Status status) {
        return etapeStatutService.etapeDe(status);
    }

    @MutationMapping
    public Status definirEtapeAvancement(@Argument Long statusId, @Argument EtapeAvancement etape) {
        return etapeStatutService.definir(statusId, etape);
    }
}
