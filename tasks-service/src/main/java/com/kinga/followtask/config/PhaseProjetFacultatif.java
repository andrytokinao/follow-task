package com.kinga.followtask.config;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * La colonne phase.project_id a ete creee NOT NULL par la premiere version des
 * phases. Une phase commune a tous les espaces de travail n'a pas d'espace :
 * la colonne doit accepter NULL. Hibernate (ddl-auto=update) n'assouplit pas
 * une colonne existante ; c'est fait ici au demarrage, une fois.
 *
 * <p>Equivalent manuel : db/manual/2026-10-15-phases-projet.sql.</p>
 */
@Component
public class PhaseProjetFacultatif {
    private static final Logger logger = LoggerFactory.getLogger(PhaseProjetFacultatif.class);
    private static final String TABLE = "phase";
    private static final String COLUMN = "project_id";

    private final DataSource dataSource;

    // l'EntityManagerFactory est injectee pour passer apres la mise a jour du schema par Hibernate
    public PhaseProjetFacultatif(@Qualifier("masterDbDataSource") DataSource dataSource,
                                 @Qualifier("masterDbEntityManager") EntityManagerFactory entityManagerFactory) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void rendreFacultative() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            Colonne colonne = trouverColonne(connection);
            if (colonne == null || colonne.nullable()) {
                return;
            }
            String quote = metaData.getIdentifierQuoteString().trim();
            String table = quote + colonne.table() + quote;
            String name = quote + colonne.name() + quote;
            String produit = metaData.getDatabaseProductName().toLowerCase();
            String sql = produit.contains("mysql") || produit.contains("mariadb")
                    ? "ALTER TABLE " + table + " MODIFY " + name + " BIGINT NULL"
                    : produit.contains("postgres")
                    ? "ALTER TABLE " + table + " ALTER COLUMN " + name + " DROP NOT NULL"
                    : "ALTER TABLE " + table + " ALTER COLUMN " + name + " SET NULL";
            try (Statement statement = connection.createStatement()) {
                statement.execute(sql);
            }
            logger.info("Colonne {}.{} rendue facultative : phases communes possibles", colonne.table(), colonne.name());
        } catch (SQLException e) {
            logger.warn("Colonne phase.project_id non modifiable : les phases communes ne pourront pas etre"
                    + " enregistrees. Jouez db/manual/2026-10-15-phases-projet.sql", e);
        }
    }

    private Colonne trouverColonne(Connection connection) throws SQLException {
        DatabaseMetaData metaData = connection.getMetaData();
        try (ResultSet rs = metaData.getColumns(connection.getCatalog(), connection.getSchema(), "%", "%")) {
            while (rs.next()) {
                if (TABLE.equalsIgnoreCase(rs.getString("TABLE_NAME"))
                        && COLUMN.equalsIgnoreCase(rs.getString("COLUMN_NAME"))) {
                    return new Colonne(rs.getString("TABLE_NAME"), rs.getString("COLUMN_NAME"),
                            rs.getInt("NULLABLE") != DatabaseMetaData.columnNoNulls);
                }
            }
        }
        return null;
    }

    private record Colonne(String table, String name, boolean nullable) {
    }
}
