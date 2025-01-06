package com.kinga.followtask.entity;

import com.kinga.utils.KingaUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Uploaded {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String name;
    private String path;
    @ManyToOne
    private Document document;

    public Uploaded(String fileName, String path) {
        this.name = fileName;
        this.path = path;
    }

    public String getEncodedPath(){
        return KingaUtils.encodeText(this.path);
    }
}
