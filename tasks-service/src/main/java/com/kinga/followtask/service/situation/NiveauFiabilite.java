package com.kinga.followtask.service.situation;

/**
 * Peut-on croire la situation affichee ? Elle ne vaut que ce que vaut le
 * planning : le niveau se lit sur la part des ouvriers dont le planning est a jour.
 */
public enum NiveauFiabilite {

    FIABLE, PARTIELLE, NON_FIABLE;

    /**
     * @param part            pourcentage (0-100)
     * @param seuilFiable     a partir de ce pourcentage, la situation est fiable
     * @param seuilPartielle  en dessous, elle n'est pas fiable
     */
    public static NiveauFiabilite de(int part, int seuilFiable, int seuilPartielle) {
        if (part >= seuilFiable) {
            return FIABLE;
        }
        return part >= seuilPartielle ? PARTIELLE : NON_FIABLE;
    }
}
