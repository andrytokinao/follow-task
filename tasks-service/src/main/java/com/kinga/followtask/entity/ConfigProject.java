package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class ConfigProject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id ;
   private String configof;
    @Column(name = "\"string_value\"")
    private String value;
   @ManyToOne
   private ConfigEntry configEntry;
}
