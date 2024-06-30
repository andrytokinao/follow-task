package com.kinga.tasksservice.dto;

import com.kinga.tasksservice.entity.ConfigEntry;
import lombok.NoArgsConstructor;

import java.util.Date;

public abstract class ConfigBuilder  {
    public abstract ConfigEntry setValue(ConfigEntry configEntry, String value);
    public class WorkDirectories extends ConfigBuilder{
    public WorkDirectories(){}
        @Override
        public ConfigEntry setValue(ConfigEntry configEntry, String value) {
           configEntry.setWorkDirectory(value);
           return configEntry;
        }
    }

    public class MediaDirtories extends ConfigBuilder{
    public MediaDirtories(){}
        @Override
        public ConfigEntry setValue(ConfigEntry configEntry, String value) {
            configEntry.setMediaDirectory(value);
            return configEntry;
        }
    }

    public class DataDirectories extends   ConfigBuilder{
    public DataDirectories(){}
        @Override
        public ConfigEntry setValue(ConfigEntry configEntry, String value) {
            configEntry.setDataDirectory(value);
            return configEntry;
        }
    }

}
