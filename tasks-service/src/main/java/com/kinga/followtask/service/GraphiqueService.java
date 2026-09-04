package com.kinga.followtask.service;

import com.kinga.followtask.dto.rapport.TempsParPersonneDTO;
import com.kinga.followtask.dto.rapport.TempsParProjetDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Arc2D;
import java.awt.geom.Ellipse2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;

/**
 * Graphiques du rapport, produits côté serveur.
 *
 * Le PDF ne peut pas contenir de graphique dessiné en JavaScript :
 * OpenHTMLtoPDF n'exécute aucun script. Le camembert est donc peint en Java2D
 * puis inséré dans le HTML sous forme d'image encodée en base64 — même page
 * pour le navigateur et pour le PDF, et aucune dépendance supplémentaire, l'API
 * de dessin étant celle du JDK.
 *
 * <p>L'aperçu Angular, lui, redessine le même camembert en SVG natif : c'est
 * un rendu écran, il doit rester net à tout zoom et pouvoir réagir au survol.
 * Les deux se contentent de partager {@link #COULEURS}.</p>
 */
@Slf4j
@Service
public class GraphiqueService {

    /**
     * Palette des parts, dans l'ordre d'affichage.
     *
     * <p>Doit rester identique à {@code COULEURS_REPARTITION} dans
     * {@code tasks-front/src/app/type/rapport.ts}, sans quoi une même personne
     * changerait de couleur entre l'aperçu et le PDF.</p>
     */
    public static final List<String> COULEURS = List.of(
            "#1565c0", "#2f9e44", "#f0932b", "#d64545",
            "#7048e8", "#0c8599", "#b08900", "#e8590c");

    /** Côté de l'image en pixels : dessinée large, affichée petite, donc nette. */
    private static final int TAILLE = 440;
    /** Part du rayon occupée par le trou central. */
    private static final double RAYON_INTERIEUR = 0.58;

    /**
     * Camembert (en anneau) de la répartition du temps.
     *
     * @return une URI de données {@code data:image/png;base64,...} directement
     *         utilisable en attribut {@code src}, ou {@code null} s'il n'y a
     *         aucun temps à représenter — auquel cas le template n'affiche pas
     *         de graphique plutôt qu'un disque vide.
     */
    public String donutRepartition(List<TempsParPersonneDTO> parts) {
        if (CollectionUtils.isEmpty(parts)) {
            return null;
        }
        return donut(parts.stream().map(TempsParPersonneDTO::heuresPassees).toList());
    }

    /**
     * Même anneau, vu depuis l'autre bout : la répartition des heures d'une
     * personne entre les projets, pour le rapport par personne.
     *
     * <p>Le dessin ne connaît que des parts, jamais ce qu'elles représentent :
     * les deux répartitions partagent donc le tracé et la palette, et une part
     * garde la même couleur que sa ligne de légende dans les deux cas.</p>
     */
    public String donutRepartitionProjets(List<TempsParProjetDTO> parts) {
        if (CollectionUtils.isEmpty(parts)) {
            return null;
        }
        return donut(parts.stream().map(TempsParProjetDTO::heuresPassees).toList());
    }

    /**
     * Tracé de l'anneau, à partir des seules valeurs des parts.
     *
     * @return {@code null} s'il n'y a rien à représenter — le template affiche
     *         alors le tableau des chiffres seul, plutôt qu'un disque vide.
     */
    private String donut(List<Double> valeurs) {
        double total = valeurs.stream().mapToDouble(Double::doubleValue).sum();
        if (total <= 0) {
            return null;
        }

        BufferedImage image = new BufferedImage(TAILLE, TAILLE, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);

            double marge = 4d;
            double diametre = TAILLE - 2 * marge;

            // Les parts sont dessinées dans le sens horaire à partir de midi :
            // en Java2D les angles croissent dans le sens trigonométrique, d'où
            // un départ à 90° et des étendues négatives.
            Arc2D.Double[] arcs = new Arc2D.Double[valeurs.size()];
            double angleCourant = 90d;
            for (int i = 0; i < valeurs.size(); i++) {
                double etendue = (i == valeurs.size() - 1)
                        // La dernière part absorbe l'arrondi et ferme le cercle
                        // exactement : sans cela, un liseré de fond resterait
                        // visible à la jonction.
                        ? -(angleCourant + 270d)
                        : -(valeurs.get(i) / total) * 360d;
                arcs[i] = new Arc2D.Double(marge, marge, diametre, diametre,
                        angleCourant, etendue, Arc2D.PIE);
                angleCourant += etendue;
            }

            for (int i = 0; i < arcs.length; i++) {
                g.setColor(couleur(i));
                g.fill(arcs[i]);
            }

            // Séparateurs : un contour blanc sur chaque part suffit, et évite de
            // recalculer les frontières.
            g.setStroke(new BasicStroke(3f));
            g.setColor(Color.WHITE);
            for (Arc2D.Double arc : arcs) {
                g.draw(arc);
            }

            // Trou central : blanc et non transparent, le rapport étant toujours
            // posé sur un fond blanc, à l'écran comme à l'impression.
            double diametreInterieur = diametre * RAYON_INTERIEUR;
            double decalage = (TAILLE - diametreInterieur) / 2d;
            g.setColor(Color.WHITE);
            g.fill(new Ellipse2D.Double(decalage, decalage, diametreInterieur, diametreInterieur));

            String encodee = encoder(image);
            return encodee == null ? null : "data:image/png;base64," + encodee;
        } finally {
            g.dispose();
        }
    }

    private Color couleur(int index) {
        return Color.decode(COULEURS.get(index % COULEURS.size()));
    }

    private String encoder(BufferedImage image) {
        try (ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", sortie);
            return Base64.getEncoder().encodeToString(sortie.toByteArray());
        } catch (IOException e) {
            // Un graphique manquant ne doit pas empêcher le rapport de sortir :
            // le template retombe sur le tableau des chiffres, qui porte la même
            // information.
            log.warn("Encodage du graphique de répartition impossible", e);
            return null;
        }
    }
}
