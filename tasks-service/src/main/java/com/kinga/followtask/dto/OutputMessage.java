package com.kinga.followtask.dto;

import com.kinga.followtask.entity.*;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
@Data
@NoArgsConstructor
public class OutputMessage {
    private Long id;
    private Canall canall;
    private LocalDateTime created;
    private String text;
    private UserApp sender;
    private List<String> userReades;

    public void setCanall(Canall canall) {
        Canall c = new Canall();
        Project project = new Project();
        project.setId(canall.getProjects().getId());
        project.setPrefix(canall.getProjects().getPrefix());
        project.setName(canall.getProjects().getName());
        c.setId(canall.getId());
        c.setProjects(project);
        this.canall = c;
    }

    public void setSender(UserApp sender) {
        UserApp u = new UserApp();
        u.setId(sender.getId());
        this.sender = u;
    }
    public OutputMessage(MessageApp mes) {
        setId(mes.getId());
        setCreated(mes.getCreated());
        setText(mes.getText());
        setSender(mes.getSender());
        setCanall(mes.getCanall());
        setUserReades(mes.getUserReades());
    }
}
