package com.kinga.tasksservice;

import org.springframework.scheduling.support.CronExpression;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
public class Test {
    public static void main(String[] args) throws ParseException {
        List<String> expressions = Arrays.asList(
                "0 0 5-10,16-22 * * *",
                "0 0 5,7,9,16,18,20,22 * * *",
                "0 0 6,17 * * *",
                "0 0 17 * * *",
                "0 0 5 * * *",
                "0 0 3,15 * * *",
                "0 0 3,15 * * *",
                "0 0 4 * * *",
                "0 0 5-10,16-23 * * *",
                "0 0 2,14 * * *",
                "30 2,14 * * * *",
                "00 11 * * * *",
                "30 23 * * * *",
                "0 0 * * * *",
                "0 0 * * * *",
                "0 0 3 * * *",
                "0 0 21 * * *",
                "30 4 * * * *",
                "30 3 * * * *",
                "30 2 * * * *",
                "30 2,16 * * * *",
                "0 0 10,22 * * *",
                "0 0 3 * * * ",
                "0 0 6 * * mon",
                "15 3 * * * *",
                "0 4 * * * *",
                "45 2 * * * *",
                "30 2,14 * * * *",
                "00 2,14 * * * *",
                "15 2,14 * * * *",
                "0 1 1 * * *");

        DateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Date dateS = sdf.parse("2024-03-18");
        Date dateE = sdf.parse("2024-03-19");
        LocalDateTime start = dateToLocalDateTime(dateS);
        LocalDateTime end = dateToLocalDateTime(dateE);
        start.plusMinutes(5);

        for(String exp : expressions){
            CronExpression cronExpression = CronExpression.parse(exp);
            LocalDateTime indexDate ;
            LocalDateTime nextRunDate = start;
            indexDate =  nextRunDate.plusMinutes(5);
            while (end.isAfter(indexDate)) {
                indexDate =  nextRunDate.plusMinutes(5);
                if(indexDate.equals(nextRunDate)) {
                    nextRunDate =  cronExpression.next(start);
                    System.out.print(" + ");
                } else {
                    System.out.print(" . ");
                }
                indexDate = indexDate.plusMinutes(30);
            }
            System.out.println(exp);
        }
    }



    public static LocalDateTime dateToLocalDateTime(Date date) {
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
