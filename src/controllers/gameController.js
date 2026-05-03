// ARQUIVO: gameController.js
// FUNÇÃO: Lógica das rotas de jogos (igual ao taskController do Task App)
// MÉTODOS QUE TERÁ:
//   - getAll    → listar todos os jogos
//   - getById   → buscar jogo específico
//   - create    → cadastrar jogo (só admin futuramente)
//   - update    → editar jogo
//   - delete    → deletar jogo

const GameModel = require('../models/gameModel') //Importa o GameModel para usar as funções de acesso ao banco de dados relacionadas aos jogos

const GameController = {
    async getAll(req, res) { //Função para listar todos os jogos
        try {
            const games = await GameModel.getAll() //Chama a função do model para obter todos os jogos
            res.json(games) //Retorna a lista de jogos em formato JSON
        } catch (error) {
            console.error('Erro ao listar jogos:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao listar jogos' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

    async getById(req, res) { //Função para buscar um jogo específico por id
        const { id } = req.params //Desestrutura o id dos parâmetros da rota
        try {
            const game = await GameModel.getById(id) //Chama a função do model para obter o jogo pelo id
            if (!game) { //Se o jogo não for encontrado, retorna um erro 404
                return res.status(404).json({ error: 'Jogo não encontrado' })
            }
            res.json(game) //Retorna os dados do jogo em formato JSON
        } catch (error) {
            console.error('Erro ao buscar jogo:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao buscar jogo' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

    async create(req, res) { // Função para cadastrar um novo jogo (a implementação completa pode ser feita futuramente
        const { title, description, cover_url, platform, release_year } = req.body //Desestrutura os dados do jogo do corpo da requisição
        try {
            const newGame = await GameModel.create({ title, description, cover_url, platform, release_year }) //Chama a função do model para criar um novo jogo com os dados fornecidos
            res.status(201).json(newGame) //Retorna o jogo recém-criado com status 201
        } catch (error) {
            console.error('Erro ao criar jogo:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao criar jogo' }) //Retorna um erro 500 com uma mensagem de erro
        }
     }, 

    async update(req, res) { //Função para editar um jogo existente (a implementação completa pode ser feita futuramente
        const { id } = req.params //Desestrutura o id dos parâmetros da rota
        const { title, description, cover_url, platform, release_year } = req.body //Desestrutura os novos dados do jogo do corpo da requisição
        try {
            const updatedGame = await GameModel.update(id, { title, description, cover_url, platform, release_year }) //Chama a função do model para atualizar o jogo com o id e os novos dados fornecidos
            if (!updatedGame) { //Se o jogo não for encontrado para atualização, retorna um erro 404
                return res.status(404).json({ error: 'Jogo não encontrado' })
            }
            res.json(updatedGame) //Retorna os dados do jogo atualizado em formato JSON
        } catch (error) {
            console.error('Erro ao atualizar jogo:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao atualizar jogo' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

    async delete(req, res) { //Função para deletar um jogo por id (a implementação completa pode ser feita futuramente
        const { id } = req.params //Desestrutura o id dos parâmetros da rota
        try {
            const deletedGame = await GameModel.delete(id) //Chama a função do model para deletar o jogo com o id fornecido
            if (!deletedGame) { //Se o jogo não for encontrado para deleção, retorna um erro 404
                return res.status(404).json({ error: 'Jogo não encontrado' })
            }
            res.json({ message: 'Jogo deletado com sucesso' }) //Retorna uma mensagem de sucesso em formato JSON
        } catch (error) {
            console.error('Erro ao deletar jogo:', error.message) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao deletar jogo' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },
}

module.exports = GameController //Exporta o objeto GameController para ser usado em outros arquivos, como as rotas, para lidar com as requisições relacionadas aos jogos    