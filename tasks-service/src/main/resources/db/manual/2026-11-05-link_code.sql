-- Migration : table link_code (codes à 6 chiffres pour lier un contact WhatsApp à un compte)
-- SGBD : MariaDB (DDL auto-commit, script rejouable grâce aux IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS link_code (
    id            VARCHAR(255) NOT NULL,
    user_app_id   VARCHAR(255) NOT NULL,
    type_contact  VARCHAR(32)  NOT NULL,
    code          VARCHAR(8)   NOT NULL,
    expires_at    DATETIME     NOT NULL,
    used_at       DATETIME     NULL,
    created_at    DATETIME     NOT NULL,
    PRIMARY KEY (id),
    -- Pas d'unicité sur code : un code à 6 chiffres est réutilisé après expiration/usage.
    -- L'unicité parmi les codes ACTIFS est garantie par ContactLinkService.generate().
    KEY idx_link_code_code (code, used_at, expires_at),
    KEY idx_link_code_user (user_app_id, type_contact, used_at),
    CONSTRAINT fk_link_code_user_app FOREIGN KEY (user_app_id) REFERENCES userapp (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nettoyage optionnel des codes périmés (à lancer à la main ou via un job planifié) :
-- DELETE FROM link_code WHERE expires_at < NOW() - INTERVAL 1 DAY;

-- Rollback (si besoin) :
-- DROP TABLE IF EXISTS link_code;
