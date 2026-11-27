// Testes de autenticação e autorização das rotas de escrita.
// Sobem o servidor de verdade contra um banco PostgreSQL DESCARTÁVEL.
//
//   createdb gameguide_test
//   npm test
//
// Usa DB_HOST, DB_PORT, DB_USER e DB_PASSWORD do ambiente (ou do .env).
// O banco vem de TEST_DB_NAME (padrão gameguide_test). ATENÇÃO: as tabelas são apagadas.

require('dotenv').config()
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn, spawnSync } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

const ROOT = path.join(__dirname, '..')
const DB_NAME = process.env.TEST_DB_NAME || 'gameguide_test'
if (!DB_NAME.endsWith('_test')) {
    throw new Error('Por segurança, TEST_DB_NAME precisa terminar em "_test"')
}
const SECRET = crypto.randomBytes(48).toString('hex')
const PORT = 3000 + crypto.randomInt(1000, 5000)
const BASE = `http://127.0.0.1:${PORT}`
const ENV = { ...process.env, DB_NAME, JWT_SECRET: SECRET, PORT: String(PORT) }

const pool = new Pool({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: DB_NAME,
})
let server, userToken, adminToken, adminId

async function call(method, url, { token, header, body } = {}) {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    if (header) headers.Authorization = header
    const res = await fetch(BASE + url, { method, headers, body: body && JSON.stringify(body) })
    return { status: res.status, body: await res.json().catch(() => null) }
}

// Fotografia do catálogo, para provar que uma requisição recusada não alterou nada
async function catalog() {
    const games = await pool.query('SELECT * FROM games ORDER BY id')
    const achievements = await pool.query('SELECT * FROM achievements ORDER BY id')
    return JSON.stringify([games.rows, achievements.rows])
}

const GAME = { title: 'Alterado', platform: 'PC' }
const ACHIEVEMENT = { name: 'Alterada', trophy_type: 'gold' }
const WRITES = [
    ['POST', '/games', GAME],
    ['PUT', '/games/1', GAME],
    ['DELETE', '/games/1'],
    ['POST', '/games/1/achievements', ACHIEVEMENT],
    ['PUT', '/games/1/achievements/1', ACHIEVEMENT],
    ['DELETE', '/games/1/achievements/1'],
]

before(async () => {
    await pool.query('DROP TABLE IF EXISTS user_progress, achievements, games, users CASCADE')
    await pool.query(fs.readFileSync(path.join(ROOT, 'src/config/schema.sql'), 'utf8'))
    await pool.query("INSERT INTO games (title) VALUES ('Jogo 1'), ('Jogo 2')")
    await pool.query("INSERT INTO achievements (game_id, name, trophy_type) VALUES (1, 'Conquista 1', 'bronze')")

    server = spawn(process.execPath, ['src/server.js'], { cwd: ROOT, env: ENV })
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('servidor não subiu')), 8000)
        server.stdout.on('data', (d) => { if (String(d).includes('Servidor rodando')) { clearTimeout(timer); resolve() } })
        server.on('exit', (code) => reject(new Error(`servidor encerrou com código ${code}`)))
    })

    const password = crypto.randomBytes(12).toString('hex')
    userToken = (await call('POST', '/auth/register', { body: { email: 'user@example.test', password } })).body.token
    adminToken = (await call('POST', '/auth/register', { body: { email: 'admin@example.test', password } })).body.token
    adminId = jwt.decode(adminToken).userId
    await pool.query('UPDATE users SET is_admin = TRUE WHERE id = $1', [adminId])
})

after(async () => {
    server?.kill()
    await pool.end()
})

const rejected = {
    'sem token': () => ({}),
    'token malformado': () => ({ token: 'nao-e-um-jwt' }),
    'esquema diferente de Bearer': () => ({ header: `Basic ${adminToken}` }),
    'assinado com outro segredo': () => ({ token: jwt.sign({ userId: adminId }, crypto.randomBytes(48).toString('hex')) }),
    'expirado': () => ({ token: jwt.sign({ userId: adminId, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET) }),
    'sem assinatura (alg none)': () => ({ token: jwt.sign({ userId: adminId }, null, { algorithm: 'none' }) }),
    'algoritmo diferente (HS512)': () => ({ token: jwt.sign({ userId: adminId }, SECRET, { algorithm: 'HS512' }) }),
    'sem userId': () => ({ token: jwt.sign({ role: 'admin' }, SECRET) }),
}

for (const [label, auth] of Object.entries(rejected)) {
    test(`escrita ${label}: 401 nas 6 rotas e nada muda`, async () => {
        const snapshot = await catalog()
        for (const [method, url, body] of WRITES) {
            const res = await call(method, url, { ...auth(), body })
            assert.equal(res.status, 401, `${method} ${url}`)
        }
        assert.equal(await catalog(), snapshot)
    })
}

test('usuário comum autenticado: 403 nas 6 rotas e nada muda', async () => {
    const snapshot = await catalog()
    for (const [method, url, body] of WRITES) {
        const res = await call(method, url, { token: userToken, body })
        assert.equal(res.status, 403, `${method} ${url}`)
    }
    assert.equal(await catalog(), snapshot)
})

test('cadastro não permite escolher o papel de administrador', async () => {
    const res = await call('POST', '/auth/register', {
        body: { email: 'intruso@example.test', password: 'uma-senha-de-teste', is_admin: true },
    })
    assert.equal(res.status, 201)
    const row = await pool.query("SELECT is_admin FROM users WHERE email = 'intruso@example.test'")
    assert.equal(row.rows[0].is_admin, false)
})

test('leituras continuam públicas', async () => {
    for (const url of ['/games', '/games/1', '/games/1/achievements', '/games/1/achievements/1']) {
        assert.equal((await call('GET', url)).status, 200, url)
    }
})

test('progresso continua exigindo token', async () => {
    for (const [method, url] of [['GET', '/progress/1'], ['POST', '/progress/1'], ['DELETE', '/progress/1']]) {
        assert.equal((await call(method, url)).status, 401, `${method} ${url}`)
    }
    assert.equal((await call('GET', '/progress/1', { token: userToken })).status, 200)
})

test('conquista não pode ser lida nem alterada através de outro jogo', async () => {
    const snapshot = await catalog()
    assert.equal((await call('GET', '/games/2/achievements/1')).status, 404)
    assert.equal((await call('PUT', '/games/2/achievements/1', { token: adminToken, body: ACHIEVEMENT })).status, 404)
    assert.equal((await call('DELETE', '/games/2/achievements/1', { token: adminToken })).status, 404)
    assert.equal(await catalog(), snapshot)
})

test('o jogo da conquista vem da URL, não do corpo', async () => {
    const res = await call('POST', '/games/1/achievements', { token: adminToken, body: { ...ACHIEVEMENT, game_id: 2 } })
    assert.equal(res.status, 201)
    assert.equal(res.body.game_id, 1)
})

test('administrador cria, edita e apaga', async () => {
    const created = await call('POST', '/games', { token: adminToken, body: GAME })
    assert.equal(created.status, 201)
    const base = `/games/${created.body.id}`
    assert.equal((await call('PUT', base, { token: adminToken, body: GAME })).status, 200)
    const ach = await call('POST', `${base}/achievements`, { token: adminToken, body: ACHIEVEMENT })
    assert.equal(ach.status, 201)
    assert.equal((await call('PUT', `${base}/achievements/${ach.body.id}`, { token: adminToken, body: ACHIEVEMENT })).status, 200)
    assert.equal((await call('DELETE', `${base}/achievements/${ach.body.id}`, { token: adminToken })).status, 200)
    assert.equal((await call('DELETE', base, { token: adminToken })).status, 200)
})

test('perder o papel de administrador vale na hora, com o mesmo token', async () => {
    await pool.query('UPDATE users SET is_admin = FALSE WHERE id = $1', [adminId])
    assert.equal((await call('POST', '/games', { token: adminToken, body: GAME })).status, 403)
})

test('servidor se recusa a subir sem JWT_SECRET forte', () => {
    for (const weak of ['', 'curto-demais', 'x'.repeat(31)]) {
        const run = spawnSync(process.execPath, ['src/server.js'], {
            cwd: ROOT, env: { ...ENV, JWT_SECRET: weak, PORT: String(PORT + 1) }, encoding: 'utf8', timeout: 8000,
        })
        assert.notEqual(run.status, 0, `subiu com segredo de ${weak.length} caracteres`)
        assert.match(run.stderr, /JWT_SECRET/)
    }
})
