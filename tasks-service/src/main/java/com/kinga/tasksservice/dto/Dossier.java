package com.kinga.tasksservice.dto;



import java.io.File;
import java.util.ArrayList;
import java.util.List;

public  class Dossier extends Repertoire {
    public Dossier(String absolutePath, String name){
        super(absolutePath,name);
        listDirectory( absolutePath);
        setType("directory");
    }
    public Dossier(File file){
        super(file.getAbsolutePath(),file.getName());
        listDirectory( file.getAbsolutePath());
        setType("directory");
    }
    private void listDirectory(String dir) {
        File file = new File(dir);
        File[] files = file.listFiles();
        List<Repertoire> repertoireList = new ArrayList<>();
        if (files != null) {
            for (int i = 0; i < files.length; i++) {
                if (files[i].isDirectory() == true) {
                    Repertoire repertoire = new Dossier(files[i].getAbsolutePath(),files[i].getName());
                    repertoireList.add(repertoire);
                } else {
                    Fichier fichier = new Fichier(files[i].getAbsolutePath(),files[i].getName());
                    repertoireList.add(fichier);
                }
            }
            this.setRepertoires(repertoireList);
        }
    }
    public List<Repertoire> repertoires;
    public List<Repertoire> getRepertoires() {
        return repertoires;
    }

    public void setRepertoires(List<Repertoire> repertoires) {
        this.repertoires = repertoires;
    }
}
