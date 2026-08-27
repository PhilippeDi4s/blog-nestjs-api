# nest-test

## 1. Visão Geral

**Nome do projeto:** `nest-test` (conforme `package.json`)

**Descrição:** API REST construída com NestJS para um sistema de blog. Expõe endpoints de autenticação, gestão de usuários, publicação de posts, upload de imagens e operações administrativas. Utiliza PostgreSQL como persistência e Cloudinary como armazenamento de mídia.

**Motivação:** Centralizar a lógica de backend de um blog — cadastro de autores, criação e publicação de conteúdo, upload seguro de imagens e moderação administrativa — em uma API tipada, validada e auditável por logs de atividade.

**Status do projeto:** Em desenvolvimento (`version: 0.0.1`, sem suíte de testes implementada).

---

## 2. Tecnologias Utilizadas

### Backend

| Tecnologia | Versão |
|---|---|
| Node.js / TypeScript | TypeScript `^5.7.3` |
| NestJS (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) | `^11.0.1` |
| `@nestjs/config` | `^4.0.4` |
| `@nestjs/jwt` | `^11.0.2` |
| `@nestjs/passport` | `^11.0.5` |
| `@nestjs/typeorm` | `^11.0.3` |
| `@nestjs/throttler` | `^6.5.0` |
| `@nestjs/serve-static` | `^5.0.5` |
| `@nestjs/mapped-types` | `^2.1.1` |
| Passport + `passport-jwt` | `^0.7.0` / `^4.0.1` |
| TypeORM | `^1.1.0` |
| class-validator / class-transformer | `^0.15.1` / `^0.5.1` |
| bcryptjs | `^3.0.3` |
| cookie-parser | `^1.4.7` |
| helmet | `^8.3.0` |
| sharp | `^0.35.3` |
| file-type | `^22.0.1` |
| rxjs | `^7.8.1` |
| reflect-metadata | `^0.2.2` |

### Banco de Dados

| Tecnologia | Versão |
|---|---|
| PostgreSQL (driver `pg`) | `^8.22.0` |

### Armazenamento de Mídia

| Tecnologia | Versão |
|---|---|
| Cloudinary | `^2.10.0` |

### DevOps / Ferramentas

| Tecnologia | Versão |
|---|---|
| Nest CLI (`@nestjs/cli`) | `^11.0.0` |
| ESLint | `^9.18.0` |
| Prettier | `^3.4.2` |
| ts-node / ts-loader | `^10.9.2` / `^9.5.2` |

### Testes

| Tecnologia | Versão |
|---|---|
| Jest | `^30.0.0` |
| ts-jest | `^29.2.5` |
| Supertest | `^7.0.0` |
| `@nestjs/testing` | `^11.0.1` |

> **Nota:** A configuração de testes existe em `package.json`, porém não há arquivos `*.spec.ts` ou diretório `test/` no repositório.

### Frontend

Não aplicável — este repositório contém apenas a API backend.

---

## 3. Estrutura de Diretórios

```text
blog-nestjs-api/
├── dev/                              # Arquivos estáticos para testes locais de upload
│   └── images/                       # Imagens de exemplo (png, jpeg, webp, gif)
├── rest-client/
│   └── requests.http                 # Coleção de requisições HTTP para testes manuais
├── src/
│   ├── main.ts                       # Bootstrap da aplicação (CORS, Helmet, pipes globais)
│   ├── app.module.ts                 # Módulo raiz (TypeORM, Throttler, filtros globais)
│   ├── auth/                         # Autenticação JWT, login/logout e guards
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   ├── guards/                   # JwtAuthGuard, RolesGuard, JwtStrategy
│   │   ├── decorators/               # @Roles()
│   │   └── types/                    # JwtPayload, AuthenticatedRequest
│   ├── user/                         # CRUD de usuários e rotas administrativas
│   │   ├── user.controller.ts        # Rotas públicas/autenticadas (/user)
│   │   ├── admin-user.controller.ts  # Rotas admin (/admin/users)
│   │   ├── user.service.ts
│   │   ├── user.module.ts
│   │   ├── entities/user.entity.ts
│   │   ├── dto/
│   │   └── enum/user-role.enum.ts    # user | admin
│   ├── post/                         # Posts do blog (públicos e do autor)
│   │   ├── post.controller.ts        # Rotas /post
│   │   ├── admin-post.controller.ts  # Rotas /admin/posts
│   │   ├── post.service.ts
│   │   ├── post.module.ts
│   │   ├── entities/post.entity.ts
│   │   └── dto/
│   ├── images/                       # Consulta e remoção de imagens
│   │   ├── images.controller.ts      # Rotas /images
│   │   ├── admin-image.controller.ts # Rotas /admin/image
│   │   ├── images.service.ts
│   │   ├── images.module.ts
│   │   ├── entities/image.entity.ts
│   │   └── dto/
│   ├── upload/                       # Upload multipart com validação e conversão WebP
│   │   ├── upload.controller.ts
│   │   ├── upload.service.ts
│   │   ├── upload.config.ts          # Configuração Multer (memória, limites)
│   │   └── upload.module.ts
│   ├── storage/                      # Abstração de armazenamento de imagens
│   │   ├── storage.module.ts
│   │   ├── image-storage.interface.ts
│   │   └── cloudinary/               # Implementação Cloudinary
│   ├── activity-logs/                # Auditoria de ações (serviço interno, sem rotas HTTP)
│   │   ├── activity-logs.service.ts
│   │   ├── activity-logs.controller.ts
│   │   ├── activity-logs.module.ts
│   │   ├── entities/activity.entity.ts
│   │   ├── dto/
│   │   └── enums/                    # ActionType, EntityType
│   └── commoun/                      # Utilitários compartilhados (hashing, filtros, pipes)
│       ├── common.module.ts
│       ├── hashing/                  # BcryptHashingService
│       ├── filters/all-exeptions.filter.ts
│       ├── pipes/
│       └── utils/                    # slugify, parseCorsWhitelist, etc.
├── env.example                       # Modelo de variáveis de ambiente
├── nest-cli.json                     # Configuração do Nest CLI
├── tsconfig.json                     # Configuração TypeScript
├── tsconfig.build.json               # Configuração TypeScript para build
├── eslint.config.mjs                 # Regras ESLint
├── .prettierrc                       # Formatação de código
└── package.json                      # Dependências e scripts npm
```

---

## 4. Variáveis de Ambiente

Copie `env.example` para `.env` na raiz do projeto.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DB_HOST` | Sim | Host do PostgreSQL |
| `DB_PORT` | Sim | Porta do PostgreSQL (padrão: `5432`) |
| `DB_USERNAME` | Sim | Usuário do banco |
| `DB_PASSWORD` | Sim | Senha do banco |
| `DB_DATABASE` | Sim | Nome do banco (ex.: `the_blog`) |
| `DB_SYNCHRONIZE` | Sim | `1` ativa sync do TypeORM; `0` desativa (recomendado em produção) |
| `DB_AUTO_LOAD_ENTITIES` | Sim | `1` carrega entidades automaticamente |
| `JWT_SECRET` | Sim | Chave secreta para assinatura dos tokens JWT |
| `JWT_EXPIRATION` | Sim | Expiração do JWT em segundos (ex.: `86400`) |
| `JWT_EXPIRES_IN_MS` | Sim | Expiração do cookie de login em milissegundos (ex.: `86400000`) |
| `COOKIE_NAME` | Sim | Nome do cookie HTTP-only definido no login |
| `CLOUDINARY_CLOUD_NAME` | Sim | Cloud name da conta Cloudinary |
| `CLOUDINARY_API_KEY` | Sim | API key do Cloudinary |
| `CLOUDINARY_API_SECRET` | Sim | API secret do Cloudinary |
| `APP_PORT` | Não | Porta da aplicação (padrão: `3001`) |
| `CORS_WHITELIST` | Não | Origens permitidas no CORS, separadas por espaço |
| `IMAGE_MAX_UPLOAD_SIZE` | Não | Tamanho máximo de upload em bytes (padrão: `921600`) |
| `ALLOWED_IMAGE_TYPES` | Sim* | MIME types permitidos, separados por vírgula |
| `MAX_INPUT_PIXELS` | Não | Limite de pixels na decodificação Sharp (padrão: `25000000`) |
| `DB_TYPE` | Não | Presente em `env.example`, mas **não utilizada** no código (PostgreSQL é fixo) |

> \* Se `ALLOWED_IMAGE_TYPES` estiver vazia, o upload retorna erro interno.

> **Atenção:** O arquivo `env.example` define `LOGIN_COOKIE_NAME`, porém o código utiliza `COOKIE_NAME`. Use `COOKIE_NAME` no `.env`.

### Exemplo de `.env.example`

```env
# ==========================
# Banco de Dados - PostgreSQL
# ==========================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=changeme
DB_DATABASE=the_blog
DB_SYNCHRONIZE=0
DB_AUTO_LOAD_ENTITIES=1

# ==========================
# Upload de Imagens
# ==========================
IMAGE_MAX_UPLOAD_SIZE=921600
ALLOWED_IMAGE_TYPES=image/png,image/jpeg,image/webp,image/gif
MAX_INPUT_PIXELS=25000000

# ==========================
# Cloudinary
# ==========================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ==========================
# JWT / Autenticação
# ==========================
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=86400
JWT_EXPIRES_IN_MS=86400000
COOKIE_NAME=loginSesion

# ==========================
# Aplicação
# ==========================
APP_PORT=3001
CORS_WHITELIST=http://localhost:3000 https://your-domain.com
```

---

## 5. Arquitetura e Decisões Técnicas

### Padrão arquitetural

A aplicação segue a **arquitetura modular do NestJS**, organizada por domínio de negócio (`auth`, `user`, `post`, `images`, `upload`, `activity-logs`). Cada módulo expõe controllers, encapsula regras em services e persiste dados via repositórios TypeORM — equivalente a uma **arquitetura em camadas** (Controller → Service → Repository).

### Decisões principais

| Decisão | Motivo |
|---|---|
| **Módulos por feature** | Isola responsabilidades (usuários, posts, imagens) e facilita manutenção |
| **TypeORM + PostgreSQL** | ORM integrado ao NestJS; suporte a soft delete, enums e relações |
| **JWT via Bearer token** | Autenticação stateless; validação em `JwtStrategy` com verificação de bloqueio e `forceLogout` |
| **Cookie HTTP-only no login** | Token também gravado em cookie seguro além do header `Authorization` |
| **Guards de roles (`USER` / `ADMIN`)** | Separa rotas públicas, autenticadas e administrativas |
| **Provider de storage (`IMAGE_STORAGE_PROVIDER`)** | Abstrai Cloudinary; permite trocar implementação sem alterar `UploadService` |
| **Processamento com Sharp** | Converte uploads para WebP, redimensiona (máx. 1920×1080) e valida dimensões |
| **Activity logs internos** | Registra login, logout, CRUD e ações admin sem expor endpoint público |
| **Soft delete** | Entidades `User`, `Post` e `Images` usam `@DeleteDateColumn` |
| **Throttler global** | Limite de 10 requisições a cada 10 segundos por IP |
| **ValidationPipe global** | `whitelist`, `forbidNonWhitelisted` e `transform` em todos os endpoints |
| **AllExceptionsFilter global** | Resposta de erro padronizada `{ message, error, statusCode }` |

### Comunicação entre serviços

Monolito de serviço único. Não há microserviços nem filas. Módulos se comunicam via injeção de dependência do NestJS (ex.: `AuthService` → `UserService`, `UploadService` → `ImagesService` + `ActivityLogsService`).

---

## 6. Endpoints / Documentação da API

### URLs base por ambiente

| Ambiente | URL base |
|---|---|
| Desenvolvimento | `http://localhost:3001` |
| Staging | [DESCRIÇÃO] |
| Produção | [DESCRIÇÃO] |

### Autenticação

- Endpoints protegidos exigem header `Authorization: Bearer <token>`.
- O login (`POST /auth/login`) também define um cookie HTTP-only com o JWT.
- A validação JWT ocorre exclusivamente via header Bearer (`ExtractJwt.fromAuthHeaderAsBearerToken()`).
- Rate limiting global: 10 req/10s.

### Tabela de endpoints

#### Autenticação (`/auth`)

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/auth/login` | Autentica usuário e define cookie de sessão | Não |
| `POST` | `/auth/logout` | Encerra sessão do usuário autenticado | JWT |
| `POST` | `/auth/admin/logout/:id` | Admin força logout de outro usuário | JWT (Admin) |

#### Usuários (`/user`)

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/user` | Cria novo usuário | Não |
| `GET` | `/user/me` | Retorna dados do usuário autenticado | JWT |
| `PATCH` | `/user/me` | Atualiza nome/e-mail do usuário autenticado | JWT |
| `PATCH` | `/user/me/password` | Altera senha (requer senha atual) | JWT |
| `DELETE` | `/user/me` | Remove (soft delete) o próprio usuário | JWT |

#### Admin — Usuários (`/admin/users`)

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `GET` | `/admin/users` | Lista usuários com filtros e paginação | JWT (Admin) |
| `PATCH` | `/admin/users/:id` | Atualiza dados de um usuário | JWT (Admin) |
| `PATCH` | `/admin/users/:id/promote` | Promove usuário a admin (confirma senha admin) | JWT (Admin) |
| `PATCH` | `/admin/users/:id/demote` | Rebaixa admin a usuário (confirma senha admin) | JWT (Admin) |
| `PATCH` | `/admin/users/:id/block` | Bloqueia usuário (confirma senha admin) | JWT (Admin) |
| `PATCH` | `/admin/users/:id/unblock` | Desbloqueia usuário (confirma senha admin) | JWT (Admin) |
| `PATCH` | `/admin/users/:id/restore` | Restaura usuário removido | JWT (Admin) |
| `DELETE` | `/admin/users/:id` | Remove usuário (soft delete, requer `reason`) | JWT (Admin) |

**Query params de `/admin/users`:** `id`, `name`, `email`, `forceLogout`, `startDate`, `endDate`, `page` (padrão 1), `limit` (padrão 20, máx. 100).

#### Posts (`/post`)

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/post/me` | Cria post do autor autenticado | JWT |
| `GET` | `/post/me` | Lista posts do autor autenticado | JWT |
| `GET` | `/post/me/:id` | Retorna post do autor por UUID | JWT |
| `PATCH` | `/post/me/:id` | Atualiza post do autor | JWT |
| `DELETE` | `/post/me/:id` | Remove post do autor (soft delete) | JWT |
| `GET` | `/post` | Lista posts publicados | Não |
| `GET` | `/post/:slug` | Retorna post publicado por slug | Não |

#### Admin — Posts (`/admin/posts`)

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `GET` | `/admin/posts` | Lista todos os posts | JWT (Admin) |
| `PATCH` | `/admin/posts/:id/restore` | Restaura post removido | JWT (Admin) |
| `DELETE` | `/admin/posts/:id` | Remove post (soft delete, requer `reason`) | JWT (Admin) |

#### Upload (`/upload`)

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/upload` | Upload de imagem (`multipart/form-data`, campo `file`) | JWT |

#### Imagens (`/images`)

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `GET` | `/images/:id` | Retorna imagem por UUID | JWT |
| `GET` | `/images/me` | Lista imagens do usuário autenticado | JWT |
| `DELETE` | `/images/:id` | Remove imagem do usuário (soft delete) | JWT |

#### Admin — Imagens (`/admin/image`)

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `GET` | `/admin/image` | Lista todas as imagens | JWT (Admin) |
| `PATCH` | `/admin/image/:id/restore` | Restaura imagem removida | JWT (Admin) |
| `DELETE` | `/admin/image/:id` | Remove imagem (soft delete, requer `reason`) | JWT (Admin) |

#### Activity Logs

O módulo `activity-logs` registra eventos internamente, mas **não expõe rotas HTTP** (`ActivityLogsController` está vazio).

---

### Exemplos de requisição e resposta

#### `POST /auth/login`

**Requisição:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "123456"
}
```

**Resposta (`200`):**

```json
{
  "message": "Login realizado com sucesso"
}
```

> O token JWT é retornado no cookie HTTP-only (`COOKIE_NAME`) e deve ser enviado nas requisições protegidas via header `Authorization: Bearer <token>`.

#### `POST /user`

**Requisição:**

```http
POST /user
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "123456"
}
```

**Resposta (`201`):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "João Silva",
  "email": "joao@example.com",
  "createdAt": "2026-08-27T12:00:00.000Z",
  "updatedAt": "2026-08-27T12:00:00.000Z"
}
```

#### `POST /post/me`

**Requisição:**

```http
POST /post/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Título do post de exemplo",
  "excerpt": "Resumo breve do conteúdo publicado neste post.",
  "content": "Conteúdo completo do artigo do blog.",
  "coverImage": "https://res.cloudinary.com/example/image/upload/v123/sample.webp",
  "published": false
}
```

**Resposta (`201`):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Título do post de exemplo",
  "slug": "titulo-do-post-de-exemplo",
  "content": "Conteúdo completo do artigo do blog.",
  "excerpt": "Resumo breve do conteúdo publicado neste post.",
  "coverImage": {
    "url": "https://res.cloudinary.com/example/image/upload/v123/sample.webp"
  },
  "published": false,
  "createdAt": "2026-08-27T12:00:00.000Z",
  "updatedAt": "2026-08-27T12:00:00.000Z",
  "author": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

#### `GET /post/:slug` (público)

**Requisição:**

```http
GET /post/titulo-do-post-de-exemplo
```

**Resposta (`200`):** mesmo formato de `PostResponseDto` acima (apenas posts com `published: true`).

#### `POST /upload`

**Requisição:**

```http
POST /upload
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=----boundary

------boundary
Content-Disposition: form-data; name="file"; filename="foto.png"
Content-Type: image/png

<binary>
------boundary--
```

**Resposta (`201`):**

```json
{
  "image_id": "770e8400-e29b-41d4-a716-446655440002",
  "publicId": "1724755200000-abc123",
  "url": "https://res.cloudinary.com/example/image/upload/v123/2026-08-27/joao-silva-550e8400/1724755200000-abc123.webp",
  "folder": "2026-08-27/joao-silva-550e8400",
  "created_at": "2026-08-27T12:00:00.000Z"
}
```

#### Formato de erro padrão

```json
{
  "message": ["E-mail inválido"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Como executar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env
# Edite .env com credenciais reais

# Desenvolvimento (hot reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

Requisições de exemplo estão disponíveis em `rest-client/requests.http`.
