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
| Dev           | nodemon                             |

---

## Estrutura do projeto

```
game-guide-api/
└── src/
    ├── config/
    │   ├── database.js          # Conexão com PostgreSQL (Pool)
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
    │   └── authMiddleware.js    # Verificação do token JWT
    └── server.js                # Porta de entrada
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
- Node.js 18+
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

- **401:** falta o token, ou ele é inválido, expirado ou assinado de outra forma.
- **403:** o token é válido, mas o usuário não é administrador.
- O cadastro é aberto e **nunca** cria administradores. Para promover um usuário, use o SQL abaixo no seu banco:

```sql
UPDATE users SET is_admin = TRUE WHERE email = 'seu-email@exemplo.com';
```

- Banco criado antes dessa mudança? Rode a migração:

```bash
psql -U postgres -d gameguide -f src/config/migrations/001_add_is_admin.sql
```

- **Aviso sobre o histórico:** versões antigas do `.env.example` tinham valores preenchidos para senha do banco e `JWT_SECRET`. Eles continuam no histórico do Git e devem ser considerados públicos. Não os use em nenhum ambiente.

### Ainda não resolvido

Limite de tentativas no login, validação dos dados de entrada, CORS restrito e proteção contra progresso duplicado. Não use esta API em produção sem tratar esses pontos.

---

## Testes

Os testes sobem o servidor contra um PostgreSQL **descartável** (as tabelas são apagadas). O nome do banco precisa terminar em `_test`.

```bash
createdb -U postgres gameguide_test
npm test
```

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
