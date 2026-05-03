// ARQUIVO: userModel.js
// FUNÇÃO: Queries SQL relacionadas ao usuário
// MÉTODOS QUE TERÁ: (Funções que serão exportadas para o controller)
//   - findByEmail(email)      → buscar usuário pelo email
//   - create(email, hash)     → criar novo usuário
//   - findById(id)            → buscar usuário pelo id

const pool = require('../config/database') //Importa o pool de conexões do banco de dados para realizar as consultas SQL

const UserModel = {
    async findByEmail(email) { //Função para buscar um usuário pelo email
        const query = 'SELECT * FROM users WHERE email = $1' //Query SQL para selecionar o usuário com o email fornecido
        const values = [email] //Valores para a query, usando parâmetros para evitar SQL Injection
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna o primeiro resultado encontrado (deve ser único)
    },

    async create(email, hash) { //Função para criar um novo usuário com email e senha (hash)
        const query = 'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *' //Query SQL para inserir um novo usuário e retornar os dados inseridos
        const values = [email, hash] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna
    },

    async findById(id) { //Função para buscar um usuário pelo id
        const query = 'SELECT * FROM users WHERE id = $1' //Query SQL para selecionar o usuário com o id fornecido
        const values = [id] //Valores para a query
        const result = await pool.query(query, values) //Executa a query no banco de dados
        return result.rows[0] //Retorna o primeiro resultado encontrado (deve ser único)
    },
}

module.exports = UserModel //Exporta o objeto UserModel para ser usado em outros arquivos, como os controllers, para realizar as operações relacionadas ao usuário no banco de dados