package com.kinga.tasksservice.web;

import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.service.ParameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.text.ParseException;

@RestController
public class ParamCotroller {
    @Autowired
    ParameService parameService;
    @GetMapping("/api/init-data")
    public Issue initialiseData() throws ParseException, ClassNotFoundException, InstantiationException, IllegalAccessException, IOException {
        return parameService.initalizeData();
    }



}
