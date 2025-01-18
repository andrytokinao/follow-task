package com.kinga.followtask.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class DomainActivity {
    @Id
    private Long id;
    private String name;
    private String description;
    private String image;

}
