-- =====================================================================
-- Liens entre taches (predecesseur, bloquant, declencheur, reference)
-- A executer manuellement sur la base MySQL (profil `mysql`), AVANT de
-- demarrer la nouvelle version de l'application : sinon Hibernate
-- (ddl-auto=update) ajoute lui-meme les colonnes et les ADD COLUMN
-- ci-dessous echouent.
--
-- La table `issuelink` existe deja, creee par Hibernate a partir de
-- l'ancienne entite : id, type, source_id, destination_id. Elle est
-- modifiee sur place :
--   - `type` passe de l'ordinal (0, 1, 2) au texte (BLOCKS...) ;
--   - `id` devient AUTO_INCREMENT (il venait de la table `issuelink_seq`) ;
--   - colonnes ajoutees pour le Gantt et la tracabilite.
--
-- Pas de convention snake_case dans ce projet : les colonnes portent le
-- nom des champs (lagDays, createdAt...), sauf les cles etrangeres
-- nommees par @JoinColumn (source_id, created_by...).
--
-- L'entite ne declare pas de nom de table : sur MySQL Windows
-- (lower_case_table_names = 1) la table s'appelle `issuelink`, sur un
-- MySQL sensible a la casse `IssueLink`. Verifiez avec
-- SHOW TABLES LIKE '%ssue%ink%'; et adaptez le nom si besoin.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Etat actuel. A lire avant de continuer.
-- ---------------------------------------------------------------------
-- SHOW CREATE TABLE issuelink;
-- SELECT type, COUNT(*) FROM issuelink GROUP BY type;
--
-- Si SHOW CREATE TABLE montre une contrainte CHECK sur `type`
-- (ex. CONSTRAINT `issuelink_chk_1` CHECK ((`type` between 0 and 2))),
-- supprimez-la d'abord, avec son nom exact :
-- ALTER TABLE issuelink DROP CHECK issuelink_chk_1;


-- ---------------------------------------------------------------------
-- 2. type : ordinal -> texte.
--
-- Ancien enum : 0 = PARENT, 1 = BLOCKER, 2 = DECLENCHEUR.
-- PARENT n'existe plus (la hierarchie est dans issue.parent_id) ; ces
-- lignes, et celles sans type ou sans extremite, sont supprimees.
-- ---------------------------------------------------------------------
ALTER TABLE issuelink MODIFY COLUMN type VARCHAR(30) NULL;

UPDATE issuelink SET type = 'BLOCKS'   WHERE type = '1';
UPDATE issuelink SET type = 'TRIGGERS' WHERE type = '2';

DELETE FROM issuelink
WHERE type IS NULL OR type NOT IN ('BLOCKS', 'TRIGGERS')
   OR source_id IS NULL OR destination_id IS NULL
   OR source_id = destination_id;

-- Doublons eventuels (meme triplet) : on garde le plus ancien, avant
-- de poser la contrainte d'unicite.
DELETE l1 FROM issuelink l1
JOIN issuelink l2
  ON l1.source_id = l2.source_id
 AND l1.destination_id = l2.destination_id
 AND l1.type = l2.type
 AND l1.id > l2.id;

ALTER TABLE issuelink
    MODIFY COLUMN type           VARCHAR(30) NOT NULL,
    MODIFY COLUMN source_id      BIGINT      NOT NULL,
    MODIFY COLUMN destination_id BIGINT      NOT NULL;


-- ---------------------------------------------------------------------
-- 3. id AUTO_INCREMENT ; la table de sequence ne sert plus.
-- ---------------------------------------------------------------------
ALTER TABLE issuelink MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;

DROP TABLE IF EXISTS issuelink_seq;


-- ---------------------------------------------------------------------
-- 4. Nouvelles colonnes.
-- ---------------------------------------------------------------------
ALTER TABLE issuelink
    -- Contrainte de planning pour le Gantt (enum DependencyMode).
    ADD COLUMN mode       VARCHAR(30)  NULL DEFAULT 'FINISH_TO_START',
    -- Decalage en jours ; negatif pour un chevauchement.
    ADD COLUMN lagDays    INT          NULL DEFAULT 0,
    ADD COLUMN createdAt  DATETIME(6)  NULL,
    ADD COLUMN created_by VARCHAR(255) NULL,
    -- Renseigne quand le lien est retire : la ligne est gardee et
    -- reactivee si le meme lien est recree.
    ADD COLUMN removedAt  DATETIME(6)  NULL,
    ADD COLUMN removed_by VARCHAR(255) NULL;

UPDATE issuelink SET mode = 'FINISH_TO_START' WHERE mode IS NULL;
UPDATE issuelink SET lagDays = 0 WHERE lagDays IS NULL;


-- ---------------------------------------------------------------------
-- 5. Unicite et index. Memes noms que dans l'entite, pour que Hibernate
-- ne les cree pas une seconde fois.
-- ---------------------------------------------------------------------
ALTER TABLE issuelink
    -- Un seul lien d'un type donne entre deux taches ; sert aussi a lire
    -- les liens sortants (source_id en tete).
    ADD CONSTRAINT uk_issuelink UNIQUE (source_id, destination_id, type),
    -- Liens entrants d'une tache.
    ADD INDEX idx_issuelink_destination (destination_id, removedAt);


-- ---------------------------------------------------------------------
-- Cles etrangeres.
--
-- source_id et destination_id ont deja les leurs, creees par Hibernate
-- (noms en FK...). Celles vers l'utilisateur sont facultatives ; la table
-- `userapp` peut s'appeler `UserApp` sur un MySQL sensible a la casse.
-- ---------------------------------------------------------------------
-- ALTER TABLE issuelink
--     ADD CONSTRAINT fk_issuelink_created_by FOREIGN KEY (created_by) REFERENCES userapp (id),
--     ADD CONSTRAINT fk_issuelink_removed_by FOREIGN KEY (removed_by) REFERENCES userapp (id);


-- ---------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------
-- SHOW CREATE TABLE issuelink;
-- SELECT type, COUNT(*) FROM issuelink WHERE removedAt IS NULL GROUP BY type;


-- ---------------------------------------------------------------------
-- Retour arriere (structure seulement : les types convertis restent en texte)
-- ---------------------------------------------------------------------
-- ALTER TABLE issuelink
--     DROP INDEX idx_issuelink_destination,
--     DROP INDEX uk_issuelink,
--     DROP COLUMN mode, DROP COLUMN lagDays,
--     DROP COLUMN createdAt, DROP COLUMN created_by,
--     DROP COLUMN removedAt, DROP COLUMN removed_by;
