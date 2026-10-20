-- =====================================================================
-- Champs dates depuis le Gantt (DT-013) : drapeau « valeur unique ».
--
-- Au demarrage de la nouvelle version, Hibernate (ddl-auto=update) ajoute la
-- colonne custom_field.valeur_unique, VIDE : aucun champ n'est unique, sauf
-- ceux de l'application (Date Demarrage, Deadline), qui le sont toujours par
-- leur code. La section 2 rend uniques les champs Date existants, au choix.
--
-- MySQL n'a pas ADD COLUMN IF NOT EXISTS : ne jouer la section 1 que si
-- SHOW COLUMNS FROM custom_field LIKE 'valeur_unique'; ne rend rien.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Colonne (inutile si l'application a deja demarre dans cette version).
-- ---------------------------------------------------------------------
ALTER TABLE custom_field ADD COLUMN valeur_unique BIT(1) NULL;


-- ---------------------------------------------------------------------
-- 2. Facultatif : un champ Date existant n'accepte plus qu'une date.
-- ---------------------------------------------------------------------
-- UPDATE custom_field SET valeur_unique = 1 WHERE type = 'Date' AND name IN ('...');


-- ---------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------
-- SELECT id, name, type, code, valeur_unique FROM custom_field WHERE type = 'Date';


-- ---------------------------------------------------------------------
-- Retour arriere
-- ---------------------------------------------------------------------
-- ALTER TABLE custom_field DROP COLUMN valeur_unique;
