// ARQUIVO: achievementModel.js
// FUNÇÃO: Queries SQL relacionadas às conquistas
// MÉTODOS QUE TERÁ:
//   - getByGameId(gameId)     → listar conquistas de um jogo
//   - getById(id)             → buscar conquista por id
//   - create(data)            → cadastrar nova conquista
//   - update(id, data)        → editar conquista
//   - delete(id)              → deletar conquista

const pool = require('../config/database') //Importa o pool de conexões do banco de dados para realizar as consultas SQL

const AchievementModel = {
    async getByGameId(gameId) { //Função para listar as conquistas de um jogo específico pelo id do jogo
        const query = 'SELECT * FROM achievements WHERE game_id = $1 ORDER BY name ASC' //Query SQL para selecionar as conquistas do jogo com o id fornecido, ordenadas por nome em ordem alfabética
        const values = [gameId] //Valores para a query, usando parâmetros para evitar SQL Injection
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows //Retorna todas as conquistas encontradas para o jogo
    },
    
    async getById(id, gameId) { //Função para buscar uma conquista por id
        const query = 'SELECT * FROM achievements WHERE id = $1 AND game_id = $2' //Query SQL para selecionar a conquista com o id fornecido
        const values = [id, gameId] //Valores para a query, usando  parâmetros para evitar SQL Injection
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna o primeiro resultado encontrado (deve ser único)
    },
    
    async create(data) { //Função para cadastrar uma nova conquista com os dados fornecidos
        const query = 'INSERT INTO achievements (game_id, name, description, tips, is_missable, trophy_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *' //Query SQL para inserir uma nova conquista e retornar os dados inseridos
        const values = [data.game_id, data.name, data.description, data.tips, data.is_missable, data.trophy_type] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna a conquista recém-criada
    },
    
    async update(id, gameId, data) { //Função para editar uma conquista existente com o id e os novos dados fornecidos
        const query = 'UPDATE achievements SET name = $1, description = $2, tips = $3, is_missable = $4, trophy_type = $5 WHERE id = $6 AND game_id = $7 RETURNING *' //Query SQL para atualizar a conquista com o id fornecido e retornar os dados atualizados
        const values = [data.name, data.description, data.tips, data.is_missable, data.trophy_type, id, gameId] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna a conquista atualizada
    },
    
    async delete(id, gameId) { //Função para deletar uma conquista por id
        const query = 'DELETE FROM achievements WHERE id = $1 AND game_id = $2 RETURNING *' //Query SQL para deletar a conquista com o id fornecido e retornar os dados da conquista deletada
        const values = [id, gameId] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna a conquista deletada (pode ser útil para confirmação)
    },
}

module.exports = AchievementModel //Exporta o objeto AchievementModel para ser usado em outros arquivos, como os controllers, para realizar as operações relacionadas às conquistas no banco de dados