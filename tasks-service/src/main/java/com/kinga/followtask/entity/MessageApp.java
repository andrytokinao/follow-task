package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageApp {
   @Id
   @GeneratedValue(strategy = GenerationType.AUTO)
   private Long id;
   @ManyToOne
   private Canall canall;
   private Date created;
   @ManyToOne
   private UserApp sender;
   @Convert(converter = StringListConverter.class)
   private List<String> userReades;
}
