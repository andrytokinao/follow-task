package com.kinga.tasksservice.dto;


public class Fichier extends Repertoire {
    public Fichier(String absolutePath, String name){
        super(absolutePath,name);
        this.setType("file");
    }
}
