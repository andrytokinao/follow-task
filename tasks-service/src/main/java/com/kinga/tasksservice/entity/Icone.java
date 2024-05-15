package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Icone {
    @Id
    private String id;
    @Column(name = "\"icon_value\"")
    private String value;
    private String typeIcone;
}
