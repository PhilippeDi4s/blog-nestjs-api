# the-blog-API

## 1. Visão Geral

**Nome do projeto:** `the-blog-API`

API REST construída com NestJS que serve como backend para meu projeto "The blog". Expõe recursos de autenticação, gerenciamento de usuários, CRUD de posts e upload de imagens de capa. O frontend consumidor é uma aplicação React/Next.js, configurada na whitelist de CORS.

**Motivação:** Centralizar a lógica de negócio, persistência e autenticação do blog em um serviço dedicado, separado do frontend Next.js. Isso permite controle de acesso via JWT, publicação seletiva de posts e armazenamento de mídia no próprio servidor.

---

## 2. Tecnologias Utilizadas

### Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| [NestJS](https://nestjs.com/) (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`) | ^11.0.1 | Framework HTTP e injeção de dependências |
| [TypeScript](https://www.typescriptlang.org/) | ^5.7.3 | Linguagem principal |
| [Express](https://expressjs.com/) (via `@nestjs/platform-express`) | ^11.0.1 | Servidor HTTP subjacente |
| [Passport](https://www.passportjs.org/) + `@nestjs/passport` | ^0.7.0 / ^11.0.5 | Estratégia de autenticação |
| [passport-jwt](https://github.com/michaeljsmith/passport-jwt) | ^4.0.1 | Extração e validação de tokens JWT |
| [@nestjs/jwt](https://docs.nestjs.com/security/authentication) | ^11.0.2 | Emissão de tokens JWT |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | ^3.0.3 | Hash de senhas |
| [class-validator](https://github.com/typestack/class-validator) | ^0.15.1 | Validação de DTOs |
| [class-transformer](https://github.com/typestack/class-transformer) | ^0.5.1 | Transformação de objetos |
| [@nestjs/mapped-types](https://docs.nestjs.com/openapi/mapped-types) | ^2.1.1 | DTOs derivados (`PartialType`, `PickType`) |
| [@nestjs/config](https://docs.nestjs.com/techniques/configuration) | ^4.0.4 | Carregamento de variáveis de ambiente |
| [Helmet](https://helmetjs.github.io/) | ^8.3.0 | Headers de segurança HTTP |
| [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting) | ^6.5.0 | Rate limiting global (10 req / 10 s) |
| [@nestjs/serve-static](https://docs.nestjs.com/recipes/serve-static) | ^5.0.5 | Servir arquivos de upload em `/uploads` |
| [Multer](https://github.com/expressjs/multer) (via `@types/multer`) | ^2.2.0 | Upload multipart em memória |
| [file-type](https://github.com/sindresorhus/file-type) | ^22.0.1 | Validação de MIME type por magic bytes |
| [RxJS](https://rxjs.dev/) | ^7.8.1 | Programação reativa (dependência NestJS) |

### Banco de Dados

| Tecnologia | Versão | Uso |
|---|---|---|
| [PostgreSQL](https://www.postgresql.org/) | — | Banco relacional |
| [TypeORM](https://typeorm.io/) | ^1.1.0 | ORM e mapeamento de entidades |
| [@nestjs/typeorm](https://docs.nestjs.com/techniques/database) | ^11.0.3 | Integração TypeORM com NestJS |
| [pg](https://node-postgres.com/) | ^8.22.0 | Driver PostgreSQL |

### Frontend

Este repositório contém apenas a API. O frontend está disponível em https://blog.diasphilippe.dev.br/.
---

## 3. Estrutura de Diretórios

```
nest-test/
├── dev/                              # Arquivos auxiliares para testes manuais
│   └── images/                       # Imagens de exemplo usadas no rest-client
├── rest-client/
│   └── requests.http                 # Coleção de requisições HTTP para testes manuais
├── src/
│   ├── main.ts                       # Bootstrap: CORS, Helmet, ValidationPipe, porta
│   ├── app.module.ts                 # Módulo raiz: TypeORM, Throttler, filtros globais
│   ├── auth/                         # Autenticação JWT
│   │   ├── auth.controller.ts        # POST /auth/login
│   │   ├── auth.service.ts           # Validação de credenciais e emissão de token
│   │   ├── auth.module.ts            # Registro do JwtModule e JwtStrategy
│   │   ├── jwt.strategy.ts           # Validação do payload JWT e checagem de forceLogout
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts     # Guard de rotas protegidas
│   │   ├── dto/
│   │   │   └── login.dto.ts          # DTO de login (email, password)
│   │   └── types/
│   │       ├── jwt-payload.type.ts   # Formato do payload JWT (sub, email)
│   │       └── authenticated-request.ts  # Tipagem de req.user
│   ├── user/                         # Gerenciamento de usuários
│   │   ├── user.controller.ts        # CRUD do usuário autenticado + registro público
│   │   ├── user.service.ts           # Lógica de negócio e acesso ao repositório
│   │   ├── user.module.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts        # Entidade TypeORM (users)
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       ├── update-password.dto.ts
│   │       └── user-response.dto.ts  # Resposta sem expor passwordHash
│   ├── post/                         # Gerenciamento de posts do blog
│   │   ├── post.controller.ts        # Rotas públicas (publicados) e privadas (/me)
│   │   ├── post.service.ts           # CRUD com ownership e geração de slug
│   │   ├── post.module.ts
│   │   ├── entities/
│   │   │   └── post.entity.ts        # Entidade TypeORM com relação ManyToOne → User
│   │   └── dto/
│   │       ├── create-post.dto.ts
│   │       ├── update-post.dto.ts
│   │       └── post-response.dto.ts
│   ├── upload/                       # Upload e serviço estático de imagens
│   │   ├── upload.controller.ts      # POST /upload (multipart, autenticado)
│   │   ├── upload.service.ts         # Validação, persistência em disco e retorno da URL
│   │   ├── upload.config.ts          # Configuração Multer (memória, filtro, limite 900 KB)
│   │   └── upload.module.ts          # ServeStaticModule em /uploads
│   └── commoun/                      # Utilitários compartilhados (typo intencional no código)
│       ├── common.module.ts          # Provider de HashingService (bcrypt)
│       ├── filters/
│       │   └── all-exeptions.filter.ts  # Filtro global de exceções HTTP
│       ├── hashing/
│       │   ├── hashing.service.ts    # Classe abstrata de hash
│       │   └── bcrypt-hashing.service.ts
│       ├── pipes/
│       │   └── custom-parse-int-pipe.pipe.ts
│       └── utils/
│           ├── create-slug-from-text.ts  # Gera slug único a partir do título
│           ├── slugify.ts
│           ├── generate-random-suffix.ts
│           └── parseCorsWhitelist.ts     # Parse da whitelist CORS por espaços
├── env.example                       # Modelo de variáveis de ambiente
├── nest-cli.json                     # Configuração do CLI NestJS
├── tsconfig.json                     # Configuração TypeScript
├── tsconfig.build.json               # TS config para build de produção
├── eslint.config.mjs                 # Regras ESLint
├── .prettierrc                       # Regras Prettier
├── package.json
└── package-lock.json
```

---

## 4. Variáveis de Ambiente

Copie `env.example` para `.env` na raiz do projeto antes de iniciar a aplicação.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DB_HOST` | Sim | Host do PostgreSQL |
| `DB_PORT` | Sim | Porta do PostgreSQL (padrão: `5432`) |
| `DB_USERNAME` | Sim | Usuário do banco |
| `DB_PASSWORD` | Sim | Senha do banco |
| `DB_DATABASE` | Sim | Nome do banco de dados |
| `DB_SYNCHRONIZE` | Sim | `1` ativa sync automático do schema TypeORM; `0` desativa (recomendado em produção) |
| `DB_AUTO_LOAD_ENTITIES` | Sim | `1` carrega entidades automaticamente |
| `JWT_SECRET` | Sim | Chave secreta para assinar tokens JWT. A aplicação falha ao iniciar se ausente |
| `JWT_EXPIRATION` | Não | Expiração do token em segundos (padrão: `86400` — 24 h) |
| `APP_PORT` | Não | Porta HTTP da API (padrão: `3001`) |
| `NODE_ENV` | Não | Ambiente de execução (`development`, `production`, etc.) |
| `CORS_WHITELIST` | Não | Origens permitidas separadas por espaço (padrão implícito: lista vazia) |
| `DB_TYPE` | Não | Documentada em `env.example`, mas **não utilizada** — o TypeORM está fixo em `postgres` |

### Exemplo `.env`

```bash
# Banco de Dados - PostgreSQL
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=changeme
DB_DATABASE=changeme
DB_SYNCHRONIZE=0
DB_AUTO_LOAD_ENTITIES=1

# JWT
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRATION=86400

# Aplicação
APP_PORT=3001
NODE_ENV=development

# CORS (frontend Next.js)
CORS_WHITELIST="http://localhost:3000"
```

---

## 5. Arquitetura e Decisões Técnicas

### Padrão arquitetural

A aplicação segue a **arquitetura modular do NestJS**, organizada por domínio de negócio (`auth`, `user`, `post`, `upload`). Cada módulo encapsula controller, service, DTOs e entidades. A camada de persistência usa o padrão **Repository** via TypeORM.

```
┌─────────────┐     HTTP      ┌──────────────┐
│  Next.js    │ ────────────► │  NestJS API  │
│  (frontend) │ ◄──────────── │  (nest-test) │
└─────────────┘   JSON/JWT    └──────┬───────┘
                                     │
                              ┌──────▼───────┐
                              │  PostgreSQL  │
                              └──────────────┘
```

### Decisões de design

| Decisão | Motivo |
|---|---|
| **JWT Bearer Token** | Autenticação stateless, compatível com SPA/Next.js |
| **`forceLogout` no User** | Invalida tokens existentes após troca de e-mail ou senha, sem blacklist de tokens |
| **Posts públicos vs. `/me`** | Rotas sem autenticação retornam apenas posts com `published: true`; rotas `/me` exigem JWT e filtram por autor |
| **Slug gerado automaticamente** | Criado a partir do título + sufixo aleatório; usado na rota pública `GET /post/:slug` |
| **`UserResponseDto` / `PostResponseDto`** | Excluem campos sensíveis (`passwordHash`, `forceLogout`) das respostas |
| **HashingService abstrato** | Permite trocar algoritmo de hash sem alterar services de domínio |
| **Upload em memória + validação por magic bytes** | Multer armazena em buffer; `file-type` valida o MIME real (png, jpeg, webp, gif), não apenas o header enviado |
| **Arquivos em `uploads/YYYY-MM-DD/`** | Organização por data; servidos estaticamente em `/uploads` via `@nestjs/serve-static` |
| **`DB_SYNCHRONIZE` controlado por env** | Facilita desenvolvimento local; desativado por padrão no exemplo para evitar alterações acidentais em produção |
| **ThrottlerGuard global** | Limita a 10 requisições por 10 segundos por IP, com bloqueio de 5 segundos |
| **AllExceptionsFilter global** | Padroniza respostas de erro no formato `{ message, error, statusCode }` |
| **Helmet + CORS whitelist** | Headers de segurança e restrição de origens do frontend |

### Comunicação entre serviços

Este repositório contém um único serviço. O frontend Next.js consome a API via HTTP REST, enviando o token JWT no header `Authorization: Bearer <token>` para rotas protegidas.

---

## 6. Endpoints / Documentação da API

### URLs base

| Ambiente | URL base |
|---|---|
| Desenvolvimento | `http://localhost:3001` |
| Staging | [DESCRIÇÃO] |
| Produção | [DESCRIÇÃO] |

### Autenticação

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/auth/login` | Autentica usuário e retorna `accessToken` | Não |

### Usuários

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/user` | Registra novo usuário | Não |
| `GET` | `/user/me` | Retorna dados do usuário autenticado | JWT |
| `PATCH` | `/user/me` | Atualiza nome e/ou e-mail | JWT |
| `PATCH` | `/user/me/password` | Altera senha | JWT |
| `DELETE` | `/user/me` | Remove conta do usuário autenticado | JWT |

### Posts

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `GET` | `/post` | Lista posts publicados (`published: true`) | Não |
| `GET` | `/post/:slug` | Retorna post publicado pelo slug | Não |
| `POST` | `/post/me` | Cria post para o usuário autenticado | JWT |
| `GET` | `/post/me` | Lista todos os posts do usuário autenticado | JWT |
| `GET` | `/post/me/:id` | Retorna post do usuário autenticado por UUID | JWT |
| `PATCH` | `/post/me/:id` | Atualiza post do usuário autenticado | JWT |
| `DELETE` | `/post/me/:id` | Remove post do usuário autenticado | JWT |

### Upload

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/upload` | Envia imagem (campo `file`, max 900 KB) | JWT |
| `GET` | `/uploads/:date/:filename` | Serve arquivo estático de upload | Não |

---

### Exemplos de requisição e resposta

#### `POST /auth/login`

**Requisição:**

```json
{
  "email": "julia@email.com",
  "password": "123458"
}
```

**Resposta `200`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### `POST /user` — Registro

**Requisição:**

```json
{
  "name": "Júlia",
  "email": "julia@email.com",
  "passwordHash": "123458"
}
```

**Resposta `201`:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Júlia",
  "email": "julia@email.com",
  "createdAt": "2026-07-28T12:00:00.000Z",
  "updatedAt": "2026-07-28T12:00:00.000Z"
}
```

---

#### `POST /post/me` — Criar post

**Requisição** (header: `Authorization: Bearer <token>`):

```json
{
  "title": "Título do post",
  "excerpt": "Excerto Excerto Excerto Excerto",
  "content": "Conteúdo",
  "coverImageUrl": "http://localhost:3001/uploads/2026-07-28/1234567890-abc123.png"
}
```

**Resposta `201`:**

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Título do post",
  "slug": "titulo-do-post-x7k2m9",
  "content": "Conteúdo",
  "excerpt": "Excerto Excerto Excerto Excerto",
  "coverImageUrl": "http://localhost:3001/uploads/2026-07-28/1234567890-abc123.png",
  "published": false,
  "createdAt": "2026-07-28T12:00:00.000Z",
  "updatedAt": "2026-07-28T12:00:00.000Z",
  "author": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Júlia",
    "email": "julia@email.com"
  }
}
```

---

#### `GET /post/:slug` — Post público

**Resposta `200`:** mesmo formato de `PostResponseDto` acima, apenas para posts com `published: true`.

---

#### `POST /upload` — Upload de imagem

**Requisição** (header: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`):

```
file: <arquivo de imagem (.png, .jpeg, .webp, .gif)>
```

**Resposta `201`:**

```json
{
  "url": "/uploads/2026-07-28/1784916297891-lxrozz.jpg"
}
```

---

#### Formato padrão de erro

```json
{
  "message": ["Usuário ou senha inválidos"],
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

## Execução local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env

# Desenvolvimento com hot-reload
npm run start:dev

# Produção
npm run build
npm run start:prod
```

A API estará disponível em `http://localhost:3001` (ou na porta definida em `APP_PORT`).

Para testes manuais, utilize a coleção em `rest-client/requests.http`.
