package com.kinga.followtask.dto.situation;

import com.kinga.followtask.entity.UserApp;

/** Un ouvrier dont le planning du jour est vide ou incomplet. */
public record PresencePersonneDTO(UserApp personne, long minutesAttendues, long minutesCouvertes) {
}
