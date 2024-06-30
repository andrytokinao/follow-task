package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
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
    private String inital;
    private String finale;
    @ManyToOne
    private Issue issue;
    @ManyToOne
    private CustomField customField;
    @ManyToOne
    private UserApp userApp;

}
