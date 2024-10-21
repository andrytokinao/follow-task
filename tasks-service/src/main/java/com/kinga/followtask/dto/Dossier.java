package com.kinga.followtask.dto;



import com.kinga.utils.KingaUtils;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.rmi.registry.LocateRegistry;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public  class Dossier extends Repertoire {
    public static List<Dossier> getSousDossier(String path) {
        File dossier = new File(KingaUtils.decodeText(path));
        if(dossier == null || !dossier.isDirectory()){
            throw new RuntimeException("Invalid path");
        }
        List<Dossier> dossiers = new ArrayList<>();
        for(File file : dossier.listFiles()) {
            if (file.isDirectory()) {
                Dossier d = new Dossier(file.getName());
                d.setAbsolutePath(file.getAbsolutePath());
                d.setPath(file.getAbsolutePath());
                dossiers.add(d);
            }
        }
        return dossiers;

    }
    public static List<Dossier> loadRootDirectory(){
        List<Dossier> dossiers = new ArrayList<>();
        for(File route : File.listRoots()) {
            if (route.isDirectory()) {
                Dossier dossier = new Dossier(route.getName());
                dossier.setAbsolutePath(route.getAbsolutePath());
                dossiers.add(dossier);
            }
        }
        return dossiers;
    }
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
    public Dossier(String fileName){
        super();
        String fn = StringUtils.isEmpty(fileName) ? "/" : fileName;
        super.setFileName(fn);
    }
    public static List<String> listDirectoryPaths(String directory) throws IOException {
        List<String> paths = new ArrayList<> ();
        String dr ="";
        if (StringUtils.isEmpty (directory)){
            return paths ;
        }
        String[] fileNimes = directory.split (File.separator);
        for(int i = 0 ; i <fileNimes.length; i++){
            if (StringUtils.isEmpty (fileNimes[i]))
                continue;
            dr = dr+File.separator+fileNimes[i];
            paths.add (KingaUtils.encodeText (dr));
        }
        return paths;
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
