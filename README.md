# nest-test

## 1. Visão Geral

`nest-test` é uma API REST para uma plataforma de blog, conforme o nome definido em `package.json`. A aplicação permite cadastrar e autenticar usuários, criar e administrar posts, fazer upload de imagens e registrar ações administrativas.

A motivação inferida do código é centralizar o ciclo de publicação de conteúdo com controle de acesso por papéis, armazenamento externo de imagens e trilha de auditoria. O projeto está em desenvolvimento: há módulos funcionais e scripts de execução/seed, mas não há frontend, pipeline de CI/CD, configuração de implantação ou testes versionados identificáveis no repositório.

## 2. Tecnologias Utilizadas

### Backend

- Node.js: versão não fixada no manifesto (TypeScript com alvo ES2023).
- NestJS: `^11.0.1` (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`).
- TypeScript: `^5.7.3`.
- Express via `@nestjs/platform-express`: `^11.0.1`.
- Autenticação: `@nestjs/jwt ^11.0.2`, Passport `^0.7.0`, `passport-jwt ^4.0.1`.
- Validação e transformação: `class-validator ^0.15.1`, `class-transformer ^0.5.1`.
- Segurança e HTTP: `helmet ^8.3.0`, `cookie-parser ^1.4.7`, `@nestjs/throttler ^6.5.0`.
- Senhas: `bcryptjs ^3.0.3`.
- Imagens: `file-type ^22.0.1`, `sharp ^0.35.3` e Cloudinary `^2.10.0`.

### Frontend

- Não configurado neste repositório. 

### Banco de dados

- PostgreSQL, acessado pelo driver `pg ^8.22.0`.
- TypeORM `^1.1.0` e integração NestJS `@nestjs/typeorm ^11.0.3`.
- Migrações TypeORM em `src/migrations/`; a migração presente habilita a extensão `unaccent`.

### DevOps e configuração

- Nest CLI `^11.0.0` para build e execução.
- `dotenv` é usado pelo DataSource; `@nestjs/config ^4.0.4` carrega configuração global.

- Prettier `^3.4.2` e ESLint `^9.18.0` para formatação e análise estática.



## 3. Estrutura de Diretórios

```text
.
├── dev/
│   └── images/                          # Imagens de apoio para desenvolvimento
├── rest-client/
│   └── request.http                     # Requisições manuais para cliente REST
├── src/
│   ├── main.ts                          # Bootstrap, Helmet, CORS, cookies e ValidationPipe
│   ├── app.module.ts                    # Módulo raiz, TypeORM e rate limiting
│   ├── data-source.ts                   # DataSource para migrações
│   ├── auth/                            # Login, JWT, guards e papéis
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── decorators/roles.decorator.ts
│   │   ├── dto/login.dto.ts
│   │   ├── guards/jwt-auth.guard.ts
│   │   ├── guards/roles.guard.ts
│   │   ├── guards/strategies/jwt.strategy.ts
│   │   ├── types/authenticated-request.ts
│   │   └── types/jwt-payload.type.ts
│   ├── user/                            # Usuários e operações administrativas
│   │   ├── user.controller.ts
│   │   ├── admin-user.controller.ts
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   ├── dto/create-user.dto.ts
│   │   ├── dto/filters-user.dto.ts
│   │   ├── dto/update-password.dto.ts
│   │   ├── dto/update-user.dto.ts
│   │   ├── dto/update-user-admin.dto.ts
│   │   ├── dto/user-response.dto.ts
│   │   ├── entities/user.entity.ts
│   │   └── enum/user-role.enum.ts
│   ├── post/                            # Posts públicos, do autor e administrativos
│   │   ├── post.controller.ts
│   │   ├── admin-post.controller.ts
│   │   ├── post.module.ts
│   │   ├── post.service.ts
│   │   ├── dto/create-post.dto.ts
│   │   ├── dto/filters-post.dto.ts
│   │   ├── dto/post-response.dto.ts
│   │   ├── dto/update-post.dto.ts
│   │   ├── dto/update-post-admin.dto.ts
│   │   └── entities/post.entity.ts
│   ├── images/                          # Catálogo e remoção/restauração de imagens
│   │   ├── images.controller.ts
│   │   ├── admin-image.controller.ts
│   │   ├── images.module.ts
│   │   ├── images.service.ts
│   │   ├── dto/filters-image.dto.ts
│   │   ├── dto/image-response.dto.ts
│   │   └── entities/image.entity.ts
│   ├── upload/                          # Validação, conversão e upload de imagens
│   │   ├── upload.controller.ts
│   │   ├── upload.module.ts
│   │   ├── upload.service.ts
│   │   └── upload.config.ts
│   ├── storage/                         # Abstração de storage e adaptador Cloudinary
│   │   ├── image-storage.interface.ts
│   │   ├── storage.module.ts
│   │   ├── cloudinary/cloudinary.provider.ts
│   │   └── cloudinary/cloudinary-storage.provider.ts
│   ├── activity-logs/                   # Auditoria de ações
│   │   ├── activity-logs.controller.ts
│   │   ├── activity-logs.module.ts
│   │   ├── activity-logs.service.ts
│   │   ├── dto/admin-action-reason.dto.ts
│   │   ├── dto/create-log.dto.ts
│   │   ├── dto/filters-log.dto.ts
│   │   ├── dto/log-response.dto.ts
│   │   ├── entities/activity.entity.ts
│   │   ├── enums/action-type.enum.ts
│   │   └── enums/entity-type.enum.ts
│   ├── database/seeds/create-admin.seed.ts # Seed de administrador
│   └── commoun/                         # Utilitários, hashing, pipes e filtro global
│       ├── common.module.ts
│       ├── dto/confirm-admin-action.dto.ts
│       ├── filters/all-exeptions.filter.ts
│       ├── hashing/bcrypt-hashing.service.ts
│       ├── hashing/hashing.service.ts
│       ├── pipes/custom-parse-int-pipe.pipe.ts
│       ├── utils/create-slug-from-text.ts
│       ├── utils/generate-random-suffix.ts
│       ├── utils/parseCorsWhitelist.ts
│       └── utils/slugify.ts
├── src/migrations/1788387174587-AddUnaccentExtension.ts
├── env.example                          # Modelo de variáveis (não é .env.example)
├── package.json                          # Manifesto, dependências e scripts
├── package-lock.json                     # Lockfile npm
├── nest-cli.json                         # Configuração do Nest CLI
├── tsconfig.json                         # TypeScript
├── tsconfig.build.json                   # Exclusões do build
├── eslint.config.mjs                     # ESLint flat config
├── .prettierrc                           # Regras Prettier
└── .gitignore                            # Segredos, dependências e artefatos ignorados
```

## 4. Variáveis de Ambiente

O arquivo de referência existente chama-se `env.example`; copie-o para `.env`. As variáveis marcadas como obrigatórias são necessárias para o fluxo correspondente. O banco e `JWT_SECRET` são necessários para iniciar e autenticar a aplicação; as credenciais de Cloudinary são necessárias para upload.

### Obrigatórias

`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET` e `ALLOWED_IMAGE_TYPES`. Para executar `seed:admin`, também são obrigatórias `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Para upload, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET` são obrigatórias.

### Opcionais (com padrão no código)

`DB_SYNCHRONIZE` (atenção: o código atual só habilita sincronização quando o valor é `0`), `DB_AUTO_LOAD_ENTITIES`, `IMAGE_MAX_UPLOAD_SIZE`, `MAX_INPUT_PIXELS`, `JWT_EXPIRATION`, `JWT_EXPIRES_IN_MS`, `APP_PORT` e `CORS_WHITELIST`.

`COOKIE_NAME` é lida pelo controller de autenticação, mas não aparece no `env.example`. `LOGIN_COOKIE_NAME` aparece no exemplo existente, porém não é lida pelo código atual; configure `COOKIE_NAME` para que o cookie seja nomeado. Essa divergência deve ser resolvida antes de produção.

### `.env.example` completo

```dotenv
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=changeme
DB_DATABASE=the_blog
DB_SYNCHRONIZE=0
DB_AUTO_LOAD_ENTITIES=1

IMAGE_MAX_UPLOAD_SIZE=921600
MAX_INPUT_PIXELS=25000000
ALLOWED_IMAGE_TYPES=image/png,image/jpeg,image/webp,image/gif

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRATION=86400
JWT_EXPIRES_IN_MS=86400000
LOGIN_COOKIE_NAME=loginSesion

APP_PORT=3001
CORS_WHITELIST="http://localhost:3000 https://your-domain.com"

ADMIN_NAME=NOME_ADMIN
ADMIN_EMAIL=EMAIL_ADMIN
ADMIN_PASSWORD=SENHA_ADMIN
```

Não commite `.env`; ele já está listado no `.gitignore`.

## 5. Arquitetura e Decisões Técnicas

- A aplicação segue a arquitetura modular do NestJS: autenticação, usuários, posts, imagens, uploads e auditoria possuem módulos, controllers e services separados.
- TypeORM persiste `User`, `Post`, `Images` e `ActivityLog` em PostgreSQL. Usuários, posts e imagens usam remoção lógica com `DeleteDateColumn`.
- O JWT é extraído do header `Authorization: Bearer <token>`. No login, o token também é enviado em cookie `httpOnly`, `secure` e `sameSite=strict`.
- `RolesGuard` restringe operações administrativas ao papel `ADMIN`; `JwtAuthGuard` valida a sessão e bloqueios/força de logout.
- `ValidationPipe` global transforma entradas, remove campos não permitidos e rejeita propriedades não declaradas.
- Helmet, CORS por whitelist e Throttler (10 requisições a cada 10 segundos, com bloqueio de 5 segundos) fornecem proteções HTTP básicas.
- Uploads são recebidos em memória, têm tipo real validado por `file-type`, são redimensionados/converteridos para WebP por `sharp` (até 1920x1080) e enviados ao Cloudinary por uma abstração de storage.
- Ações relevantes são registradas em `activity_logs`, incluindo ações administrativas com motivo e confirmação da senha.
- O código não declara versionamento de rota, Swagger/OpenAPI, frontend ou estratégia de deploy; portanto, as URLs abaixo são inferidas apenas da porta local configurável.

## 6. Endpoints/API

### URLs por ambiente

| Ambiente | URL base | Situação |
|---|---|---|
| Local | `http://localhost:3001` | Inferida de `APP_PORT`/fallback `3001` |
| Desenvolvimento remoto | `[URL_NÃO_CONFIGURADA]` | Não há configuração no repositório |
| Produção | `[URL_NÃO_CONFIGURADA]` | Não há configuração no repositório |

Os endpoints protegidos aceitam `Authorization: Bearer <JWT>`. Os endpoints sob `/admin` exigem papel `ADMIN`.

### Autenticação

| Método | Rota | Acesso | Corpo principal |
|---|---|---|---|
| POST | `/auth/login` | Público | `{ "email": "user@example.com", "password": "******" }` |
| POST | `/auth/logout` | Autenticado | — |
| POST | `/auth/admin/:id/logout` | Admin | `{ "password": "******", "reason": "Motivo com pelo menos 10 caracteres" }` |
| POST | `/auth/admin/:id/revoke-logout` | Admin | Mesmo corpo administrativo |

### Usuários

| Método | Rota | Acesso |
|---|---|---|
| POST | `/user` | Público |
| GET | `/user/me` | Autenticado |
| PATCH | `/user/me` | Autenticado |
| PATCH | `/user/me/password` | Autenticado |
| DELETE | `/user/me` | Autenticado |
| GET | `/admin/users` | Admin; filtros e paginação |
| PATCH | `/admin/users/:id` | Admin |
| PATCH | `/admin/users/:id/promote` | Admin; confirmação de senha e motivo |
| PATCH | `/admin/users/:id/demote` | Admin; confirmação de senha e motivo |
| PATCH | `/admin/users/:id/block` | Admin; confirmação de senha e motivo |
| PATCH | `/admin/users/:id/unblock` | Admin; confirmação de senha e motivo |
| PATCH | `/admin/users/:id/restore` | Admin; motivo |
| DELETE | `/admin/users/:id` | Admin; motivo |

### Posts

| Método | Rota | Acesso |
|---|---|---|
| GET | `/post` | Público; posts publicados |
| GET | `/post/:slug` | Público; post publicado |
| POST | `/post/me` | Autenticado |
| GET | `/post/me` | Autenticado |
| GET | `/post/me/:id` | Autenticado |
| PATCH | `/post/me/:id` | Autenticado |
| DELETE | `/post/me/:id` | Autenticado |
| GET | `/admin/posts` | Admin; filtros e paginação |
| PATCH | `/admin/posts/:id/update` | Admin |
| PATCH | `/admin/posts/:id/restore` | Admin; confirmação de senha e motivo |
| DELETE | `/admin/posts/:id` | Admin; confirmação de senha e motivo |

Exemplo de criação:

```http
POST http://localhost:3001/post/me
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "title": "Título do post com no mínimo dez caracteres",
  "excerpt": "Excerto com no mínimo dez caracteres",
  "content": "Conteúdo do post",
  "coverImage": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  "published": true
}
```

### Imagens e upload

| Método | Rota | Acesso | Observação |
|---|---|---|---|
| POST | `/upload` | Autenticado | `multipart/form-data`, campo `file`; imagem até 900 KiB por Multer |
| GET | `/images/me` | Autenticado | Imagens do usuário |
| GET | `/images/:id` | Autenticado | UUID da imagem |
| DELETE | `/images/:id` | Autenticado | Remoção própria |
| GET | `/admin/images` | Admin; filtros e paginação | — |
| PATCH | `/admin/images/:id/restore` | Admin; confirmação de senha e motivo | — |
| DELETE | `/admin/images/:id` | Admin; confirmação de senha e motivo | — |

Exemplo de upload:

```bash
curl -X POST http://localhost:3001/upload \
  -H "Authorization: Bearer <JWT>" \
  -F "file=@./dev/images/image.jpeg"
```

### Auditoria

| Método | Rota | Acesso | Filtros |
|---|---|---|---|
| GET | `/activity-logs` | Admin | Filtros de imagem e paginação (`page`, `limit` etc.) |

Listagens administrativas aceitam filtros específicos de cada DTO e `page` (mínimo 1) e `limit` (entre 1 e 100). Respostas de criação/consulta usam DTOs de resposta e não expõem `passwordHash`.
