package com.kinga.tasksservice.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class ConfigEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String version;
    private boolean active ;
    private Date creation;
    private String workDirectory;
    private String mediaDirectory;
    private String dataDirectory;
    private String configDirectory;
    private String codeValidation;
    private String repertoireCodeValidation;
    private String instalationState;
    private String projectPrefix;
}
