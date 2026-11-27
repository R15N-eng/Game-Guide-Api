// ARQUIVO: gameRoutes.js
// FUNÇÃO: Definir as rotas de jogos
// ROTAS:
//   GET    /games         → listar jogos (público)
//   GET    /games/:id     → detalhe do jogo (público)
//   POST   /games         → criar jogo (protegido)
//   PUT    /games/:id     → editar jogo (protegido)
//   DELETE /games/:id     → deletar jogo (protegido)

const express = require('express') //Importa o Express para criar as rotas
const GameController = require('../controllers/gameController') //Importa o GameController para usar as funções de lógica das rotas de jogos
const authMiddleware = require('../middleware/authMiddleware') //Confere o token (401 se faltar ou for inválido)
const adminMiddleware = require('../middleware/adminMiddleware') //Confere o papel (403 se não for administrador)
const adminOnly = [authMiddleware, adminMiddleware] //A ordem importa: primeiro quem é, depois o que pode

const { validateId, validateGame } = require('../middleware/validate')

const router = express.Router() //Cria um roteador do Express para definir as rotas relacionadas aos jogos
router.param('id', validateId) //400 se o id não for um inteiro positivo

// Define as rotas para os jogos, associando cada rota à função correspondente no GameController
router.get('/', GameController.getAll) //Rota para listar todos os jogos
router.get('/:id', GameController.getById) //Rota para obter o detalhe de um jogo específico por id
router.post('/', adminOnly, validateGame, GameController.create) //Rota para criar um novo jogo (somente administradores)
router.put('/:id', adminOnly, validateGame, GameController.update) //Rota para editar um jogo existente por id (somente administradores)
router.delete('/:id', adminOnly, GameController.delete) //Rota para deletar um jogo por id (somente administradores)

module.exports = router //Exporta o roteador para ser usado no arquivo principal do servidor (app.js) para registrar as rotas de jogos na aplicação Express 
