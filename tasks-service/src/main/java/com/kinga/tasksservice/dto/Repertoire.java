package com.kinga.tasksservice.dto;

import com.kinga.utils.KingaUtils;
import lombok.Data;

@Data
public abstract class Repertoire {
    protected String path ;
    protected String fileName;
    protected String type ;
    private String icone;
    protected String absolutePath;
    public Repertoire(String absolutePath , String name){
        this.absolutePath = KingaUtils.encodeText(absolutePath);
        this.fileName = name;
    }
}
