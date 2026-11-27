-- Para bancos criados antes desta mudança. Pode ser executado mais de uma vez.
-- ATENÇÃO: apaga as linhas repetidas de progresso, mantendo a mais antiga de cada par usuário/conquista.
BEGIN;

DELETE FROM user_progress AS repeated
USING user_progress AS original
WHERE repeated.user_id = original.user_id
  AND repeated.achievement_id = original.achievement_id
  AND repeated.id > original.id;

CREATE UNIQUE INDEX IF NOT EXISTS user_progress_user_achievement_key
  ON user_progress (user_id, achievement_id);

COMMIT;
