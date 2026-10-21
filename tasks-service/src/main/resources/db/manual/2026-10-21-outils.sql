-- =====================================================================
-- Menu Outils (DT-019) : dossiers, outils et fichiers des outils.
--
-- Au demarrage de la 2.0.40, Hibernate (ddl-auto=update) cree ces tables,
-- VIDES : le menu Outils s'ouvre sur ses quatre dossiers racines (types).
-- Ce script sert aux bases ou ddl-auto est desactive (profils Liquibase),
-- ou pour verifier la structure attendue.
--
-- Rejouable : CREATE TABLE IF NOT EXISTS.
--
-- 2.0.41 : colonne outil.icone, dans la table ci-dessous (aucun script de
-- ce menu n'avait encore ete passe). Une table outil deja creee par la
-- 2.0.40 la recoit d'Hibernate au demarrage (ddl-auto=update).
--
-- Fichiers sur le disque : <app.storage.base-path>/outils/<id outil>/ ;
-- le dossier est cree au premier envoi. Pensez a l'inclure dans les
-- sauvegardes.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Dossiers (sous un type d'outil, deux niveaux au plus).
--    project_id null <=> portee = 'TOUS_LES_ESPACES'.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dossier_outil (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(120) NOT NULL,
    type_outil    VARCHAR(30)  NOT NULL,
    portee        VARCHAR(20)  NOT NULL,
    parent_id     BIGINT       NULL,
    project_id    BIGINT       NULL,
    user_app_id   VARCHAR(255) NOT NULL,
    date_creation DATETIME(6)  NOT NULL,
    deleted       BIT          NOT NULL DEFAULT 0,
    CONSTRAINT fk_dossier_outil_parent  FOREIGN KEY (parent_id)   REFERENCES dossier_outil (id),
    CONSTRAINT fk_dossier_outil_project FOREIGN KEY (project_id)  REFERENCES project (id),
    CONSTRAINT fk_dossier_outil_auteur  FOREIGN KEY (user_app_id) REFERENCES user_app (id),
    INDEX ix_dossier_outil_rangement (type_outil, parent_id),
    INDEX ix_dossier_outil_project (project_id)
);


-- ---------------------------------------------------------------------
-- 2. Outils (logiciel, modele de document, tutoriel video, lien).
--    icone : classe Font Awesome choisie (« fab fa-windows ») ; null :
--    l'icone du type.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outil (
    id                BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    titre             VARCHAR(200)  NOT NULL,
    description       LONGTEXT      NULL,
    type_outil        VARCHAR(30)   NOT NULL,
    portee            VARCHAR(20)   NOT NULL,
    dossier_id        BIGINT        NULL,
    project_id        BIGINT        NULL,
    url               VARCHAR(2000) NULL,
    version           VARCHAR(50)   NULL,
    icone             VARCHAR(100)  NULL,
    user_app_id       VARCHAR(255)  NOT NULL,
    date_creation     DATETIME(6)   NOT NULL,
    date_modification DATETIME(6)   NULL,
    deleted           BIT           NOT NULL DEFAULT 0,
    CONSTRAINT fk_outil_dossier FOREIGN KEY (dossier_id)  REFERENCES dossier_outil (id),
    CONSTRAINT fk_outil_project FOREIGN KEY (project_id)  REFERENCES project (id),
    CONSTRAINT fk_outil_auteur  FOREIGN KEY (user_app_id) REFERENCES user_app (id),
    INDEX ix_outil_rangement (type_outil, dossier_id),
    INDEX ix_outil_project (project_id)
);


-- ---------------------------------------------------------------------
-- 3. Fichiers des outils. nom_stockage : nom genere sur le disque ;
--    nom_origine : nom affiche et propose au telechargement.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outil_fichier (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    outil_id     BIGINT       NOT NULL,
    nom_origine  VARCHAR(255) NOT NULL,
    nom_stockage VARCHAR(80)  NOT NULL,
    type_mime    VARCHAR(150) NULL,
    taille       BIGINT       NOT NULL,
    user_app_id  VARCHAR(255) NOT NULL,
    date_ajout   DATETIME(6)  NOT NULL,
    deleted      BIT          NOT NULL DEFAULT 0,
    CONSTRAINT uk_outil_fichier_nom_stockage UNIQUE (nom_stockage),
    CONSTRAINT fk_outil_fichier_outil  FOREIGN KEY (outil_id)    REFERENCES outil (id),
    CONSTRAINT fk_outil_fichier_auteur FOREIGN KEY (user_app_id) REFERENCES user_app (id),
    INDEX ix_outil_fichier_outil (outil_id)
);


-- ---------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------
-- SELECT o.type_outil, o.portee, p.name AS espace, COUNT(*) AS outils
-- FROM outil o LEFT JOIN project p ON p.id = o.project_id
-- WHERE o.deleted = 0
-- GROUP BY o.type_outil, o.portee, p.name;


-- ---------------------------------------------------------------------
-- Retour arriere (les fichiers du disque restent a supprimer a la main)
-- ---------------------------------------------------------------------
-- DROP TABLE outil_fichier;
-- DROP TABLE outil;
-- DROP TABLE dossier_outil;
