package com.kinga.followtask.dto;

import com.kinga.utils.KingaUtils;
import lombok.Data;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Data
public abstract class Repertoire {
    protected String path ;
    protected List<String> paths;
    protected String fileName;
    protected String type ;
    private String icone;
    protected String absolutePath;
    /** Auteur de l'upload, renseigne seulement pour les fichiers connus en base. */
    protected String uploadeur;
    protected String dateUpload;
    public Repertoire(String absolutePath , String name){
        this.absolutePath = KingaUtils.encodeText(absolutePath);
        this.fileName = name;
    }

    public void setAbsolutePath(String absolutePath) {
        List<String> paths = new ArrayList<> ();
        try {
            paths = Dossier.listDirectoryPaths(absolutePath);
        } catch (Exception e) {
            throw new RuntimeException (e);
        }
        setPaths (paths);
        this.absolutePath = KingaUtils.encodeText(absolutePath);
    }

    public Repertoire(){

    }
}
