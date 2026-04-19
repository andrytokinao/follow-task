package com.kinga.followtask.config;

import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Configuration
public class LiquibaseConfig {

    private static final Logger log = LoggerFactory.getLogger(LiquibaseConfig.class);

    @Value("${spring.liquibase.enabled:true}")
    private boolean liquibaseEnabled;

    @Value("${spring.liquibase.change-log:db-changelog/db.changelog-master.xml}")
    private String changeLog;

    @Bean("liquibaseMaster")
    public Liquibase liquibaseMaster(
            @Qualifier("masterDbDataSource") DataSource masterDbDataSource)
            throws LiquibaseException, SQLException {

        if (!liquibaseEnabled) {
            log.info("Liquibase est désactivé (spring.liquibase.enabled=false)");
            return null;
        }

        String cleanPath = changeLog.replaceFirst("^classpath\\*?:", "");
        log.info("Liquibase démarrage avec changelog : {}", cleanPath);

        Connection connection = masterDbDataSource.getConnection();
        JdbcConnection jdbcConnection = new JdbcConnection(connection);

        // Détection automatique du type de base (H2, MySQL, PostgreSQL...)
        Database database = DatabaseFactory.getInstance()
                .findCorrectDatabaseImplementation(jdbcConnection);

        log.info("Liquibase connecté sur : {} ({})",
                database.getDatabaseProductName(),
                database.getConnection().getURL());

        Liquibase liquibase = new Liquibase(
                cleanPath,
                new ClassLoaderResourceAccessor(getClass().getClassLoader()),
                database
        );

        liquibase.update("");
        log.info("Liquibase migrations exécutées avec succès");
        return liquibase;
    }
}