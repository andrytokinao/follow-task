package com.kinga.followtask.config;

import graphql.scalars.ExtendedScalars;
import graphql.schema.idl.RuntimeWiring;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;

@Configuration
public class ApplicationConfig {
  //    @Bean
    public RuntimeWiringConfigurer runtimeWiringConfigurer() {
        return wiringBuilder -> wiringBuilder
                .scalar(ExtendedScalars.DateTime);
    }
}
