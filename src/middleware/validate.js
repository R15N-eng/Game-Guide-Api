// ARQUIVO: validate.js
// FUNÇÃO: Conferir os dados de entrada antes de chegarem ao banco. Responde 400 quando algo está errado.

const MAX_ID = 2147483647 // maior valor de uma coluna INTEGER no PostgreSQL
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max
const isOptionalText = (value, max) => value === undefined || value === null || (typeof value === 'string' && value.length <= max)

function isHttpUrl(value) {
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol)
    } catch {
        return false
    }
}

// Cria um middleware a partir de uma função que devolve a mensagem de erro (ou nada)
const check = (findProblem) => (req, res, next) => {
    const problem = findProblem(req.body || {})
    if (problem) return res.status(400).json({ message: problem })
    next()
}

// Uso: router.param('id', validateId)
function validateId(req, res, next, value) {
    if (!/^[1-9]\d*$/.test(value) || Number(value) > MAX_ID) {
        return res.status(400).json({ message: 'Identificador inválido' })
    }
    next()
}

const validateRegister = check(({ email, password }) => {
    if (!email || !password) return 'Email e senha são obrigatórios'
    if (!isText(email, 255) || !EMAIL.test(email)) return 'Email inválido'
    if (typeof password !== 'string' || password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres'
    if (Buffer.byteLength(password) > 72) return 'A senha pode ter no máximo 72 bytes' // o bcrypt ignora o resto
})

// No login não há regra de tamanho mínimo, para não bloquear contas antigas
const validateLogin = check(({ email, password }) => {
    if (!email || !password) return 'Email e senha são obrigatórios'
    if (typeof email !== 'string' || email.length > 255) return 'Email inválido'
    if (typeof password !== 'string' || password.length > 1000) return 'Senha inválida'
})

const validateGame = check(({ title, description, platform, cover_url, release_year }) => {
    if (!isText(title, 255)) return 'title é obrigatório (texto de até 255 caracteres)'
    if (!isOptionalText(description, 5000)) return 'description deve ser um texto de até 5000 caracteres'
    if (!isOptionalText(platform, 100)) return 'platform deve ser um texto de até 100 caracteres'
    if (!isOptionalText(cover_url, 255) || (cover_url && !isHttpUrl(cover_url))) return 'cover_url deve ser um endereço http(s) de até 255 caracteres'
    if (release_year !== undefined && release_year !== null && !(Number.isInteger(release_year) && release_year >= 1950 && release_year <= 2100)) {
        return 'release_year deve ser um número inteiro entre 1950 e 2100'
    }
})

const validateAchievement = check(({ name, description, tips, is_missable, trophy_type }) => {
    if (!isText(name, 255)) return 'name é obrigatório (texto de até 255 caracteres)'
    if (!isText(trophy_type, 50)) return 'trophy_type é obrigatório (texto de até 50 caracteres)'
    if (!isOptionalText(description, 5000)) return 'description deve ser um texto de até 5000 caracteres'
    if (!isOptionalText(tips, 5000)) return 'tips deve ser um texto de até 5000 caracteres'
    if (is_missable !== undefined && typeof is_missable !== 'boolean') return 'is_missable deve ser true ou false'
})

module.exports = { validateId, validateRegister, validateLogin, validateGame, validateAchievement }
