package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.query.sql.internal.ParameterRecognizerImpl;
import org.yaml.snakeyaml.events.Event;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
public class CanalMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private UserApp user;
    @ManyToOne
    private Canall canall;
    @Convert(converter = StringListConverter.class)
    private List<String> credentials;

}
