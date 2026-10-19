package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.EtapeAvancement;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Etape d'avancement d'un statut (DT-007).
 *
 * <p>Table a part plutot qu'une colonne de {@link Status} : addStatus
 * reenregistre le statut tel que l'envoie le client, et une colonne absente
 * du formulaire y serait remise a null a chaque passage.</p>
 */
@Entity
@Table(name = "status_etape")
@Data
@NoArgsConstructor
public class StatusEtape {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "status_id", nullable = false, unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Status status;

    @Enumerated(EnumType.STRING)
    @Column(name = "etape", nullable = false, length = 20)
    private EtapeAvancement etape;

    public StatusEtape(Status status, EtapeAvancement etape) {
        this.status = status;
        this.etape = etape;
    }
}
