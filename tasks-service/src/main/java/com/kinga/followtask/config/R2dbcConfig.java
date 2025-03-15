/*
package com.kinga.followtask.config;

import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.ConnectionFactory;
import io.r2dbc.spi.ConnectionFactoryOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

import static io.r2dbc.spi.ConnectionFactoryOptions.*;

@Configuration
    @EnableR2dbcRepositories(basePackages = "com.kinga.followtask.reactiverepository")
    public class R2dbcConfig {
        @Value("${spring.r2dbc.url}")
        private String r2dbcUrl;

        @Value("${master-db.username}")
        private String masterUsername;

        @Value("${master-db.password}")
        private String masterPassword;

        @Value("${master-db.driver}")
        private String masterDriver;

        @Value("${master-db.dialect}")
        private String masterDialect;

    @Bean
    public ConnectionFactory connectionFactory() {
        return ConnectionFactories.get(r2dbcUrl);
    }
    }



*/
