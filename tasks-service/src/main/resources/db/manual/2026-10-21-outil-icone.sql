-- =====================================================================
-- Menu Outils (DT-019) : icone choisie pour un outil (un logiciel, par
-- exemple), une classe Font Awesome. Null : l'icone de son type.
--
-- Au demarrage de la 2.0.41, Hibernate (ddl-auto=update) ajoute cette
-- colonne. Ce script sert aux bases ou ddl-auto est desactive.
--
-- Rejouable : la colonne n'est ajoutee que si elle manque.
-- =====================================================================

SET @existe := (SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = 'outil' AND column_name = 'icone');
SET @sql := IF(@existe = 0, 'ALTER TABLE outil ADD COLUMN icone VARCHAR(100) NULL', 'SELECT 1');
PREPARE ajout FROM @sql;
EXECUTE ajout;
DEALLOCATE PREPARE ajout;
