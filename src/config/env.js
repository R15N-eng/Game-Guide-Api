// ARQUIVO: env.js
// FUNÇÃO: Impedir que o servidor suba com uma configuração insegura

const MIN_SECRET_LENGTH = 32

function assertSecureEnv(env = process.env) {
    if (!env.JWT_SECRET || env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
        throw new Error(`JWT_SECRET ausente ou curto: use pelo menos ${MIN_SECRET_LENGTH} caracteres aleatórios (veja .env.example)`)
    }
}

module.exports = { assertSecureEnv }
