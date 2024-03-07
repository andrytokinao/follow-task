package com.kinga.tasksservice;

import com.kinga.tasksservice.entity.Issue;
import com.kinga.tasksservice.entity.Status;
import com.kinga.tasksservice.service.IssueService;
import com.kinga.tasksservice.service.StatusService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.util.CollectionUtils;

import java.util.Collection;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(Application.class, args);
        StatusService statusService = (StatusService) ctx.getBean(StatusService.class);
        IssueService issueService = (IssueService) ctx.getBean(IssueService.class);
        // Initialiser status
        if(CollectionUtils.isEmpty(statusService.findAll())) {
            Status enAttete = new Status();
            enAttete.setDisplayName("En Attente");
            enAttete.setIconeFile("/assets/stendby.ico");
            statusService.save(enAttete);

            Status open = new Status();
            open.setDisplayName("Ouvert");
            open.setIconeFile("/assets/open.ico");
            statusService.save(open);

            Status progress = new Status();
            progress.setDisplayName("En Progression");
            progress.setIconeFile("progress.ido");
            statusService.save(progress);


            Status controle = new Status();
            controle.setDisplayName("A Controller ");
            controle.setIconeFile("/assets/controle.ico");
            statusService.save(controle);

            Status done = new Status();
            done.setDisplayName("Terminées ");
            done.setIconeFile("/assets/done.ico");
            statusService.save(done);
        }
       /* if(CollectionUtils.isEmpty(issueService.findAllIssue())){
            Issue issue = new Issue();
            issue.setSummary("New Task");
            issueService.save(issue);
        }*/
    }

}
