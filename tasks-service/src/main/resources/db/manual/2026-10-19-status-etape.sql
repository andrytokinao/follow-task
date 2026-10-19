-- =====================================================================
-- Avancement automatique (DT-007) : etape d'avancement des statuts.
--
-- Au demarrage de la nouvelle version, Hibernate (ddl-auto=update) cree la
-- table status_etape, VIDE : tant qu'aucun statut n'a d'etape, le statut des
-- taches ne suit pas le planning. Les etapes se reglent dans l'editeur de
-- flux (clic sur un statut), ou d'un coup avec la section 2 ci-dessous.
--
-- Rejouable : CREATE TABLE IF NOT EXISTS, et les INSERT ignorent les statuts
-- qui ont deja une etape.
--
-- Les entites ne declarent pas toutes un nom de table : sur MySQL Windows
-- (lower_case_table_names = 1) la table des statuts s'appelle `status`, sur
-- un MySQL sensible a la casse `Status`. Verifiez avec SHOW TABLES;.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Table (inutile si l'application a deja demarre en 2.0.13).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_etape (
    id        BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    status_id BIGINT      NOT NULL,
    etape     VARCHAR(20) NOT NULL,
    CONSTRAINT uk_status_etape_status UNIQUE (status_id),
    CONSTRAINT fk_status_etape_status FOREIGN KEY (status_id) REFERENCES status (id)
);


-- ---------------------------------------------------------------------
-- 2. Etapes des statuts crees par defaut (ProjectService, IssueService).
--
-- La comparaison de MySQL ignore casse et accents (collation *_ci) ; TRIM
-- rattrape « En cours  » cree avec un espace final. Dans un flux, la
-- synchronisation prend le PREMIER statut de l'etape : dans le flux par
-- defaut, 100 % mene a « Corrigé ».
-- ---------------------------------------------------------------------
INSERT INTO status_etape (status_id, etape)
SELECT s.id,
       CASE
           WHEN TRIM(s.display_name) IN ('En Attente', 'Ouvert', 'A faire')           THEN 'A_FAIRE'
           WHEN TRIM(s.display_name) IN ('En Cours')                                  THEN 'EN_COURS'
           WHEN TRIM(s.display_name) IN ('Bloqué')                                    THEN 'BLOQUE'
           WHEN TRIM(s.display_name) IN ('Corrigé', 'A vérifier')                     THEN 'A_VALIDER'
           WHEN TRIM(s.display_name) IN ('Résolue', 'Resolues', 'Terminé', 'Archivés', 'Abandonné') THEN 'TERMINE'
       END
FROM status s
WHERE TRIM(s.display_name) IN ('En Attente', 'Ouvert', 'A faire', 'En Cours', 'Bloqué',
                               'Corrigé', 'A vérifier',
                               'Résolue', 'Resolues', 'Terminé', 'Archivés', 'Abandonné')
  AND NOT EXISTS (SELECT 1 FROM status_etape se WHERE se.status_id = s.id);


-- ---------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------
-- SELECT s.id, s.display_name, se.etape
-- FROM status s LEFT JOIN status_etape se ON se.status_id = s.id
-- ORDER BY se.etape, s.display_name;


-- ---------------------------------------------------------------------
-- Retour arriere
-- ---------------------------------------------------------------------
-- DROP TABLE status_etape;
