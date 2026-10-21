-- =====================================================================
-- Menu Outils (DT-019) : verification du schema, AVANT de demarrer la
-- version. Lecture seule : ne modifie rien, se relance autant qu'il faut.
--
-- A passer apres 2026-10-21-outils.sql (creation des tables), connecte a
-- la base de l'application (teams-gosco sur le serveur).
--
-- Une ligne par point attendu (table, colonne, cle etrangere, collation),
-- les problemes d'abord :
--   OK        : conforme a ce que l'application lit ;
--   MANQUANT  : a creer, l'ecran correspondant echouerait ;
--   DIFFERENT : existe, mais pas comme attendu (voir la colonne « trouve »).
-- Tout doit etre OK. Couvre aussi uploaded (auteur et date des pieces
-- jointes, lus par la liste des fichiers depuis la 2.0.36).
--
-- Un point ajoute a l'application (table, colonne, cle) s'ajoute ici, dans
-- la liste « a » : une ligne par point.
-- =====================================================================

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
