// ARQUIVO: server.js
// FUNÇÃO: Porta de entrada do app — liga tudo
// TAREFA: Configurar Express, registrar todas as rotas, iniciar o servidor
// SIMILAR ao server.js do Task App, mas com mais rotas

const express = require('express') //Importa o Express para criar o servidor e as rotas
const cors = require('cors') //Importa o CORS para permitir requisições de outros domínios
require('dotenv').config() //Carrega as variáveis de ambiente do arquivo .env
require('./config/env').assertSecureEnv() //Não sobe sem um JWT_SECRET forte

const authRoutes = require('./routes/authRoutes') //Importa as rotas de autenticação
const gameRoutes = require('./routes/gameRoutes') //Importa as rotas de jogos
const achievementRoutes = require('./routes/achievementRoutes') //Importa as rotas de conquistas
const progressRoutes = require('./routes/progressRoutes') //Importa as rotas de progresso

const app = express() //Cria uma instância do Express para configurar o servidor

app.use(cors()) //Habilita o CORS para permitir requisições de outros domínios
app.use(express.json()) //Habilita o parsing de JSON no corpo das requisições

// Registra as rotas na aplicação Express, associando cada conjunto de rotas a um caminho base
app.use('/auth', authRoutes) //Registra as rotas de autenticação com o caminho base /auth
app.use('/games', gameRoutes) //Registra as rotas de jogos com o caminho base /games
app.use('/games/:gameId/achievements', achievementRoutes) //Registra as rotas de conquistas com o caminho base /games/:gameId/achievements
app.use('/progress', progressRoutes) //Registra as rotas de progresso com o caminho base /progress

const PORT = process.env.PORT || 3000 //Define a porta do servidor, usando a variável de ambiente ou 3000 como padrão
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`) //Inicia o servidor e exibe uma mensagem no console indicando que está rodando
})

