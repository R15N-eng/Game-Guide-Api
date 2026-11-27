// ARQUIVO: achievementRoutes.js
// FUNÇÃO: Definir as rotas de conquistas
// ROTAS:
//   GET    /games/:gameId/achievements      → listar conquistas do jogo
//   GET    /games/:gameId/achievements/:id  → detalhe da conquista
//   POST   /games/:gameId/achievements      → criar conquista (protegido)
//   PUT    /games/:gameId/achievements/:id  → editar (protegido)
//   DELETE /games/:gameId/achievements/:id  → deletar (protegido)

const express = require('express') //Importa o Express para criar as rotas
const AchievementController = require('../controllers/achievementController') //Importa o AchievementController para usar as funções de lógica das rotas de conquistas
const authMiddleware = require('../middleware/authMiddleware') //Confere o token (401 se faltar ou for inválido)
const adminMiddleware = require('../middleware/adminMiddleware') //Confere o papel (403 se não for administrador)
const adminOnly = [authMiddleware, adminMiddleware] //A ordem importa: primeiro quem é, depois o que pode

const { validateId, validateAchievement } = require('../middleware/validate')

const router = express.Router({ mergeParams: true }) //Cria um roteador do Express para definir as rotas relacionadas às conquistas, com mergeParams para acessar os parâmetros do jogo

// Define as rotas para as conquistas, associando cada rota à função correspondente no AchievementController
router.param('id', validateId) //400 se o id não for um inteiro positivo
// gameId vem do caminho montado no server.js, então é conferido aqui
router.use((req, res, next) => validateId(req, res, next, req.params.gameId))

router.get('/', AchievementController.getByGame) //Rota para listar as conquistas de um jogo específico
router.get('/:id', AchievementController.getById) //Rota para obter o detalhe de uma conquista específica por id
router.post('/', adminOnly, validateAchievement, AchievementController.create) //Rota para criar uma nova conquista (somente administradores)
router.put('/:id', adminOnly, validateAchievement, AchievementController.update) //Rota para editar uma conquista existente por id (somente administradores)
router.delete('/:id', adminOnly, AchievementController.delete) //Rota para deletar uma conquista por id (somente administradores)

module.exports = router //Exporta o roteador para ser usado no arquivo principal do servidor (app.js) para registrar as rotas de conquistas na aplicação Express    