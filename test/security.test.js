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

// ---- entrada, progresso, CORS e limite de tentativas ----

// Sobe um segundo servidor, para testar configurações sem interferir no principal
async function withServer(extraEnv, run) {
    const port = PORT + 100 + crypto.randomInt(1, 500)
    const child = spawn(process.execPath, ['src/server.js'], { cwd: ROOT, env: { ...ENV, PORT: String(port), ...extraEnv } })
    try {
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('servidor não subiu')), 8000)
            child.stdout.on('data', (d) => { if (String(d).includes('Servidor rodando')) { clearTimeout(timer); resolve() } })
            child.on('exit', (code) => reject(new Error(`servidor encerrou com código ${code}`)))
        })
        await run(`http://127.0.0.1:${port}`)
    } finally {
        child.kill()
    }
}

test('dados de catálogo inválidos: 400 e nada muda', async () => {
    await pool.query('UPDATE users SET is_admin = TRUE WHERE id = $1', [adminId])
    const snapshot = await catalog()
    const cases = [
        ['POST', '/games', {}],
        ['POST', '/games', { title: '   ' }],
        ['POST', '/games', { title: 'x'.repeat(256) }],
        ['POST', '/games', { title: 'ok', release_year: '1999' }],
        ['POST', '/games', { title: 'ok', cover_url: 'javascript:alert(1)' }],
        ['PUT', '/games/1', { title: 123 }],
        ['POST', '/games/1/achievements', { name: 'sem tipo' }],
        ['PUT', '/games/1/achievements/1', { ...ACHIEVEMENT, is_missable: 'sim' }],
        ['PUT', '/games/abc', GAME],
        ['DELETE', '/games/99999999999'],
        ['DELETE', '/games/1/achievements/0'],
        ['POST', '/games/abc/achievements', ACHIEVEMENT],
    ]
    for (const [method, url, body] of cases) {
        const res = await call(method, url, { token: adminToken, body })
        assert.equal(res.status, 400, `${method} ${url} ${JSON.stringify(body)?.slice(0, 60)}`)
    }
    assert.equal(await catalog(), snapshot)
    assert.equal((await call('POST', '/games/9999/achievements', { token: adminToken, body: ACHIEVEMENT })).status, 404)
})

test('a autorização é conferida antes da validação dos dados', async () => {
    assert.equal((await call('POST', '/games', { body: {} })).status, 401)
    assert.equal((await call('POST', '/games', { token: userToken, body: {} })).status, 403)
    assert.equal((await call('POST', '/progress/abc')).status, 401)
})

test('cadastro e login recusam entradas inválidas', async () => {
    const bad = [
        {}, { email: 'sem-arroba', password: 'senha-longa-ok' }, { email: 'a@b.co', password: 'curta' },
        { email: 'a@b.co', password: 'x'.repeat(73) }, { email: ['a@b.co'], password: 'senha-longa-ok' },
        { email: 'a@b.co', password: 12345678901 },
    ]
    for (const body of bad) {
        assert.equal((await call('POST', '/auth/register', { body })).status, 400, JSON.stringify(body).slice(0, 60))
    }
    assert.equal((await call('POST', '/auth/login', { body: { email: 'a@b.co', password: { $ne: null } } })).status, 400)
})

test('JSON malformado: 400 em JSON, sem detalhes internos', async () => {
    const res = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"email":' })
    const text = await res.text()
    assert.equal(res.status, 400)
    assert.doesNotMatch(text, /SyntaxError|node_modules|at /)
    assert.equal(res.headers.get('x-powered-by'), null)
})

test('progresso: sem duplicatas, isolado por usuário e com 404 correto', async () => {
    await pool.query('DELETE FROM user_progress')
    const first = await call('POST', '/progress/1', { token: userToken })
    const again = await call('POST', '/progress/1', { token: userToken })
    assert.equal(first.status, 200)
    assert.equal(again.status, 200)
    assert.equal(again.body.id, first.body.id)
    await Promise.all(Array.from({ length: 8 }, () => call('POST', '/progress/1', { token: userToken })))
    assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM user_progress')).rows[0].n, 1)

    // outro usuário não vê nem apaga o progresso do primeiro
    const other = await call('GET', '/progress/1', { token: adminToken })
    assert.ok(other.body.progress.every((row) => row.completed_at === null))
    assert.equal((await call('DELETE', '/progress/1', { token: adminToken })).status, 404)
    assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM user_progress')).rows[0].n, 1)

    assert.equal((await call('DELETE', '/progress/1', { token: userToken })).status, 200)
    assert.equal((await call('DELETE', '/progress/1', { token: userToken })).status, 404)
    assert.equal((await call('POST', '/progress/9999', { token: userToken })).status, 404)
    assert.equal((await call('GET', '/progress/2', { token: userToken })).body.percentage, 0)
})

test('migrações 001 e 002 atualizam um banco antigo e podem repetir', async () => {
    const client = await pool.connect()
    try {
        await client.query('DROP SCHEMA IF EXISTS legado CASCADE; CREATE SCHEMA legado; SET search_path TO legado')
        await client.query(`CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT);
            CREATE TABLE user_progress (id SERIAL PRIMARY KEY, user_id INT, achievement_id INT);
            INSERT INTO user_progress (user_id, achievement_id) VALUES (1,1),(1,1),(1,1),(1,2),(2,1);`)
        for (let round = 0; round < 2; round++) {
            for (const file of ['001_add_is_admin.sql', '002_unique_user_progress.sql']) {
                await client.query(fs.readFileSync(path.join(ROOT, 'src/config/migrations', file), 'utf8'))
            }
        }
        const rows = await client.query('SELECT id FROM user_progress ORDER BY id')
        assert.deepEqual(rows.rows.map((r) => r.id), [1, 4, 5])
        await assert.rejects(client.query('INSERT INTO user_progress (user_id, achievement_id) VALUES (1,1)'), { code: '23505' })
    } finally {
        await client.query('SET search_path TO public; DROP SCHEMA IF EXISTS legado CASCADE')
        client.release()
    }
})

test('CORS: nenhuma origem por padrão; só as listadas quando configurado', async () => {
    const preflight = (base, origin) => fetch(`${base}/games`, {
        method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' },
    }).then((res) => res.headers.get('access-control-allow-origin'))

    await withServer({ CORS_ORIGINS: '' }, async (base) => {
        assert.equal(await preflight(base, 'https://qualquer.example'), null)
    })
    await withServer({ CORS_ORIGINS: 'https://app.example, https://admin.example' }, async (base) => {
        assert.equal(await preflight(base, 'https://app.example'), 'https://app.example')
        assert.equal(await preflight(base, 'https://qualquer.example'), null)
    })
})

test('login: 429 depois de 10 falhas; acertos não contam', async () => {
    await withServer({}, async (base) => {
        const email = 'limite@example.test'
        const password = 'senha-correta-de-teste'
        const post = (route, body) => fetch(base + route, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        }).then((res) => res.status)

        assert.equal(await post('/auth/register', { email, password }), 201)
        for (let i = 0; i < 15; i++) assert.equal(await post('/auth/login', { email, password }), 200)
        for (let i = 0; i < 10; i++) assert.equal(await post('/auth/login', { email, password: 'errada-de-teste' }), 400)
        assert.equal(await post('/auth/login', { email, password: 'errada-de-teste' }), 429)
        assert.equal(await post('/auth/login', { email, password }), 429)
    })
})

test('cadastro: 429 depois de 20 tentativas por hora', async () => {
    await withServer({}, async (base) => {
        const statuses = []
        for (let i = 0; i < 21; i++) {
            const res = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
            statuses.push(res.status)
        }
        assert.deepEqual(statuses.slice(0, 20), Array(20).fill(400))
        assert.equal(statuses[20], 429)
    })
})
