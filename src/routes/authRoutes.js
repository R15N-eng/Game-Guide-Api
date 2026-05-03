// ARQUIVO: authRoutes.js
// FUNÇÃO: Definir as rotas de autenticação
// ROTAS:
//   POST /auth/register  → criar conta
//   POST /auth/login     → entrar na conta

const express = require('express') //Importa o Express para criar as rotas
const AuthController = require('../controllers/authController') //Importa o AuthController para usar as funções de lógica das rotas de autenticação

const router = express.Router() //Cria um roteador do Express para definir as rotas relacionadas à autenticação

// Define as rotas para autenticação, associando cada rota à função correspondente no AuthController
router.post('/register', AuthController.register) //Rota para criar uma nova conta de usuário
router.post('/login', AuthController.login) //Rota para entrar na conta de usuário existente

module.exports = router //Exporta o roteador para ser usado no arquivo principal do servidor (app.js) para registrar as rotas de autenticação na aplicação Express  