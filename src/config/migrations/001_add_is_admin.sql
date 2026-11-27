-- Para bancos criados antes desta mudança. Pode ser executado mais de uma vez.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
