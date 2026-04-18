package com.kinga.followtask.config;

import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseConnection;
import liquibase.database.core.MySQLDatabase;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Configuration
public class LiquibaseConfig {

    @Value("${spring.liquibase.enabled:true}")
    private boolean liquibaseEnabled;

    @Value("${spring.liquibase.change-log}")
    private String changeLog;

    @Bean
    @Qualifier("liquibaseMaster")
    public Liquibase liquibaseMaster(@Qualifier("masterDbDataSource") DataSource masterDbDataSource) throws LiquibaseException, SQLException {

        if (!liquibaseEnabled) {
            return null;
        }

        Connection connection = masterDbDataSource.getConnection();
        JdbcConnection jdbcConnection = new JdbcConnection(connection);
        Database database = new MySQLDatabase();
        database.setConnection(jdbcConnection);
        return new Liquibase(changeLog, new ClassLoaderResourceAccessor(), database);
    }
}
