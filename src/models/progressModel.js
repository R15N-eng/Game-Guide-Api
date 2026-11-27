// ARQUIVO: progressModel.js
// FUNÇÃO: Queries SQL relacionadas ao progresso do usuário
// MÉTODOS QUE TERÁ:
//   - getByUserAndGame(userId, gameId)   → progresso do usuário num jogo
//   - complete(userId, achievementId)    → marcar conquista como feita
//   - uncomplete(userId, achievementId)  → desmarcar conquista
//   - getPercentage(userId, gameId)      → calcular % de platina

const pool = require('../config/database') //Importa o pool de conexões do banco de dados para realizar as consultas SQL

const ProgressModel = {
    async getByUserAndGame(userId, gameId) { //Função para obter o progresso do usuário em um jogo específico
        const query = `
            SELECT a.*, up.completed_at 
            FROM achievements a
            LEFT JOIN user_progress up 
                ON up.achievement_id = a.id AND up.user_id = $1
            WHERE a.game_id = $2
        ` //Query SQL que busca todas as conquistas do jogo e, via JOIN, verifica quais o usuário já completou
        //Atenção: O LEFT JOIN garante que todas as conquistas do jogo sejam retornadas, mesmo que o usuário não tenha completado nenhuma (nesse caso, completed_at será null)
        const values = [userId, gameId] //Valores para a query, usando parâmetros para evitar SQL Injection
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows //Retorna todas as conquistas do jogo com a data de conclusão (null se não completada)
    },

    async complete(userId, achievementId) { //Função para marcar uma conquista como feita para um usuário
        const query = 'INSERT INTO user_progress (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT (user_id, achievement_id) DO NOTHING RETURNING *' //Se já estiver marcada, não cria outra linha
        const values = [userId, achievementId] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        if (result.rows[0]) return result.rows[0] //Retorna o progresso recém-criado
        const existing = await pool.query('SELECT * FROM user_progress WHERE user_id = $1 AND achievement_id = $2', values)
        return existing.rows[0] //Já estava marcada: devolve o registro original
    },

    async uncomplete(userId, achievementId) { //Função para desmarcar uma conquista como feita para um usuário
        const query = 'DELETE FROM user_progress WHERE user_id = $1 AND achievement_id = $2 RETURNING *' //Query SQL para deletar o registro de progresso indicando que o usuário completou a conquista
        const values = [userId, achievementId] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna o progresso deletado (pode ser útil para confirmação)
    },

    async getPercentage(userId, gameId) { //Função para calcular a porcentagem de conquistas completadas pelo usuário para um jogo específico
        const query = `
            SELECT 
            COUNT(a.id) AS total,
            COUNT(up.id) AS completed
            FROM achievements a
            LEFT JOIN user_progress up 
            ON up.achievement_id = a.id AND up.user_id = $1
            WHERE a.game_id = $2
        `
        const values = [userId, gameId] //Valores para a query, usando parâmetros para evitar SQL Injection
        const result = await pool.query(query, values) //   Executa a query no banco de dados
        const { total, completed } = result.rows[0] //Desestrutura os resultados para obter o total de conquistas e o número de conquistas completadas pelo usuário
        if (Number(total) === 0) return 0 //Jogo sem conquistas (ou inexistente): evita divisão por zero
        return Math.round((completed / total) * 100) //Retorna a porcentagem de conquistas completadas pelo usuário para o jogo, arredondada para o número inteiro mais próximo
    },

}

module.exports = ProgressModel //Exporta o objeto ProgressModel para ser usado em outros arquivos, como os controllers, para realizar as operações relacionadas ao progresso do usuário no banco de dados   