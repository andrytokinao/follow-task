-- =====================================================================
-- Phases : groupes de types de tache (Etude, Controle...)
--
-- FACULTATIF. Hibernate (ddl-auto=update) cree lui-meme la table et la
-- colonne au demarrage de la nouvelle version. Ce script sert a le faire
-- a la main sur la base MySQL (profil `mysql`), AVANT ce demarrage :
-- execute apres, les CREATE / ADD COLUMN ci-dessous echouent.
--
-- Aucune donnee existante n'est modifiee : `phase_id` est NULL pour tous
-- les types deja en base, ils restent « sans phase » jusqu'a ce qu'on les
-- range depuis l'ecran des types de tache.
--
-- L'entite IssueType ne declare pas de nom de table : sur MySQL Windows
-- (lower_case_table_names = 1) la table s'appelle `issuetype`, sur un
-- MySQL sensible a la casse `IssueType`. De meme pour `project`.
-- Verifiez avec SHOW TABLES LIKE '%ssue%ype%'; et adaptez si besoin.
-- =====================================================================

CREATE TABLE phase (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    project_id BIGINT       NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_phase_project (project_id),
    CONSTRAINT fk_phase_project FOREIGN KEY (project_id) REFERENCES project (id)
);

ALTER TABLE issuetype
    ADD COLUMN phase_id BIGINT NULL,
    ADD CONSTRAINT fk_issuetype_phase FOREIGN KEY (phase_id) REFERENCES phase (id);


-- ---------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------
-- SHOW CREATE TABLE phase;
-- SELECT phase_id, COUNT(*) FROM issuetype GROUP BY phase_id;


-- ---------------------------------------------------------------------
-- Retour arriere
-- ---------------------------------------------------------------------
-- ALTER TABLE issuetype DROP FOREIGN KEY fk_issuetype_phase;
-- ALTER TABLE issuetype DROP COLUMN phase_id;
-- DROP TABLE phase;

