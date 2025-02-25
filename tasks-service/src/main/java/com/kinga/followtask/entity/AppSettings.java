package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "setting_type", discriminatorType = DiscriminatorType.STRING)
@Data
public abstract class AppSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String cle;
    private String settingsValue;
    private Boolean active;
    @Transient
    private String settingType;
    private Date created;
    private Date updated;
    public AppSettings() {}

    public AppSettings(String cle, String value) {
        this.cle = cle;
        this.settingsValue = value;
    }

 }
