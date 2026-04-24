package com.kinga.followtask.entity;

import com.kinga.followtask.dto.ActionItemInput;
import com.kinga.followtask.entity.converter.MapToJsonConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "action_type", discriminatorType = DiscriminatorType.STRING)
@Data
@NoArgsConstructor
public abstract class ActionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "item_action_type")
    @Enumerated(EnumType.STRING)
    protected ActionType actionType;
    @ManyToOne
    protected ActionGroupe actionGroupe;
    @ManyToOne
    protected Issue issue;
    @Convert(converter = MapToJsonConverter.class)
    protected Map<String,String> details = new HashMap<>();

    public static ActionItem fromInput(ActionItemInput action) {
        switch (action.getActionType()) {
            case ASSIGN -> {
                return new ActionAssigne(action);
            }
            case STATUS -> {
                return new ActionStatus(action);
            }
        }
        return null;
    }

    public abstract String buildMDetails();
    public abstract String buildMDetails(String userIdToNotify);

    public abstract Set<String> generateUserToNotify() ;

    public abstract Set<String> generateUserToNotifySpecific() ;

}
