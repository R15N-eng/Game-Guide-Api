// ARQUIVO: database.js
// FUNÇÃO: Conectar ao PostgreSQL usando as variáveis do .env
// TAREFA: Preencher com a configuração do Pool (igual ao Task App)

const { Pool } = require('pg') //Importação do Pool(gerenciador de conexão) do pg (PostgreSQL para Node.js) para gerenciar conexões com o banco
require('dotenv').config() //Mnatem as conexões pronta para usar, diferente de fazer uma por vez
 
const pool = new Pool({ //Criação do pool de conexões com as variáveis do .env
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

pool.query('SELECT 1') //Testa a conexão e já devolve o cliente ao pool
  .then(() => console.log('Conectado ao PostgreSQL!'))//Mensagem de sucesso na conexão
  .catch((err) => console.error('Erro ao conectar ao banco:', err.message))//Mensagem caso dê erro de conexão

module.exports = pool //Exporta o pool para ser usado em outros arquivos, como os controllers, para realizar consultas ao banco de dados