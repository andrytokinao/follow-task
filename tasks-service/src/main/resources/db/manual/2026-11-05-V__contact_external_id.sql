-- Migration : Contact — external_id obligatoire + nouveaux index (réception des messages venant du gateway)
-- SGBD : MariaDB (DDL auto-commit, script rejouable grâce aux IF [NOT] EXISTS)
-- État de départ : external_id existe déjà (NULL autorisé), 2 uniques sur (type_contact, contact_value)

-- 1. Colonne external_id (déjà présente en base, sans effet dans ce cas)
ALTER TABLE contact ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) NULL;

-- 2. Backfill : l'ancien contact_value contenait l'identifiant externe (jid WhatsApp, email, téléphone...)
UPDATE contact
SET external_id = contact_value
WHERE external_id IS NULL;

-- 3. external_id devient obligatoire
ALTER TABLE contact MODIFY COLUMN external_id VARCHAR(255) NOT NULL;

-- 4. contact_value devient optionnel
ALTER TABLE contact MODIFY COLUMN contact_value VARCHAR(255) NULL;

-- 5. Suppression des anciens uniques (type_contact, contact_value) — il y en a deux en base
DROP INDEX IF EXISTS uk_contact_type_value ON contact;
DROP INDEX IF EXISTS idx_contact_type_value ON contact;

-- 6. Nouvel unique (type_contact, external_id)
CREATE UNIQUE INDEX IF NOT EXISTS uk_contact_type_external
    ON contact (type_contact, external_id);

-- 7. Index simple (type_contact, contact_value) pour la recherche
CREATE INDEX IF NOT EXISTS idx_contact_value
    ON contact (type_contact, contact_value);

-- Rollback (si besoin) :
-- DROP INDEX IF EXISTS idx_contact_value ON contact;
-- DROP INDEX IF EXISTS uk_contact_type_external ON contact;
-- UPDATE contact SET contact_value = external_id WHERE contact_value IS NULL;
-- ALTER TABLE contact MODIFY COLUMN contact_value VARCHAR(255) NOT NULL;
-- ALTER TABLE contact MODIFY COLUMN external_id VARCHAR(255) NULL;
-- CREATE UNIQUE INDEX uk_contact_type_value ON contact (type_contact, contact_value);
-- CREATE UNIQUE INDEX idx_contact_type_value ON contact (type_contact, contact_value);
