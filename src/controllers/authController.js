// ARQUIVO: authController.js
// FUNÇÃO: Lógica de autenticação (register e login)
// MÉTODOS QUE TERÁ:
//   - register → valida dados, cria hash da senha, salva usuário, retorna token
//   - login    → valida email/senha, compara hash, retorna token JWT
// NOVIDADE: bcrypt (hash de senha) + jsonwebtoken (gerar token)

const bcrypt = require('bcryptjs') //Importa a biblioteca bcrypt para hash de senhas
const jwt = require('jsonwebtoken') //Importa a biblioteca jsonwebtoken para gerar tokens JWT
const UserModel = require('../models/userModel') //Importa o modelo de usuário para interagir com o banco de dados

const AuthController = {
    async register(req, res) { //Função para registrar um novo usuário
        const { email, password } = req.body //Desestrutura email e senha do corpo da requisição
        if (!email || !password) { //Valida se email e senha foram fornecidos
            return res.status(400).json({ message: 'Email e senha são obrigatórios' }) //Retorna erro 400 se faltar email ou senha
        }
        try {
            const existingUser = await UserModel.findByEmail(email) //Verifica se já existe um usuário com o email fornecido
            if (existingUser) { //Se já existir, retorna erro 400
                return res.status(400).json({ message: 'Email já registrado' })
            }
            const hash = await bcrypt.hash(password, 10) //Gera um hash da senha usando bcrypt com 10 rounds de salt
            const newUser = await UserModel.create(email, hash) //Cria um novo usuário no banco de dados com o email e o hash da senha
            const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' }) //Gera um token JWT contendo o id do usuário, usando a chave secreta do ambiente e definindo expiração de 1 hora
            res.status(201).json({ token }) //Retorna o token JWT para o cliente
        } catch (error) {
            if (error.code === '23505') { //Dois cadastros simultâneos com o mesmo email
                return res.status(400).json({ message: 'Email já registrado' })
            }
            console.error('Erro ao registrar usuário:', error.message) //Loga só a mensagem, sem dados do usuário
            res.status(500).json({ message: 'Erro interno do servidor' }) //Retorna erro 500 em caso de erro no servidor
        }
    },

    async login(req, res) { //Função para autenticar um usuário existente
        const { email, password } = req.body //Desestrutura email e senha do corpo da requisição
        if (!email || !password) { //Valida se email e senha foram fornecidos
            return res.status(400).json({ message: 'Email e senha são obrigatórios' }) //Retorna erro 400 se faltar email ou senha
        }
        try {
            const user = await UserModel.findByEmail(email) //Busca o usuário no banco de dados pelo email fornecido
            if (!user) { //Se o usuário não for encontrado, retorna erro 400
                return res.status(400).json({ message: 'Credenciais inválidas' })
            }
            const isMatch = await bcrypt.compare(password, user.password_hash) //Compara a senha fornecida com o hash armazenado usando bcrypt
            if (!isMatch) { //Se a senha não corresponder, retorna erro 400
                return res.status(400).json({ message: 'Credenciais inválidas' })
            }
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' }) //Gera um token JWT contendo o id do usuário, usando a chave secreta do ambiente e definindo expiração de 1 hora
            res.json({ token }) //Retorna o token JWT para o cliente
        } catch (error) {
            console.error('Erro ao autenticar usuário:', error.message) //Loga qualquer erro que ocorrer durante o processo de login
            res.status(500).json({ message: 'Erro interno do servidor' }) //Retorna erro 500 em caso de erro no servidor
        }
    },
}

module.exports = AuthController //Exporta o objeto AuthController para ser usado em outros arquivos, como as rotas, para lidar com as requisições de registro e login dos usuários