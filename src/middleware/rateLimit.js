// ARQUIVO: rateLimit.js
// FUNÇÃO: Limitar tentativas nas rotas de autenticação, por endereço IP.
// O contador fica em memória: vale para uma única instância e zera quando o servidor reinicia.

const { rateLimit } = require('express-rate-limit')

const options = (windowMinutes, limit, extra = {}) => ({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' },
    ...extra,
})

// Só tentativas que falham contam: quem acerta a senha não é penalizado
const loginLimiter = rateLimit(options(15, 10, { skipSuccessfulRequests: true }))
const registerLimiter = rateLimit(options(60, 20))

module.exports = { loginLimiter, registerLimiter }
