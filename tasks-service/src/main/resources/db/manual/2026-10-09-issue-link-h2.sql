-- =====================================================================
-- Liens entre taches : migration de la base H2 locale (developpement).
-- Pendant H2 de 2026-10-08-issue-link.sql, qui ne vise que MySQL.
--
-- Symptome sans ce script, a la creation d'un lien :
--   NULL not allowed for column "ID"; insert into IssueLink (...) values (..., default)
--
-- La table a ete creee par l'ancienne entite : id alimente par la sequence
-- ISSUELINK_SEQ (GenerationType.AUTO), type stocke en ordinal. L'entite
-- utilise maintenant IDENTITY et un type texte ; ddl-auto=update ajoute des
-- colonnes mais ne modifie jamais une colonne existante.
--
-- Plutot que de modifier la table colonne par colonne, on la laisse
-- Hibernate la recreer : elle aura exactement la structure de l'entite.
-- Les anciens liens sont mis de cote puis recopies.
--
-- Noms sans guillemets : Hibernate les ecrit ainsi, H2 les met en
-- majuscules (ISSUELINK, LAGDAYS...).
--
-- Deux temps, a executer dans la console H2 (/h2-console) ou avec
-- org.h2.tools.Shell, application ARRETEE pour le Shell.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. AVANT de redemarrer l'application
-- ---------------------------------------------------------------------

-- Etat actuel, pour information.
-- SELECT COLUMN_NAME, DATA_TYPE, IS_IDENTITY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ISSUELINK';
-- SELECT TYPE, COUNT(*) FROM ISSUELINK GROUP BY TYPE;

DROP TABLE IF EXISTS ISSUELINK_ANCIEN;
CREATE TABLE ISSUELINK_ANCIEN AS SELECT ID, TYPE, SOURCE_ID, DESTINATION_ID FROM ISSUELINK;

DROP TABLE ISSUELINK CASCADE;
DROP SEQUENCE IF EXISTS ISSUELINK_SEQ;


-- ---------------------------------------------------------------------
-- 2. Redemarrer l'application : Hibernate recree ISSUELINK.
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- 3. APRES le redemarrage : recopie des anciens liens.
--
-- Ancien enum en ordinal : 0 = PARENT, 1 = BLOCKER, 2 = DECLENCHEUR.
-- PARENT n'existe plus (la hierarchie est dans ISSUE.PARENT_ID) ; ces
-- lignes, et celles sans extremite, ne sont pas reprises. Le CAST couvre
-- une colonne TYPE deja passee en texte.
-- ---------------------------------------------------------------------
INSERT INTO ISSUELINK (TYPE, SOURCE_ID, DESTINATION_ID, MODE, LAGDAYS)
SELECT DISTINCT
       CASE CAST(TYPE AS VARCHAR)
           WHEN '1' THEN 'BLOCKS' WHEN 'BLOCKER' THEN 'BLOCKS' WHEN 'BLOCKS' THEN 'BLOCKS'
           WHEN '2' THEN 'TRIGGERS' WHEN 'DECLENCHEUR' THEN 'TRIGGERS' WHEN 'TRIGGERS' THEN 'TRIGGERS'
       END,
       SOURCE_ID, DESTINATION_ID, 'FINISH_TO_START', 0
FROM ISSUELINK_ANCIEN
WHERE CAST(TYPE AS VARCHAR) IN ('1', 'BLOCKER', 'BLOCKS', '2', 'DECLENCHEUR', 'TRIGGERS')
  AND SOURCE_ID IS NOT NULL AND DESTINATION_ID IS NOT NULL
  AND SOURCE_ID <> DESTINATION_ID;

-- Verification, puis suppression de la copie.
-- SELECT COLUMN_NAME, DATA_TYPE, IS_IDENTITY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ISSUELINK';
-- SELECT TYPE, COUNT(*) FROM ISSUELINK GROUP BY TYPE;
-- DROP TABLE ISSUELINK_ANCIEN;
