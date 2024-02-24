package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import jdk.jshell.spi.ExecutionControl;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Operation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Date date ;
    private String string;
    @ManyToOne
    private Value inital;
    @ManyToOne
    private Value finale;
    @ManyToOne
    private Issue issue;
    @ManyToOne
    private UserApp userApp;

}
