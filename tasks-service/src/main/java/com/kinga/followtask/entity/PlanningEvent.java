package com.kinga.followtask.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "planning_event")
@Data
public class PlanningEvent {
    public static String dateTimeFormaterPattern =  "yyyy-MM-dd'T'HH:mm:ss";
    private static String dateTimeFormaterPattern2=  "yyyy-MM-dd' 'HH:mm:ss";
    public static DateTimeFormatter dateTimeFormater =  DateTimeFormatter.ofPattern(dateTimeFormaterPattern);


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;
    @Lob
    @Column(name = "description", nullable = true,columnDefinition = "LONGTEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "start_time", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH")
    private LocalDateTime start;

    @Column(name = "end_time", nullable = true)
    private LocalDateTime end;

    @Column(name = "event_location", nullable = true)
    private String location; // Lieu de l'événement (optionnel)

    @Column(name = "is_all_day", nullable = false)
    private boolean allDay = false;

    @Column(name = "reminder_time", nullable = true)
    private LocalDateTime reminderTime;

    @Column(name = "custom_color", nullable = true)
    private String customColor;

    @Column(name = "custom_style", nullable = true)
    private String customStyle;

    @Column(name = "reminder_offset_minutes", nullable = true)
    private Integer reminderOffset; // Rappel relatif (en minutes avant l'événement, nullable)

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserApp user;

    @ManyToOne
    @JoinColumn(name = "issue_id", nullable = true)
    private Issue issue;
    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project ;
    @ManyToOne
    @JoinColumn(name = "date_value_id", nullable = true)
    private DateCustomFieldValue dateValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "execution_status", nullable = false)
    private ExecutionStatus executionStatus = ExecutionStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postponed_from_id", nullable = true)
    private PlanningEvent postponedFrom;

    // Historique des modifications
    @OneToMany(mappedBy = "planningEvent", cascade = CascadeType.ALL)
    private List<PlanningEventHistory> history = new ArrayList<>();
    @Column(name = "completion_percentage", nullable = true)
    private Integer completionPercentage;
    public PlanningEvent() {}

    public PlanningEvent(String title, EventType type, LocalDateTime start) {
        this.title = title;
        this.eventType = type;
        this.start = start;
    }
    public LocalDateTime getEndTime() {
        return this.end;
    }
    public LocalDateTime getStartTime() {
        return this.start;
    }
    /**
     * Méthode pour calculer l'heure effective du rappel.
     * Si `reminderTime` est défini, il est utilisé.
     * Sinon, `reminderOffset` est utilisé pour calculer le rappel relatif.
     */
    public LocalDateTime getEffectiveReminderTime() {
        if (reminderTime != null) {
            return reminderTime;
        }
        if (reminderOffset != null) {
            return start.minusMinutes(reminderOffset);
        }
        return null;
    }

    /**
     * Méthode de validation pour s'assurer qu'au moins un rappel est configuré.
     */
    public void validateReminder() {
        if (reminderTime == null && reminderOffset == null) {
            throw new IllegalStateException("Aucun rappel configuré pour cet événement.");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PlanningEvent event = (PlanningEvent) o;
        return Objects.equals(id, event.id);
    }
    public String getEnd(){
        return dateTimeFormater.format(this.end);
    }
    public String getStart(){
        return dateTimeFormater.format(this.start);
    }
    public String getType() {
        return this.eventType.getName();
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public PlanningEvent createPostponedCopy(LocalDateTime newStart) {
        PlanningEvent copy = new PlanningEvent(this.title, this.eventType, newStart);
        copy.setIssue(this.issue);
        copy.setProject(this.project);
        copy.setExecutionStatus(ExecutionStatus.PENDING);

        // Calculer la durée originale et l'appliquer au nouveau start
        if (this.end != null && this.start != null) {
            Duration duration = Duration.between(this.start, this.end);
            copy.setEnd(newStart.plus(duration));
        }

        return copy;
    }
    public PlanningEvent createPostponedCopy(LocalDateTime newStart, LocalDateTime newEnd) {
        PlanningEvent copy = new PlanningEvent(this.title, this.eventType, newStart);
        copy.setEnd(newEnd != null ? newEnd : calculerEndParDefaut(newStart));
        copy.setIssue(this.issue);
        copy.setProject(this.project);
        copy.setExecutionStatus(ExecutionStatus.PENDING);
        return copy;
    }

    private LocalDateTime calculerEndParDefaut(LocalDateTime newStart) {
        if (this.end != null && this.start != null) {
            Duration duration = Duration.between(this.start, this.end);
            return newStart.plus(duration);
        }
        return newStart.plusHours(1); // fallback
    }
    @Override
    public String toString() {
        return "Event{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", type=" + eventType +
                ", start=" + start +
                ", end=" + end +
                ", location='" + location + '\'' +
                ", reminderTime=" + reminderTime +
                ", reminderOffset=" + reminderOffset +
                '}';
    }
}
