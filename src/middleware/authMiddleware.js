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
    const [scheme, token] = authHeader.split(' ') //Espera exatamente o formato "Bearer <token>"
    if (scheme !== 'Bearer' || !token) { //Se não houver token, retorna erro 401
        return res.status(401).json({ message: 'Token de autenticação ausente' })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }) //Verifica o token e aceita só o algoritmo usado no login
        if (!Number.isInteger(decoded.userId)) { //Um token válido deste app sempre carrega o id do usuário
            return res.status(401).json({ message: 'Token de autenticação inválido' })
        }
        req.user = decoded //Adiciona o usuário decodificado na requisição para uso posterior (ex: req.user.userId)
        next() //Chama o próximo middleware ou rota
    } catch (error) {
        console.error('Token de autenticação inválido:', error.message) //Loga só a mensagem, sem o token
        res.status(401).json({ message: 'Token de autenticação inválido' }) //Retorna erro 401 se o token for inválido
    }
}

module.exports = authMiddleware //Exporta a função authMiddleware para ser usada em outros arquivos, como as rotas, para proteger rotas que exigem autenticação 