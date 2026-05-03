// ARQUIVO: progressController.js
// FUNÇÃO: Lógica de progresso do usuário logado
// MÉTODOS QUE TERÁ:
//   - getProgress    → retorna conquistas feitas + % de platina
//   - complete       → marca conquista como feita
//   - uncomplete     → desmarca conquista

const ProgressModel = require('../models/progressModel') //Importa o ProgressModel para usar as funções de acesso ao banco de dados relacionadas ao progresso do usuário

const ProgressController = {
    async getProgress(req, res) { //Função para obter o progresso do usuário logado em um jogo específico
        const userId = req.user.userId //Obtém o id do usuário logado a partir do objeto req.user (definido pelo middleware de autenticação)
        const { gameId } = req.params //Desestrutura o gameId dos parâmetros da rota
        try {
            const progress = await ProgressModel.getByUserAndGame(userId, gameId) //Chama a função do model para obter o progresso do usuário para o jogo específico
            const percentage = await ProgressModel.getPercentage(userId, gameId) //Chama a função do model para calcular a porcentagem de conquistas completadas pelo usuário para o jogo específico
            res.json({ progress, percentage }) //Retorna o progresso e a porcentagem em formato JSON
        } catch (error) {
            console.error('Erro ao obter progresso:', error ) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao obter progresso' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

    async complete(req, res) { //Função para marcar uma conquista como feita para o usuário logado
        const userId = req.user.userId //Obtém o id do usuário logado a partir do objeto req.user (definido pelo middleware de autenticação)
        const { achievementId } = req.params //Desestrutura o achievementId dos parâmetros da rota
        try {
            const result = await ProgressModel.complete(userId, achievementId) //Chama a função do model para marcar a conquista como feita para o usuário
            res.json(result) //Retorna o resultado da operação em formato JSON (pode ser útil para confirmação)
        } catch (error) {
            console.error('Erro ao completar conquista:', error ) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao completar conquista' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },

    async uncomplete(req, res) { //Função para desmarcar uma conquista como feita para o usuário logado
        const userId = req.user.userId //Obtém o id do usuário logado a partir do objeto req.user (definido pelo middleware de autenticação)
        const { achievementId } = req.params //Desestrutura o achievementId dos parâmetros da rota
        try {
            const result = await ProgressModel.uncomplete(userId, achievementId) //Chama a função do model para desmarcar a conquista como feita para o usuário
            res.json(result) //Retorna o resultado da operação em formato JSON (pode ser útil para confirmação)
        } catch (error) {
            console.error('Erro ao descompletar conquista:', error ) //Loga o erro no console
            res.status(500).json({ error: 'Erro ao descompletar conquista' }) //Retorna um erro 500 com uma mensagem de erro
        }
    },
}

module.exports = ProgressController //Exporta o objeto ProgressController para ser usado em outros arquivos, como as rotas, para lidar com as requisições relacionadas ao progresso do usuário nos jogos    