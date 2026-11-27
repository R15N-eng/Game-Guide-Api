# Game Guide API 🎮

REST API para um app de guia de platina de jogos. Construída com Node.js, Express e PostgreSQL.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=flat)
![Node](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)

---

## Sobre o projeto

Esse é o backend do Game Guide App — um app para ajudar jogadores a rastrear seu progresso em conquistas e troféus, com foco em platinar jogos como a saga Resident Evil.

Esse projeto foi um salto em relação ao meu primeiro backend (Task App). A maior dificuldade foi entender cada decisão a fundo — aqui eu me recusei a copiar código sem comentar e entender o que cada linha fazia. Tudo que aprendi foi anotado no Notion em tempo real.

As duas maiores novidades em relação ao Task App foram a **autenticação JWT** (login real com token) e as **relações entre tabelas** no banco de dados, que exigem pensar em dependências e integridade dos dados.

---

## Funcionalidades

- Cadastro e login de usuários com senha criptografada (bcryptjs)
- Autenticação via JWT — rotas protegidas por token
- CRUD completo de jogos
- CRUD completo de conquistas por jogo
- Rastreamento de progresso por usuário (marcar/desmarcar conquistas)
- Cálculo automático de % de platina por jogo

---

## Tecnologias

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Servidor      | Node.js, Express                    |
| Banco         | PostgreSQL                          |
| Autenticação  | JWT (jsonwebtoken) + bcryptjs       |
| Ambiente      | dotenv                              |
| Dev           | `node --watch`                      |

---

## Estrutura do projeto

```
game-guide-api/
└── src/
    ├── config/
    │   ├── database.js          # Conexão com PostgreSQL (Pool)
    │   ├── env.js               # Recusa configuração insegura
    │   ├── migrations/          # Ajustes para bancos já criados
    │   └── schema.sql           # Criação das tabelas
    ├── models/                  # Queries SQL isoladas
    │   ├── userModel.js
    │   ├── gameModel.js
    │   ├── achievementModel.js
    │   └── progressModel.js
    ├── controllers/             # Lógica de cada rota
    │   ├── authController.js
    │   ├── gameController.js
    │   ├── achievementController.js
    │   └── progressController.js
    ├── routes/                  # Definição das URLs
    │   ├── authRoutes.js
    │   ├── gameRoutes.js
    │   ├── achievementRoutes.js
    │   └── progressRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js    # Verificação do token JWT
    │   ├── adminMiddleware.js   # Somente administradores
    │   ├── rateLimit.js         # Limite de tentativas no login e no cadastro
    │   └── validate.js          # Validação dos dados de entrada
    └── server.js                # Porta de entrada
test/
└── security.test.js             # Testes de acesso, entrada e limites
```

---

## Banco de dados

```sql
users          → quem usa o app
games          → jogos cadastrados
achievements   → conquistas de cada jogo (com flag de missável)
user_progress  → progresso individual de cada usuário por conquista
```

As tabelas usam **foreign keys com ON DELETE CASCADE** — dados relacionados são removidos automaticamente quando o registro pai é deletado.

---

## Rotas da API

### Auth (público)
| Método | Rota               | Descrição        |
|--------|--------------------|------------------|
| POST   | /auth/register     | Criar conta      |
| POST   | /auth/login        | Login + token    |

### Games (leitura pública, escrita somente para administradores)
| Método | Rota           | Descrição         |
|--------|----------------|-------------------|
| GET    | /games         | Listar jogos      |
| GET    | /games/:id     | Detalhe do jogo   |
| POST   | /games         | 🔒 Criar jogo (admin) |
| PUT    | /games/:id     | 🔒 Editar jogo (admin) |
| DELETE | /games/:id     | 🔒 Deletar jogo (admin) |

### Achievements (leitura pública, escrita somente para administradores)
| Método | Rota                              | Descrição              |
|--------|-----------------------------------|------------------------|
| GET    | /games/:gameId/achievements       | Listar conquistas      |
| GET    | /games/:gameId/achievements/:id   | Detalhe da conquista   |
| POST   | /games/:gameId/achievements       | 🔒 Criar conquista (admin) |
| PUT    | /games/:gameId/achievements/:id   | 🔒 Editar conquista (admin) |
| DELETE | /games/:gameId/achievements/:id   | 🔒 Deletar conquista (admin) |

### Progress (🔒 protegido — requer token JWT)
| Método | Rota                        | Descrição                    |
|--------|-----------------------------|------------------------------|
| GET    | /progress/:gameId           | Meu progresso num jogo       |
| POST   | /progress/:achievementId    | Marcar conquista como feita  |
| DELETE | /progress/:achievementId    | Desmarcar conquista          |

---

## Como rodar localmente

### Pré-requisitos
- Node.js 18.11+
- PostgreSQL instalado e rodando

### 1. Clone o repositório
```bash
git clone https://github.com/R15N-eng/Game-Guide-Api.git
cd Game-Guide-Api
```

### 2. Configure o banco
```bash
psql -U postgres
CREATE DATABASE gameguide;
\c gameguide
# Cole o conteúdo de src/config/schema.sql
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env: DB_PASSWORD e JWT_SECRET (obrigatório, 32+ caracteres)
# Para gerar um segredo:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Instale e rode
```bash
npm install
npm run dev
# API rodando em http://localhost:3001
```

---

## Segurança

### Códigos de resposta

| Situação | Código |
|----------|--------|
| Sem token, ou token inválido, expirado ou assinado de outra forma | 401 |
| Token válido, mas o usuário não é administrador (rotas de escrita do catálogo) | 403 |
| Dados ou identificadores inválidos | 400 |
| Registro inexistente | 404 |
| Muitas tentativas | 429 |
| Administrador com dados válidos | 200 ou 201 |

### O que está protegido

- **Administração:** o papel é lido do banco a cada requisição. O cadastro é aberto e **nunca** cria administradores.
- **Progresso:** o usuário vem sempre do token. Ninguém lê ou altera o progresso de outra pessoa, e a mesma conquista não é contada duas vezes.
- **Tentativas:** 10 logins errados a cada 15 minutos e 20 cadastros por hora, por IP.
- **Entrada:** tipos e tamanhos são conferidos antes do banco. As consultas SQL usam parâmetros.
- **CORS:** nenhum site externo pode chamar a API pelo navegador, a não ser os listados em `CORS_ORIGINS`.
- **Segredos:** o servidor não sobe sem um `JWT_SECRET` com 32 caracteres ou mais.

Para promover um usuário a administrador, rode no seu banco:

```sql
UPDATE users SET is_admin = TRUE WHERE email = 'seu-email@exemplo.com';
```

### Banco criado antes dessas mudanças

Rode as migrações, nesta ordem. A segunda **apaga linhas repetidas** de progresso, mantendo a mais antiga:

```bash
psql -U postgres -d gameguide -f src/config/migrations/001_add_is_admin.sql
psql -U postgres -d gameguide -f src/config/migrations/002_unique_user_progress.sql
```

### Aviso sobre o histórico

Versões antigas do `.env.example` tinham valores preenchidos para a senha do banco e o `JWT_SECRET`. Eles continuam no histórico do Git e **devem ser considerados públicos**. Não use esses valores em nenhum ambiente. Se algum ambiente seu já os usou, troque-os antes de rodar a API de novo.

### Limitações conhecidas

Este é um projeto de estudo e não há uma versão publicada. Antes de usar em produção:

- o contador de tentativas fica em memória (vale para uma instância e zera ao reiniciar);
- o cadastro informa quando um email já existe, o que permite descobrir contas;
- não há confirmação de email, troca de senha nem revogação de token antes do vencimento (1 hora);
- as listagens não têm paginação;
- HTTPS fica a cargo da hospedagem.

---

## Testes

Os testes sobem o servidor contra um PostgreSQL **descartável** (as tabelas são apagadas). O nome do banco precisa terminar em `_test`.

```bash
createdb -U postgres gameguide_test
npm test
```

Os mesmos testes rodam no GitHub Actions em cada pull request e a cada push na `main`.

---

## Testando a API

Importe as rotas no **Postman** ou **Insomnia**. Para rotas protegidas, primeiro faça login e adicione o token no header:

```
Authorization: Bearer seu_token_aqui
```

---

## Próximos passos

- [ ] Frontend em Flutter consumindo essa API
- [ ] Deploy no Render
- [ ] Popular banco com dados reais da saga Resident Evil
- [ ] Adicionar campo "ordem" nas conquistas para guia passo a passo

---

## Autor

**Raimundo Nonato** — [LinkedIn](https://linkedin.com/in/raimundononato-eng) · [GitHub](https://github.com/R15N-eng)
