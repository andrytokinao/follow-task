package com.kinga.followtask.dto;

import java.util.Comparator;

public class RepertoireComparator  implements Comparator<Repertoire> {

    @Override
    public int compare(Repertoire o1, Repertoire o2) {
        return o1.getFileName().compareTo(o2.getFileName());
    }
}
