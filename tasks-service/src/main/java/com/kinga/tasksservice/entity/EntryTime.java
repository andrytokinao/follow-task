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
public class EntryTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Float time;
    private Date date;
    @ManyToOne
    @JoinColumn(name = "user_app")
    private UserApp userApp;
    @ManyToOne
    private Issue issue;


}
