package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
public class EventType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = true)
    private String description;
    @Column(nullable = true)
    private String defaultColor;
    @Column(nullable = true)
    private String defaultStyle;
    @OneToMany(mappedBy = "eventType")
    private List<Event> events;

    public EventType() {}
    public EventType(String name, String defaultColor, String defaultStyle) {
        this.name = name;
        this.defaultColor = defaultColor;
        this.defaultStyle = defaultStyle;
    }

    public EventType(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
