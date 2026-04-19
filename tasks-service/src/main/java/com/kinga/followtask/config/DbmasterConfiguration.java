package com.kinga.followtask.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.naming.NamingException;
import javax.sql.DataSource;
import java.util.Properties;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        entityManagerFactoryRef = "masterDbEntityManager",
        transactionManagerRef = "masterDbTransactionManager",
        basePackages = "com.kinga.followtask.repository")
public class DbmasterConfiguration {
    @Value("${master-db.url}")
    private String masterDbUrl;

    @Value("${master-db.username}")
    private String masterDbUsername;

    @Value("${master-db.password}")
    private String masterDbUserPassword;

    @Value("${master-db.driver}")
    private String masterDriver;

    @Value("${master-db.dialect}")
    private String masterDialect;

    @Value("${spring.jpa.hibernate.ddl-auto:none}")
    private String ddlAuto;

    @Bean("masterDbDataSource")
    public DataSource masterDbDataSource() {
        DataSourceBuilder<?> dataSourceBuilder = DataSourceBuilder.create();
        dataSourceBuilder.url(masterDbUrl);
        dataSourceBuilder.username(masterDbUsername);
        dataSourceBuilder.password(masterDbUserPassword);
        dataSourceBuilder.driverClassName(masterDriver);
        return dataSourceBuilder.build();
    }
    @Bean(name = "masterDbEntityManager")
    public LocalContainerEntityManagerFactoryBean masterDbEntityManager() throws NamingException {

        LocalContainerEntityManagerFactoryBean entityManager = new LocalContainerEntityManagerFactoryBean();
        entityManager.setDataSource(masterDbDataSource());
        entityManager.setPackagesToScan("com.kinga.followtask.entity");
        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setGenerateDdl(false);
        entityManager.setJpaVendorAdapter(vendorAdapter);
        entityManager.setJpaProperties(jpaProperties());
        return entityManager;
    }

    private Properties jpaProperties(){
        Properties properties = new Properties();
        properties.setProperty("hibernate.dialect", masterDialect);
        properties.setProperty("hibernate.hbm2ddl.auto", ddlAuto);
        return properties;
    }

    @Primary
    @Bean(name = "masterDbTransactionManager")
    public PlatformTransactionManager transactionManager(@Qualifier("masterDbEntityManager") EntityManagerFactory entityManager) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManager);
        return transactionManager;
    }

}
