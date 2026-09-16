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
import java.util.Collection;

/**
 * La colonne Issue.observerIds stocke les identifiants separes par des virgules.
 * Creee a l'origine en VARCHAR(255), elle ne contenait que 6 UUID et bloquait
 * l'assignation au-dela. Au demarrage, elle est convertie en texte long ; si la
 * conversion echoue, observerIds cesse simplement d'etre alimente une fois plein
 * pour ne jamais limiter le nombre d'assignes.
 */
@Component
public class ObserverIdsColumn {
    private static final Logger logger = LoggerFactory.getLogger(ObserverIdsColumn.class);
    private static final String TABLE = "issue";
    private static final String COLUMN = "observerids";
    private static final String SEPARATOR = ",";

    private final DataSource dataSource;
    private volatile long maxLength = Long.MAX_VALUE;

    // l'EntityManagerFactory est injectee pour passer apres la mise a jour du schema par Hibernate
    public ObserverIdsColumn(@Qualifier("masterDbDataSource") DataSource dataSource,
                             @Qualifier("masterDbEntityManager") EntityManagerFactory entityManagerFactory) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void widenColumn() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            ColumnInfo column = findColumn(connection);
            if (column == null || column.isLongText()) {
                return;
            }
            String quote = metaData.getIdentifierQuoteString().trim();
            String table = quote + column.table + quote;
            String name = quote + column.name + quote;
            String sql = metaData.getDatabaseProductName().toLowerCase().contains("mysql")
                    ? "ALTER TABLE " + table + " MODIFY " + name + " LONGTEXT"
                    : "ALTER TABLE " + table + " ALTER COLUMN " + name + " SET DATA TYPE CLOB";
            try (Statement statement = connection.createStatement()) {
                statement.execute(sql);
            }
            logger.info("Colonne {}.{} convertie en texte long", column.table, column.name);
        } catch (SQLException e) {
            logger.warn("Conversion de la colonne observerIds impossible, elle restera limitee", e);
        }
        refreshMaxLength();
    }

    /** Indique si l'ajout de userId a observerIds tient encore dans la colonne. */
    public boolean canAdd(Collection<String> observerIds, String userId) {
        if (maxLength == Long.MAX_VALUE || observerIds == null || observerIds.contains(userId)) {
            return true;
        }
        long length = String.join(SEPARATOR, observerIds).length();
        if (!observerIds.isEmpty()) {
            length += SEPARATOR.length();
        }
        return length + userId.length() <= maxLength;
    }

    private void refreshMaxLength() {
        try (Connection connection = dataSource.getConnection()) {
            ColumnInfo column = findColumn(connection);
            maxLength = column == null || column.isLongText() ? Long.MAX_VALUE : column.size;
            if (maxLength != Long.MAX_VALUE) {
                logger.warn("observerIds limite a {} caracteres : il ne sera plus alimente une fois plein", maxLength);
            }
        } catch (SQLException e) {
            logger.warn("Lecture de la taille de la colonne observerIds impossible", e);
        }
    }

    private ColumnInfo findColumn(Connection connection) throws SQLException {
        DatabaseMetaData metaData = connection.getMetaData();
        try (ResultSet rs = metaData.getColumns(connection.getCatalog(), connection.getSchema(), "%", "%")) {
            while (rs.next()) {
                if (TABLE.equalsIgnoreCase(rs.getString("TABLE_NAME"))
                        && COLUMN.equalsIgnoreCase(rs.getString("COLUMN_NAME").replace("_", ""))) {
                    return new ColumnInfo(rs.getString("TABLE_NAME"), rs.getString("COLUMN_NAME"),
                            rs.getString("TYPE_NAME"), rs.getLong("COLUMN_SIZE"));
                }
            }
        }
        return null;
    }

    private record ColumnInfo(String table, String name, String type, long size) {
        boolean isLongText() {
            String t = type == null ? "" : type.toUpperCase();
            return t.contains("TEXT") || t.contains("CLOB") || t.contains("LARGE OBJECT");
        }
    }
}
