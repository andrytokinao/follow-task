package com.kinga.followtask.config;

import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseConnection;
import liquibase.database.core.MySQLDatabase;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Configuration
public class LiquibaseConfig {
    @Bean
    @Qualifier("liquibaseMaster")
    public Liquibase liquibaseMaster(@Qualifier("masterDbDataSource") DataSource masterDbDataSource) throws LiquibaseException, SQLException {
        Connection connection = masterDbDataSource.getConnection();
        JdbcConnection jdbcConnection = new JdbcConnection(connection);
        Database database = new MySQLDatabase();
        database.setConnection(jdbcConnection);
        Liquibase liquibase = new Liquibase("db/changelog/db.changelog-master.xml", new ClassLoaderResourceAccessor(), database);
        liquibase.update("");
        return liquibase;
    }

}
