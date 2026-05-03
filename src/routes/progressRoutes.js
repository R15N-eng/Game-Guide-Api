// ARQUIVO: progressRoutes.js
// FUNÇÃO: Definir as rotas de progresso (todas protegidas — precisa estar logado)
// ROTAS:
//   GET    /progress/:gameId              → meu progresso num jogo
//   POST   /progress/:achievementId       → marcar conquista como feita
//   DELETE /progress/:achievementId       → desmarcar conquista

const express = require('express') //Importa o Express para criar as rotas
const ProgressController = require('../controllers/progressController') //Importa o ProgressController para usar as funções de lógica das rotas de progresso
const authMiddleware = require('../middleware/authMiddleware') //Importa o middleware de autenticação para proteger as rotas

const router = express.Router() //Cria um roteador do Express para definir as rotas relacionadas ao progresso do usuário

// Define as rotas para o progresso, associando cada rota à função correspondente no ProgressController e protegendo com o middleware de autenticação
router.get('/:gameId', authMiddleware, ProgressController.getProgress) //Rota para obter o progresso do usuário logado em um jogo específico (protegida)
router.post('/:achievementId', authMiddleware, ProgressController.complete) //Rota para marcar uma conquista como feita para o usuário logado (protegida)
router.delete('/:achievementId', authMiddleware, ProgressController.uncomplete) //Rota para desmarcar uma conquista como feita para o usuário logado (protegida)

module.exports = router //Exporta o roteador para ser usado no arquivo principal do servidor (app.js) para registrar as rotas de progresso na aplicação Express 