// ARQUIVO: achievementController.js
// FUNÇÃO: Lógica das rotas de conquistas
// MÉTODOS QUE TERÁ:
//   - getByGame  → listar conquistas de um jogo
//   - getById    → buscar conquista específica
//   - create     → cadastrar conquista
//   - update     → editar conquista
//   - delete     → deletar conquista

const AchievementModel = require('../models/achievementModel') //Importa o AchievementModel para usar as funções de acesso ao banco de dados relacionadas às conquistas

const AchievementController = {
    async getByGame(req, res) { //Função para listar as conquistas de um jogo específico
        const { gameId } = req.params //Desestrutura o gameId dos parâmetros da rota
        try {
            const achievements = await AchievementModel.getByGameId(gameId) //Chama a função do model para obter as conquistas pelo id do jogo
            res.json(achievements) //Retorna a lista de conquistas em formato JSON
        } catch (error) {
            console.error('Erro ao listar conquistas:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao listar conquistas' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

    async getById(req, res) { //Função para buscar uma conquista específica por id
        const { id } = req.params //Desestrutura o id dos parâmetros da rota
        try {
            const achievement = await AchievementModel.getById(id) //Chama a função do model para obter a conquista pelo id
            if (!achievement) { //Se a conquista não for encontrada, retorna um erro 404
                return res.status(404).json({ error: 'Conquista não encontrada' })
            }
            res.json(achievement) //Retorna os dados da conquista em formato JSON
        } catch (error) {
            console.error('Erro ao buscar conquista:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao buscar conquista' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

    async create(req, res) { //Função para cadastrar uma nova conquista (a implementação completa pode ser feita futuramente)
        const { game_id, name, description, tips, is_missable, trophy_type } = req.body //Desestrutura os dados da conquista do corpo da requisição
        try {
            const newAchievement = await AchievementModel.create({ game_id, name, description, tips, is_missable, trophy_type }) //Chama a função do model para criar uma nova conquista com os dados fornecidos
            res.status(201).json(newAchievement) //Retorna a conquista recém-criada com status 201
        } catch (error) {
            console.error('Erro ao criar conquista:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao criar conquista' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

    async update(req, res) { //Função para editar uma conquista existente (a implementação completa pode ser feita futuramente)
        const { id } = req.params //Desestrutura o id dos parâmetros da rota
        const { game_id, name, description, tips, is_missable, trophy_type } = req.body //Desestrutura os novos dados da conquista do corpo da requisição
        try {
            const updatedAchievement = await AchievementModel.update(id, { game_id, name, description, tips, is_missable, trophy_type }) //Chama a função do model para atualizar a conquista com o id e os novos dados fornecidos
            if (!updatedAchievement) { //Se a conquista não for encontrada para atualização, retorna um erro 404
                return res.status(404).json({ error: 'Conquista não encontrada' })
            }
            res.json(updatedAchievement) //Retorna os dados da conquista atualizada em formato JSON
        } catch (error) {
            console.error('Erro ao atualizar conquista:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao atualizar conquista' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

    async delete(req, res) { //Função para deletar uma conquista por id (a implementação completa pode ser feita futuramente)
        const { id } = req.params //Desestrutura o id dos parâmetros da rota
        try {
            const deletedAchievement = await AchievementModel.delete(id) //Chama a função do model para deletar a conquista pelo id
            if (!deletedAchievement) { //Se a conquista não for encontrada para deleção, retorna um erro 404
                return res.status(404).json({ error: 'Conquista não encontrada' })
            }
            res.json({ message: 'Conquista deletada com sucesso' }) //Retorna uma mensagem de sucesso em formato JSON
        }   
        catch (error) {
            console.error('Erro ao deletar conquista:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao deletar conquista' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

}

module.exports = AchievementController //Exporta o objeto AchievementController para ser usado em outros arquivos, como as rotas, para lidar com as requisições relacionadas às conquistas dos jogos