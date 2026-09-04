package com.kinga.followtask.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Arc2D;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Line2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

/**
 * Icônes du rapport, peintes côté serveur.
 *
 * <p>Le PDF ne peut recevoir ni police d'icônes ni SVG : OpenHTMLtoPDF n'exécute
 * aucun script, la conversion n'embarque pas le module SVG, et une police
 * d'icônes ne rendrait que des carrés vides. Les icônes sont donc dessinées en
 * Java2D puis insérées comme images encodées en base64 — même mécanique que le
 * camembert de {@link GraphiqueService}, et aucune dépendance supplémentaire.</p>
 *
 * <p>L'aperçu Angular, lui, utilise la police d'icônes de l'application : c'est
 * un rendu écran, il n'a pas ces contraintes. Les deux partagent les couleurs,
 * pas le code.</p>
 */
@Slf4j
@Service
public class IconeRapportService {

    /** Icônes disponibles, nommées par ce qu'elles désignent dans le document. */
    public enum Icone {
        /** Le document lui-même : marque de la page de couverture. */
        DOCUMENT,
        PROJET,
        PERSONNE,
        EQUIPE,
        /** Date d'édition. */
        HORLOGE
    }

    /**
     * Côté de l'image en pixels. Dessinée large et affichée petite : le PDF est
     * un document imprimable, une icône de la taille de son affichage y serait
     * crénelée.
     */
    private static final int TAILLE = 128;

    /** Marge autour du dessin, à l'intérieur de la pastille. */
    private static final double MARGE = 30d;

    /**
     * Icône blanche sur pastille ronde de couleur.
     *
     * @param couleur couleur de la pastille, en notation hexadécimale
     * @return une URI de données {@code data:image/png;base64,...}, ou
     *         {@code null} si l'encodage échoue — le template affiche alors le
     *         libellé seul plutôt qu'une image cassée
     */
    public String pastille(Icone icone, String couleur) {
        BufferedImage image = new BufferedImage(TAILLE, TAILLE, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);

            Color fond = couleurOuDefaut(couleur);
            g.setColor(fond);
            g.fill(new Ellipse2D.Double(0, 0, TAILLE, TAILLE));

            g.setColor(Color.WHITE);
            dessiner(g, icone, fond);

            String encodee = encoder(image);
            return encodee == null ? null : "data:image/png;base64," + encodee;
        } finally {
            g.dispose();
        }
    }

    /**
     * Tracé du symbole, en blanc sur la pastille.
     *
     * @param fond couleur de la pastille : elle sert à creuser les détails
     *             internes, qu'un simple trait blanc ne distinguerait pas.
     */
    private void dessiner(Graphics2D g, Icone icone, Color fond) {
        switch (icone) {
            case DOCUMENT -> dessinerDocument(g, fond);
            case PROJET -> dessinerDossier(g);
            case PERSONNE -> dessinerPersonne(g, 64d, 1d);
            case EQUIPE -> dessinerEquipe(g, fond);
            case HORLOGE -> dessinerHorloge(g);
        }
    }

    /** Une page portant trois lignes de texte. */
    private void dessinerDocument(Graphics2D g, Color fond) {
        g.fill(new RoundRectangle2D.Double(MARGE + 6, MARGE - 8, 56, 84, 8, 8));

        // Les lignes sont creusées dans la page à la couleur de la pastille :
        // du blanc sur blanc ne se verrait pas.
        g.setColor(fond);
        g.setStroke(new BasicStroke(6f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        for (int i = 0; i < 3; i++) {
            double y = MARGE + 8 + i * 18;
            g.draw(new Line2D.Double(MARGE + 18, y, MARGE + 52, y));
        }
        g.setColor(Color.WHITE);
    }

    /**
     * Un dossier : son onglet et son corps.
     *
     * <p>Les deux formes sont séparées par un vide de deux pixels. Collées,
     * elles se fondent en une seule tache une fois l'icône réduite à sa taille
     * d'affichage — et un dossier qu'on ne reconnaît pas ne sert à rien.</p>
     */
    private void dessinerDossier(Graphics2D g) {
        // Ensemble centré sur la pastille : onglet (14) + vide (6) + corps (44).
        g.fill(new RoundRectangle2D.Double(MARGE, 32, 30, 14, 4, 4));
        g.fill(new RoundRectangle2D.Double(MARGE, 52, 68, 44, 6, 6));
    }

    /**
     * Une silhouette : tête et buste.
     *
     * @param centre  abscisse du centre de la tête
     * @param echelle facteur de taille, pour composer une équipe de deux
     *                silhouettes de tailles différentes
     */
    private void dessinerPersonne(Graphics2D g, double centre, double echelle) {
        double rayonTete = 15d * echelle;
        double hauteurBuste = 26d * echelle;
        double largeurBuste = 34d * echelle;
        double sommet = 40d + (1d - echelle) * 14d;

        g.fill(new Ellipse2D.Double(centre - rayonTete, sommet, rayonTete * 2, rayonTete * 2));
        // Un demi-disque : les angles de Java2D croissent dans le sens
        // trigonométrique, 0 à 180 donne donc bien le dôme des épaules.
        g.fill(new Arc2D.Double(centre - largeurBuste, sommet + rayonTete * 2 + 4,
                largeurBuste * 2, hauteurBuste * 2, 0, 180, Arc2D.CHORD));
    }

    /** Deux silhouettes, la seconde en retrait. */
    private void dessinerEquipe(Graphics2D g, Color fond) {
        dessinerPersonne(g, 84d, 0.62d);

        // Contour à la couleur de la pastille : sans lui, les deux silhouettes
        // se fondraient en une seule tache blanche.
        g.setColor(fond);
        g.setStroke(new BasicStroke(10f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        dessinerContourPersonne(g, 48d, 0.78d);

        g.setColor(Color.WHITE);
        dessinerPersonne(g, 48d, 0.78d);
    }

    private void dessinerContourPersonne(Graphics2D g, double centre, double echelle) {
        double rayonTete = 15d * echelle;
        double hauteurBuste = 26d * echelle;
        double largeurBuste = 34d * echelle;
        double sommet = 40d + (1d - echelle) * 14d;

        g.draw(new Ellipse2D.Double(centre - rayonTete, sommet, rayonTete * 2, rayonTete * 2));
        g.draw(new Arc2D.Double(centre - largeurBuste, sommet + rayonTete * 2 + 4,
                largeurBuste * 2, hauteurBuste * 2, 0, 180, Arc2D.CHORD));
    }

    /** Un cadran et ses deux aiguilles. */
    private void dessinerHorloge(Graphics2D g) {
        g.setStroke(new BasicStroke(8f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g.draw(new Ellipse2D.Double(MARGE, MARGE, TAILLE - 2 * MARGE, TAILLE - 2 * MARGE));
        g.draw(new Line2D.Double(64, 64, 64, 46));
        g.draw(new Line2D.Double(64, 64, 82, 70));
    }

    private Color couleurOuDefaut(String couleur) {
        try {
            return Color.decode(couleur);
        } catch (NumberFormatException | NullPointerException e) {
            // Une couleur mal saisie ne doit pas priver le document de son
            // icône : le gris de la charte fait un repli acceptable.
            log.warn("Couleur d'icône « {} » illisible, repli sur le gris", couleur);
            return Color.decode("#52606d");
        }
    }

    private String encoder(BufferedImage image) {
        try (ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", sortie);
            return Base64.getEncoder().encodeToString(sortie.toByteArray());
        } catch (IOException e) {
            // Une icône manquante ne doit pas empêcher le rapport de sortir.
            log.warn("Encodage de l'icône {} impossible", image, e);
            return null;
        }
    }
}
