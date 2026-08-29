package com.kinga.followtask.dto;

import lombok.Data;

@Data
public class UserHoursData {
    public String userName;
    public int hours;   // total minutes
    public String display;
}
