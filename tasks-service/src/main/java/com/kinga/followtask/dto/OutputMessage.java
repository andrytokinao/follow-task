package com.kinga.followtask.dto;

import com.kinga.followtask.entity.Canall;
import com.kinga.followtask.entity.MessageApp;
import com.kinga.followtask.entity.StringListConverter;
import com.kinga.followtask.entity.UserApp;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
@Data
@NoArgsConstructor
public class OutputMessage {
    private Long id;
    private Canall canall;
    private Date created;
    private String text;
    private UserApp sender;
    private List<String> userReades;

    public void setCanall(Canall canall) {
        Canall c = new Canall();
        c.setId(canall.getId());
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
        setUserReades(mes.getUserReades());
    }
}
