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

const router = express.Router() //Cria um roteador do Express para definir as rotas relacionadas aos jogos

// Define as rotas para os jogos, associando cada rota à função correspondente no GameController
router.get('/', GameController.getAll) //Rota para listar todos os jogos
router.get('/:id', GameController.getById) //Rota para obter o detalhe de um jogo específico por id
router.post('/', GameController.create) //Rota para criar um novo jogo (pode ser protegida futuramente)
router.put('/:id', GameController.update) //Rota para editar um jogo existente por id (pode ser protegida futuramente)
router.delete('/:id', GameController.delete) //Rota para deletar um jogo por id (pode ser protegida futuramente)

module.exports = router //Exporta o roteador para ser usado no arquivo principal do servidor (app.js) para registrar as rotas de jogos na aplicação Express 
