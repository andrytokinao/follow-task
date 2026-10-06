-- =====================================================================
-- Desactivation des comptes utilisateurs
-- A executer manuellement sur la base MySQL (profil `mysql`).
--
-- Une colonne ajoutee a la table des utilisateurs : `active`.
--   1    : compte actif
--   0    : compte desactive (connexion refusee, absent des recherches)
--   NULL : traite comme actif par l'application
--
-- L'entite UserApp ne declare pas de @Table : sur MySQL Windows
-- (lower_case_table_names = 1) la table s'appelle `userapp`, sur un MySQL
-- sensible a la casse `UserApp`. Verifiez avec SHOW TABLES LIKE '%ser%pp';
-- et adaptez le nom ci-dessous si besoin.
-- =====================================================================

ALTER TABLE userapp
    ADD COLUMN active BIT(1) NULL DEFAULT b'1';

-- Les comptes existants restent actifs. Facultatif (NULL vaut deja actif),
-- mais rend la donnee explicite.
UPDATE userapp SET active = b'1' WHERE active IS NULL;


-- ---------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------
-- SHOW CREATE TABLE userapp;
-- SELECT active, COUNT(*) FROM userapp GROUP BY active;


-- ---------------------------------------------------------------------
-- Retour arriere
-- ---------------------------------------------------------------------
-- ALTER TABLE userapp DROP COLUMN active;
