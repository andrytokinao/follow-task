-- =====================================================================
-- Phases de projet (DT-001) : plusieurs phases par type, phases communes,
-- ordre des phases, lien phase / statut du projet, phase de chaque tache.
--
-- FACULTATIF. Au demarrage de la nouvelle version :
--   - Hibernate (ddl-auto=update) cree les tables et colonnes ;
--   - PhaseProjetFacultatif rend phase.project_id facultative ;
--   - PhaseReprise recopie l'ancienne phase des types (issuetype.phase_id)
--     et classe les taches existantes.
-- Ce script fait la meme chose a la main sur la base MySQL (profil
-- `mysql`), AVANT ce demarrage : execute apres, les CREATE / ADD COLUMN
-- ci-dessous echouent.
--
-- Prerequis : 2026-10-12-phase.sql (table phase, colonne issuetype.phase_id),
-- ou un demarrage de la version 2.0.7.
--
-- Les entites ne declarent pas toutes un nom de table : sur MySQL Windows
-- (lower_case_table_names = 1) les tables s'appellent `issuetype`, `issue`,
-- `status`, sur un MySQL sensible a la casse `IssueType`, `Issue`,
-- `Status`. Verifiez avec SHOW TABLES; et adaptez si besoin.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Phase : espace facultatif (phase commune) et rang dans le projet.
-- ---------------------------------------------------------------------
ALTER TABLE phase
    MODIFY COLUMN project_id BIGINT NULL,
    ADD COLUMN position INT NULL;

-- Rang initial : l'ordre de creation, qui etait l'ordre d'affichage.
SET @rang := 0;
UPDATE phase SET position = (@rang := @rang + 1) ORDER BY id;


-- ---------------------------------------------------------------------
-- 2. Phases d'un type : plusieurs au lieu d'une.
-- ---------------------------------------------------------------------
CREATE TABLE issue_type_phase (
    issue_type_id BIGINT NOT NULL,
    phase_id      BIGINT NOT NULL,
    CONSTRAINT uk_issue_type_phase UNIQUE (issue_type_id, phase_id),
    CONSTRAINT fk_issue_type_phase_type  FOREIGN KEY (issue_type_id) REFERENCES issuetype (id),
    CONSTRAINT fk_issue_type_phase_phase FOREIGN KEY (phase_id)      REFERENCES phase (id)
);


-- ---------------------------------------------------------------------
-- 3. Statuts du projet pendant lesquels une phase est en cours.
-- ---------------------------------------------------------------------
CREATE TABLE phase_status (
    phase_id  BIGINT NOT NULL,
    status_id BIGINT NOT NULL,
    CONSTRAINT uk_phase_status UNIQUE (phase_id, status_id),
    CONSTRAINT fk_phase_status_phase  FOREIGN KEY (phase_id)  REFERENCES phase (id),
    CONSTRAINT fk_phase_status_status FOREIGN KEY (status_id) REFERENCES status (id)
);


-- ---------------------------------------------------------------------
-- 4. Phase de chaque tache.
-- ---------------------------------------------------------------------
ALTER TABLE issue
    ADD COLUMN phase_id BIGINT NULL,
    ADD CONSTRAINT fk_issue_phase FOREIGN KEY (phase_id) REFERENCES phase (id);


-- ---------------------------------------------------------------------
-- 5. Reprise des donnees de la premiere version (fait aussi par PhaseReprise).
--
-- level est stocke en ordinal : 0 = SUB_TASK, 1 = PARENT. Un type de projet
-- ne garde pas de phase : celle d'un projet se lit sur son statut.
-- ---------------------------------------------------------------------
INSERT INTO issue_type_phase (issue_type_id, phase_id)
SELECT id, phase_id FROM issuetype
WHERE phase_id IS NOT NULL AND level = 0;

UPDATE issue i
JOIN issuetype t ON t.id = i.type
SET i.phase_id = t.phase_id
WHERE t.phase_id IS NOT NULL AND t.level = 0 AND i.phase_id IS NULL;

-- La colonne est gardee (entite : IssueType.legacyPhase) ; vide, elle
-- n'est plus reprise.
UPDATE issuetype SET phase_id = NULL WHERE phase_id IS NOT NULL;


-- ---------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------
-- SELECT id, name, project_id, position FROM phase ORDER BY position;
-- SELECT phase_id, COUNT(*) FROM issue_type_phase GROUP BY phase_id;
-- SELECT phase_id, COUNT(*) FROM issue GROUP BY phase_id;


-- ---------------------------------------------------------------------
-- Retour arriere (structure ; la phase unique des types n'est pas recalculee)
-- ---------------------------------------------------------------------
-- ALTER TABLE issue DROP FOREIGN KEY fk_issue_phase;
-- ALTER TABLE issue DROP COLUMN phase_id;
-- DROP TABLE phase_status;
-- DROP TABLE issue_type_phase;
-- DELETE FROM phase WHERE project_id IS NULL;
-- ALTER TABLE phase DROP COLUMN position, MODIFY COLUMN project_id BIGINT NOT NULL;
