// ARQUIVO: authMiddleware.js
// FUNÇÃO: Verificar se o usuário está logado antes de acessar rotas protegidas
// COMO FUNCIONA:
//   1. Pega o token JWT do header da requisição
//   2. Verifica se é válido
//   3. Se válido: deixa passar e adiciona o userId na requisição
//   4. Se inválido: retorna erro 401 (não autorizado)
// NOVIDADE: Esse arquivo é o "segurança" na porta do restaurante


const jwt = require('jsonwebtoken') //Importa a biblioteca jsonwebtoken para verificar tokens JWT

function authMiddleware(req, res, next) { //Função middleware para autenticação
    const authHeader = req.headers.authorization //Pega o header Authorization da requisição
    if (!authHeader) { //Se não houver header Authorization, retorna erro 401
        return res.status(401).json({ message: 'Token de autenticação ausente' })
    }
    const token = authHeader.split(' ')[1] //Pega o token do header (espera formato "Bearer <token>")
    if (!token) { //Se não houver token, retorna erro 401
        return res.status(401).json({ message: 'Token de autenticação ausente' })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) //Verifica se o token é válido usando a chave secreta do ambiente
        req.user = decoded //Adiciona o usuário decodificado na requisição para uso posterior (ex: req.user.userId)
        next() //Chama o próximo middleware ou rota
    } catch (error) {
        console.error('Token de autenticação inválido:', error) //Loga o erro de token inválido no console
        res.status(401).json({ message: 'Token de autenticação inválido' }) //Retorna erro 401 se o token for inválido
    }
}

module.exports = authMiddleware //Exporta a função authMiddleware para ser usada em outros arquivos, como as rotas, para proteger rotas que exigem autenticação 