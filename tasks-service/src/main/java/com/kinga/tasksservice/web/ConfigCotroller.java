package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.ConfigBuilder;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.repository.UserRepository;
import com.kinga.tasksservice.service.ConfigService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.print.attribute.standard.Media;
import java.beans.IntrospectionException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.text.ParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
public class ConfigCotroller {
    @Autowired
    ConfigService configService;
    final UserRepository userRepository;
    @GetMapping("/api/init-data")
    public Issue initialiseData() throws ParseException, ClassNotFoundException, InstantiationException, IllegalAccessException, IOException {
        return configService.initalizeData();
    }
    @MutationMapping
    public List<ConfigEntry> saveConfig(@Argument ConfigEntry configEntry)  {
        return configService.save(configEntry);
    }
    @PostMapping("api/save-config")
    @ResponseBody
    public ConfigEntry saveConfigRest(@RequestParam String type, @RequestParam String value, @RequestParam Long configId) throws ClassNotFoundException, InstantiationException, IllegalAccessException, IntrospectionException, InvocationTargetException {
        return configService.saveEntry(type,value,configId);
    }
    @GetMapping("api/get-config")
    @ResponseBody
    public ConfigEntry getConfig() throws ClassNotFoundException, InstantiationException, IllegalAccessException, IOException {
        return configService.getCurrentConfig();
    }
    @GetMapping("has-user")
    public boolean hasUser(){
        return userRepository.count() !=0;
    }
    @GetMapping("code-path")
    @ResponseBody
    public Map<String,String> codePath() throws IOException {
        Map<String,String> map = new HashMap<>();
        map.put("path",configService.getCurrentConfig().getRepertoireCodeValidation());
        return map;
    }
    @MutationMapping
    public UserApp initUser(@Argument UserApp userApp) throws IOException {
        return configService.initUser(userApp);
    }
    @GetMapping("next-installation-path")
    public Map<String,String> getNextInstallationPath(){
        HashMap<String, String> path = new HashMap<String, String>();
        path.put("path",configService.nextInstallation());
        return path;
    }
}
