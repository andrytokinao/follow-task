-- =====================================================================
-- Rattachement d'un compte WhatsApp a un utilisateur
-- A executer manuellement sur la base MySQL (profil `mysql`).
--
-- Une seule table ajoutee. Aucune table existante n'est modifiee : le
-- compte rattache est enregistre dans `contact`, deja en place
-- (type_contact = 'WHATSAPP', user_app_id renseigne, is_verified = 1).
-- =====================================================================

CREATE TABLE IF NOT EXISTS whatsapp_link_request (
    id          VARCHAR(36)  NOT NULL,
    user_app_id VARCHAR(255) NOT NULL,
    -- Code que l'utilisateur envoie lui-meme au numero du systeme.
    code        VARCHAR(32)  NOT NULL,
    created_at  DATETIME(6)  NOT NULL,
    expires_at  DATETIME(6)  NOT NULL,
    -- Renseigne au rattachement : une demande ne sert qu'une fois.
    consumed_at DATETIME(6)  NULL,
    -- jid WhatsApp depuis lequel le code est arrive.
    linked_jid  VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_whatsapp_link_code (code),
    -- Demandes encore valables d'un utilisateur : c'est la seule lecture
    -- frequente (affichage du profil, verification).
    KEY idx_whatsapp_link_user (user_app_id, consumed_at, expires_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;


-- ---------------------------------------------------------------------
-- Cle etrangere vers l'utilisateur : facultative.
--
-- L'entite UserApp ne declare pas de @Table : le nom physique est donc
-- celui de la classe. Sur MySQL Windows (lower_case_table_names = 1) il
-- s'agit de `userapp` ; sur un MySQL sensible a la casse, de `UserApp`.
-- Verifiez avec SHOW TABLES LIKE '%ser%pp'; puis executez la ligne
-- correspondante. La table fonctionne sans cette contrainte.
-- ---------------------------------------------------------------------

-- ALTER TABLE whatsapp_link_request
--     ADD CONSTRAINT fk_whatsapp_link_user
--     FOREIGN KEY (user_app_id) REFERENCES userapp (id);


-- ---------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------
-- SHOW CREATE TABLE whatsapp_link_request;
