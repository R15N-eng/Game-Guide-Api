// ARQUIVO: gameModel.js
// FUNÇÃO: Queries SQL relacionadas aos jogos
// MÉTODOS QUE TERÁ:
//   - getAll()                → listar todos os jogos
//   - getById(id)             → buscar jogo por id
//   - create(data)            → cadastrar novo jogo
//   - update(id, data)        → editar jogo
//   - delete(id)              → deletar jogo

const pool = require('../config/database') //Importa o pool de conexões do banco de dados para realizar as consultas SQL

const GameModel = {
    async getAll() { //Função para listar todos os jogos
        const result = await pool.query('SELECT * FROM games ORDER BY title ASC') //Query SQL para selecionar todos os jogos, ordenados por título em ordem alfabética
        return result.rows //Retorna todos os jogos encontrados
    },

    async getById(id) { //Função para buscar um jogo por id
        const query = 'SELECT * FROM games WHERE id = $1' //Query SQL para selecionar o jogo com o id fornecido
        const values = [id] //Valores para a query, usando parâmetros para evitar SQL Injection
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna o primeiro resultado encontrado (deve ser único)
    },

    async create(data) { //Função para cadastrar um novo jogo com os dados fornecidos
        const query = 'INSERT INTO games (title, description, cover_url, platform, release_year) VALUES ($1, $2, $3, $4, $5) RETURNING *' //Query SQL para inserir um novo jogo e retornar os dados inseridos
        const values = [data.title, data.description, data.cover_url, data.platform, data.release_year] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna o jogo recém-criado
    },
    
    async update(id, data) { //Função para editar um jogo existente com o id e os novos dados fornecidos
        const query = 'UPDATE games SET title = $1, description = $2, cover_url = $3, platform = $4, release_year = $5 WHERE id = $6 RETURNING *' //Query SQL para atualizar o jogo com o id fornecido e retornar os dados atualizados
        const values = [data.title, data.description, data.cover_url, data.platform, data.release_year, id] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna o jogo atualizado
    },
    
    async delete(id) { //Função para deletar um jogo por id
        const query = 'DELETE FROM games WHERE id = $1 RETURNING *' //Query SQL para deletar o jogo com o id fornecido e retornar os dados do jogo deletado
        const values = [id] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna o jogo deletado (pode ser útil para confirmação)
    },
}

module.exports = GameModel //Exporta o objeto GameModel para ser usado em outros arquivos, como os controllers, para realizar as operações relacionadas aos jogos no banco de dados