package com.kinga.followtask.entity;

import jakarta.persistence.Lob;

public enum LinkType {

   PARENT("PARENT","Relation ant parent and childr"),
    BLOCKER("BLOCKER","Blocker by issue not resolved"),
    DECLENCHEUR("DECLENCHEUR","Open issue after resolution"),
    ;
   String type;
   String description ;

    LinkType(String type,String description) {
        this.type = type;
    }
}
