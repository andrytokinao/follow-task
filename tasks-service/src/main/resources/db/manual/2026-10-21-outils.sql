-- =====================================================================
-- Menu Outils (DT-019) : dossiers, outils et fichiers des outils.
--
-- A PASSER AVANT LE DEMARRAGE de la version qui apporte le menu Outils :
-- sur le serveur, Hibernate (ddl-auto=update) ne cree pas ces tables (la
-- raison n'est pas encore connue). Sans elles, le menu Outils echoue.
-- Les tables sont creees VIDES : le menu s'ouvre sur ses quatre dossiers
-- racines (types).
--
-- Rejouable : CREATE TABLE IF NOT EXISTS. Instructions independantes :
-- s'execute en script (Alt+X) comme instruction par instruction.
-- La section 4 verifie le resultat : tout doit y etre OK avant de demarrer.
--
-- Ecrit pour la base du serveur (MariaDB 11.8, verifie le 21/10/2026) :
--   - la table des utilisateurs s'appelle userapp (et non user_app) ;
--   - userapp.id : varchar(255) utf8mb4 utf8mb4_unicode_ci ;
--   - project.id : bigint(20) ;
--   - base et tables en utf8mb4_unicode_ci, InnoDB.
-- Une cle etrangere exige une colonne identique a celle qu'elle designe
-- (type, et pour un VARCHAR jeu de caracteres et collation) dans une table
-- qui existe, sinon MariaDB refuse la table (« errno: 150 Foreign key
-- constraint is incorrectly formed »).
--
-- 2.0.41 : colonne outil.icone, dans la table ci-dessous (aucun script de
-- ce menu n'avait encore ete passe).
--
-- Fichiers sur le disque : <app.storage.base-path>/outils/<id outil>/ ;
-- le dossier est cree au premier envoi. Pensez a l'inclure dans les
-- sauvegardes.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Controle prealable, si une autre base doit recevoir ce script : les
--    noms et definitions ci-dessous doivent correspondre.
-- ---------------------------------------------------------------------
-- SELECT table_name, column_name, column_type, character_set_name, collation_name
-- FROM information_schema.columns
-- WHERE table_schema = DATABASE() AND column_name = 'id'
--   AND table_name IN ('project', 'userapp');


-- ---------------------------------------------------------------------
-- 1. Dossiers (sous un type d'outil, deux niveaux au plus).
--    project_id null <=> portee = 'TOUS_LES_ESPACES'.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dossier_outil (
    id            BIGINT(20)   NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(120) NOT NULL,
    type_outil    VARCHAR(30)  NOT NULL,
    portee        VARCHAR(20)  NOT NULL,
    parent_id     BIGINT(20)   NULL,
    project_id    BIGINT(20)   NULL,
    user_app_id   VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    date_creation DATETIME(6)  NOT NULL,
    deleted       BIT          NOT NULL DEFAULT 0,
    CONSTRAINT fk_dossier_outil_parent  FOREIGN KEY (parent_id)   REFERENCES dossier_outil (id),
    CONSTRAINT fk_dossier_outil_project FOREIGN KEY (project_id)  REFERENCES project (id),
    CONSTRAINT fk_dossier_outil_auteur  FOREIGN KEY (user_app_id) REFERENCES userapp (id),
    INDEX ix_dossier_outil_rangement (type_outil, parent_id),
    INDEX ix_dossier_outil_project (project_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 2. Outils (logiciel, modele de document, tutoriel video, lien).
--    icone : classe Font Awesome choisie (« fab fa-windows ») ; null :
--    l'icone du type.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outil (
    id                BIGINT(20)    NOT NULL AUTO_INCREMENT PRIMARY KEY,
    titre             VARCHAR(200)  NOT NULL,
    description       LONGTEXT      NULL,
    type_outil        VARCHAR(30)   NOT NULL,
    portee            VARCHAR(20)   NOT NULL,
    dossier_id        BIGINT(20)    NULL,
    project_id        BIGINT(20)    NULL,
    url               VARCHAR(2000) NULL,
    version           VARCHAR(50)   NULL,
    icone             VARCHAR(100)  NULL,
    user_app_id       VARCHAR(255)  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    date_creation     DATETIME(6)   NOT NULL,
    date_modification DATETIME(6)   NULL,
    deleted           BIT           NOT NULL DEFAULT 0,
    CONSTRAINT fk_outil_dossier FOREIGN KEY (dossier_id)  REFERENCES dossier_outil (id),
    CONSTRAINT fk_outil_project FOREIGN KEY (project_id)  REFERENCES project (id),
    CONSTRAINT fk_outil_auteur  FOREIGN KEY (user_app_id) REFERENCES userapp (id),
    INDEX ix_outil_rangement (type_outil, dossier_id),
    INDEX ix_outil_project (project_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 3. Fichiers des outils. nom_stockage : nom genere sur le disque ;
--    nom_origine : nom affiche et propose au telechargement.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outil_fichier (
    id           BIGINT(20)   NOT NULL AUTO_INCREMENT PRIMARY KEY,
    outil_id     BIGINT(20)   NOT NULL,
    nom_origine  VARCHAR(255) NOT NULL,
    nom_stockage VARCHAR(80)  NOT NULL,
    type_mime    VARCHAR(150) NULL,
    taille       BIGINT(20)   NOT NULL,
    user_app_id  VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    date_ajout   DATETIME(6)  NOT NULL,
    deleted      BIT          NOT NULL DEFAULT 0,
    CONSTRAINT uk_outil_fichier_nom_stockage UNIQUE (nom_stockage),
    CONSTRAINT fk_outil_fichier_outil  FOREIGN KEY (outil_id)    REFERENCES outil (id),
    CONSTRAINT fk_outil_fichier_auteur FOREIGN KEY (user_app_id) REFERENCES userapp (id),
    INDEX ix_outil_fichier_outil (outil_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 4. Verification, avant de demarrer la version : lecture seule, a
--    relancer autant qu'il faut. Une ligne par point attendu (table,
--    colonne, cle etrangere, collation), les problemes d'abord :
--      OK        : conforme a ce que l'application lit ;
--      MANQUANT  : a creer, l'ecran correspondant echouerait ;
--      DIFFERENT : existe, mais pas comme attendu (voir « trouve »).
--    Tout doit etre OK. Couvre aussi uploaded (auteur et date des pieces
--    jointes, lus par la liste des fichiers depuis la 2.0.36).
-- ---------------------------------------------------------------------
-- information_schema rend ses textes en utf8mb3 : les deux cotes passent en
-- utf8mb4 et se comparent sous une meme collation, sans quoi MariaDB peut
-- refuser la comparaison (« Illegal mix of collations »).
SELECT a.controle,
       a.objet,
       a.attendu,
       COALESCE(t.trouve, '-') AS trouve,
       CASE
           WHEN t.trouve IS NULL THEN 'MANQUANT'
           WHEN t.trouve = CONVERT(a.attendu USING utf8mb4) COLLATE utf8mb4_general_ci THEN 'OK'
           ELSE 'DIFFERENT'
       END AS statut
FROM (
    -- Tables
              SELECT 'table' AS controle, 'dossier_outil' AS objet, 'InnoDB' AS attendu
    UNION ALL SELECT 'table', 'outil',         'InnoDB'
    UNION ALL SELECT 'table', 'outil_fichier', 'InnoDB'
    -- Colonnes : type, puis NULL autorise ou non
    UNION ALL SELECT 'colonne', 'dossier_outil.id',            'bigint NO'
    UNION ALL SELECT 'colonne', 'dossier_outil.nom',           'varchar(120) NO'
    UNION ALL SELECT 'colonne', 'dossier_outil.type_outil',    'varchar(30) NO'
    UNION ALL SELECT 'colonne', 'dossier_outil.portee',        'varchar(20) NO'
    UNION ALL SELECT 'colonne', 'dossier_outil.parent_id',     'bigint YES'
    UNION ALL SELECT 'colonne', 'dossier_outil.project_id',    'bigint YES'
    UNION ALL SELECT 'colonne', 'dossier_outil.user_app_id',   'varchar(255) NO'
    UNION ALL SELECT 'colonne', 'dossier_outil.date_creation', 'datetime NO'
    UNION ALL SELECT 'colonne', 'dossier_outil.deleted',       'bit NO'
    UNION ALL SELECT 'colonne', 'outil.id',                    'bigint NO'
    UNION ALL SELECT 'colonne', 'outil.titre',                 'varchar(200) NO'
    UNION ALL SELECT 'colonne', 'outil.description',           'longtext YES'
    UNION ALL SELECT 'colonne', 'outil.type_outil',            'varchar(30) NO'
    UNION ALL SELECT 'colonne', 'outil.portee',                'varchar(20) NO'
    UNION ALL SELECT 'colonne', 'outil.dossier_id',            'bigint YES'
    UNION ALL SELECT 'colonne', 'outil.project_id',            'bigint YES'
    UNION ALL SELECT 'colonne', 'outil.url',                   'varchar(2000) YES'
    UNION ALL SELECT 'colonne', 'outil.version',               'varchar(50) YES'
    UNION ALL SELECT 'colonne', 'outil.icone',                 'varchar(100) YES'
    UNION ALL SELECT 'colonne', 'outil.user_app_id',           'varchar(255) NO'
    UNION ALL SELECT 'colonne', 'outil.date_creation',         'datetime NO'
    UNION ALL SELECT 'colonne', 'outil.date_modification',     'datetime YES'
    UNION ALL SELECT 'colonne', 'outil.deleted',               'bit NO'
    UNION ALL SELECT 'colonne', 'outil_fichier.id',            'bigint NO'
    UNION ALL SELECT 'colonne', 'outil_fichier.outil_id',      'bigint NO'
    UNION ALL SELECT 'colonne', 'outil_fichier.nom_origine',   'varchar(255) NO'
    UNION ALL SELECT 'colonne', 'outil_fichier.nom_stockage',  'varchar(80) NO'
    UNION ALL SELECT 'colonne', 'outil_fichier.type_mime',     'varchar(150) YES'
    UNION ALL SELECT 'colonne', 'outil_fichier.taille',        'bigint NO'
    UNION ALL SELECT 'colonne', 'outil_fichier.user_app_id',   'varchar(255) NO'
    UNION ALL SELECT 'colonne', 'outil_fichier.date_ajout',    'datetime NO'
    UNION ALL SELECT 'colonne', 'outil_fichier.deleted',       'bit NO'
    UNION ALL SELECT 'colonne', 'uploaded.path',               'varchar(255) YES'
    UNION ALL SELECT 'colonne', 'uploaded.user_app_id',        'varchar(255) YES'
    UNION ALL SELECT 'colonne', 'uploaded.upload_date',        'datetime YES'
    -- Cles etrangeres : table et colonne designees
    UNION ALL SELECT 'cle etrangere', 'fk_dossier_outil_parent',  'dossier_outil.id'
    UNION ALL SELECT 'cle etrangere', 'fk_dossier_outil_project', 'project.id'
    UNION ALL SELECT 'cle etrangere', 'fk_dossier_outil_auteur',  'userapp.id'
    UNION ALL SELECT 'cle etrangere', 'fk_outil_dossier',         'dossier_outil.id'
    UNION ALL SELECT 'cle etrangere', 'fk_outil_project',         'project.id'
    UNION ALL SELECT 'cle etrangere', 'fk_outil_auteur',          'userapp.id'
    UNION ALL SELECT 'cle etrangere', 'fk_outil_fichier_outil',   'outil.id'
    UNION ALL SELECT 'cle etrangere', 'fk_outil_fichier_auteur',  'userapp.id'
    -- Collation des auteurs : la meme que userapp.id
    UNION ALL SELECT 'collation', 'dossier_outil.user_app_id', 'utf8mb4_unicode_ci'
    UNION ALL SELECT 'collation', 'outil.user_app_id',         'utf8mb4_unicode_ci'
    UNION ALL SELECT 'collation', 'outil_fichier.user_app_id', 'utf8mb4_unicode_ci'
    UNION ALL SELECT 'collation', 'userapp.id',                'utf8mb4_unicode_ci'
) a
LEFT JOIN (
    SELECT CONVERT(controle USING utf8mb4) COLLATE utf8mb4_general_ci AS controle,
           CONVERT(objet USING utf8mb4) COLLATE utf8mb4_general_ci AS objet,
           CONVERT(trouve USING utf8mb4) COLLATE utf8mb4_general_ci AS trouve
    FROM (
                  SELECT 'table' AS controle, LOWER(table_name) AS objet, engine AS trouve
                  FROM information_schema.tables
                  WHERE table_schema = DATABASE()
        UNION ALL SELECT 'colonne', CONCAT(LOWER(table_name), '.', LOWER(column_name)),
                         CONCAT(CASE WHEN data_type = 'varchar' THEN CONCAT('varchar(', character_maximum_length, ')')
                                     ELSE data_type END, ' ', is_nullable)
                  FROM information_schema.columns
                  WHERE table_schema = DATABASE()
        UNION ALL SELECT 'cle etrangere', LOWER(constraint_name),
                         CONCAT(LOWER(referenced_table_name), '.', LOWER(referenced_column_name))
                  FROM information_schema.key_column_usage
                  WHERE table_schema = DATABASE() AND referenced_table_name IS NOT NULL
        UNION ALL SELECT 'collation', CONCAT(LOWER(table_name), '.', LOWER(column_name)), collation_name
                  FROM information_schema.columns
                  WHERE table_schema = DATABASE() AND collation_name IS NOT NULL
    ) brut
) t ON t.controle = CONVERT(a.controle USING utf8mb4) COLLATE utf8mb4_general_ci
   AND t.objet = CONVERT(a.objet USING utf8mb4) COLLATE utf8mb4_general_ci
ORDER BY CASE
             WHEN t.trouve IS NULL THEN 0
             WHEN t.trouve = CONVERT(a.attendu USING utf8mb4) COLLATE utf8mb4_general_ci THEN 2
             ELSE 1
         END,
         a.controle, a.objet;

-- Contenu, une fois l'application demarree et des outils ajoutes :
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
