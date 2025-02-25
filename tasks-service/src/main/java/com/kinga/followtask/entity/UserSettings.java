package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@DiscriminatorValue("USER")
@Data
public class UserSettings extends AppSettings {
    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserApp user;

    public UserSettings() {}


}
