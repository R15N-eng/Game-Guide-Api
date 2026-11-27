// ARQUIVO: adminMiddleware.js
// FUNÇÃO: Autorização. Só administradores alteram o catálogo de jogos e conquistas.
// Use sempre DEPOIS do authMiddleware (que preenche req.user).
// O papel é lido do banco a cada requisição, então remover o acesso vale na hora.

const UserModel = require('../models/userModel')

async function adminMiddleware(req, res, next) {
    try {
        const isAdmin = await UserModel.isAdmin(req.user.userId)
        if (!isAdmin) {
            return res.status(403).json({ message: 'Acesso restrito a administradores' })
        }
        next()
    } catch (error) {
        console.error('Erro ao verificar permissão:', error.message)
        res.status(500).json({ message: 'Erro interno do servidor' })
    }
}

module.exports = adminMiddleware
