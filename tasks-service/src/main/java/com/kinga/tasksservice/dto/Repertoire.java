package com.kinga.tasksservice.dto;

import lombok.Data;

@Data
public abstract class Repertoire {
    protected String path ;
    protected String fileName;
    protected String type ;
    private String icone;
    protected String absolutePath;
    public Repertoire(String absolutePath , String name){
        this.absolutePath= absolutePath;
        this.fileName = name;
    }
}
