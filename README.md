# Entrelinhas

Catálogo de livros full-stack para um projeto **pessoal e experimental**, com dados inteiramente fictícios. Não depende de sistemas, infraestrutura, credenciais ou dados corporativos.

Permite listar, paginar, ordenar, buscar por título e autor, filtrar por gênero, consultar detalhes e criar, editar e excluir livros. O frontend usa **JavaScript**, conforme solicitado, com validação de dados em tempo de execução.

## Arquitetura

```text
React / JavaScript → HTTP / JSON → Spring MVC → serviço transacional → JPA → PostgreSQL
```

Uma aplicação Spring Boot e uma SPA Vite. Controller, serviço e repositório têm responsabilidades diretas; não há interfaces de serviço, wrappers de persistência ou estado global adicional. Records definem a fronteira da API; a entidade JPA fica interna ao backend. TanStack Query gerencia cache e operações HTTP. Filtros e página ficam na URL, permitindo navegação e compartilhamento.

```text
.
├── backend/
│   ├── .mvn/wrapper/       # Maven fixado e checksum da distribuição
│   ├── src/main/java/dev/entrelinhas/catalog/
│   ├── src/main/resources/db/{migration,demo}/
│   └── src/test/java/      # Testes de serviço e API + PostgreSQL real
├── frontend/
│   ├── src/               # Componentes, API, schemas, estilos e testes
│   ├── tests/             # Fluxos de navegador Playwright
│   └── package-lock.json
├── compose.yaml           # Somente PostgreSQL local
├── .env.example           # Nomes e exemplos sem credenciais reais
└── README.md
```

## Versões

Versões estáveis consultadas nos registries oficiais durante a implementação, sem releases milestone/RC.

| Tecnologia | Versão utilizada |
| --- | --- |
| Java LTS | 25 (validação com JDK 25.0.4.1) |
| Spring Boot / Spring Framework | 4.1.1 / 7, gerenciado pelo Boot |
| Maven / Maven Wrapper | 3.10.0 / 3.3.4 |
| Lombok | 1.18.48 (somente compilação) |
| Jasypt Spring Boot / Jasypt | 4.0.4 / 1.9.3 |
| PostgreSQL | 18.3 |
| Flyway / Hibernate / JUnit / Mockito / AssertJ | Gerenciados pelo BOM Spring Boot 4.1.1 |
| springdoc OpenAPI | 3.1.1 |
| Testcontainers | 2.0.5 |
| Node.js | 24 LTS (validação com 24.19.0) |
| React / React DOM | 19.3.0 |
| Vite | 8.3.2 |
| React Router | 7.18.4 |
| TanStack Query | 5.104.1 |
| React Hook Form / resolvers | 7.89.0 / 5.9.1 |
| Zod | 4.6.5 |
| Vitest / Playwright | 5.0.3 / 1.63.0 |
| ESLint | 10.12.0 |

As versões exatas das dependências Java transitivas são determinadas pelo POM/BOM; as do frontend estão no `package-lock.json`. Para inspecioná-las, execute `./mvnw dependency:tree` e `npm ls --depth=0` nos respectivos diretórios.

## Pré-requisitos

- JDK **25**, com `JAVA_HOME` apontando para ele.
- Node.js 24 LTS e npm. O mínimo suportado pelo frontend é Node 22.12.
- Docker com Compose v2 ou Podman com API compatível com Docker para o banco local e os testes Testcontainers.
- Alternativamente, uma instalação PostgreSQL existente para executar a aplicação; os testes de integração continuam exigindo um runtime compatível com a API Docker.

O Maven Wrapper dispensa instalar Maven globalmente. Seus downloads verificam checksum. No Windows, use `mvnw.cmd` e configure as variáveis no shell correspondente.

## Banco e variáveis de ambiente

Na raiz do projeto:

```bash
cp .env.example .env
```

Edite `.env` e substitua os exemplos de `DB_USER` e `DB_PASSWORD` por valores locais escolhidos por você. **Não versione esse arquivo.** O Compose lê `.env`; o Spring Boot lê as variáveis do processo, portanto elas também devem ser exportadas ao iniciar o backend.

| Variável | Uso | Padrão |
| --- | --- | --- |
| `DB_USER` | Usuário PostgreSQL; obrigatório | Nenhum |
| `DB_PASSWORD` | Senha PostgreSQL; obrigatória | Nenhum |
| `DB_PORT` | Porta local publicada pelo Compose | `5432` |
| `DB_URL` | JDBC do backend | Endereço definido em `application.yml`; `.env.example` usa `localhost:5432/devdb` |
| `SPRING_PROFILES_ACTIVE` | `demo` inclui 18 livros fictícios | Sem dados demo |
| `CORS_ORIGINS` | Origins permitidas, separadas por vírgula | `http://localhost:5173` |
| `PORT` | Porta do backend | `8080` |
| `VITE_API_BASE_URL` | Origin da API no frontend, sem `/api` | Vazio: usa `/api` e o proxy Vite |
| `JASYPT_ENCRYPTOR_PASSWORD` | Chave mestre para descriptografar `ENC(...)` no backend | Nenhum; necessária somente com valores criptografados |

```bash
docker compose up -d --wait
```

Com Podman rootless no Linux, use `systemctl --user enable --now podman.socket` e execute `DOCKER_HOST=unix://${XDG_RUNTIME_DIR}/podman/podman.sock docker compose up -d --wait`.

O banco fica em `localhost:${DB_PORT:-5432}`, database `devdb`, com volume persistente e porta publicada apenas no loopback. Se a porta 5432 já estiver ocupada, defina `DB_PORT=5433` e `DB_URL=jdbc:postgresql://localhost:5433/devdb` em `.env`. `docker compose down` preserva os dados. As variáveis do Compose criam o usuário/senha **na primeira inicialização**; alterar `.env` depois não altera credenciais de um volume existente.

Flyway aplica `V1__create_books.sql`; Hibernate apenas valida o schema (`ddl-auto=validate`). O perfil `demo` acrescenta `V2__demo_books.sql`, uma única vez. Mantenha esse perfil para um banco já inicializado com demo; para executar sem dados fictícios, use outro banco/schema vazio. Desligar o perfil no mesmo schema deixa a migration demo fora das localizações de validação.

Se PostgreSQL já estiver instalado, crie `devdb`, forneça um usuário com permissão de criar tabelas/migrations e configure as mesmas variáveis. Não é necessário iniciar o Compose nesse caso.

## Propriedades criptografadas com Jasypt

O starter habilita a leitura automática de `ENC(...)` no Spring, inclusive nas propriedades do datasource. `DB_URL`, `DB_USER` e `DB_PASSWORD` configuram o banco local. Sem essas variáveis, o backend usa a URL padrão e os valores criptografados já presentes em `application.yml`; nesse caso, é necessária a chave mestre correspondente.

Use o seu [jasypt-tool](https://github.com/arandarod/jasypt-tool) para gerar os valores. O backend usa os mesmos parâmetros do tool no commit `0cb1662`:

| Parâmetro | Valor |
| --- | --- |
| Algoritmo | `PBEWITHHMACSHA512ANDAES_256` |
| Iterações | `1000` |
| Salt / IV | `RandomSaltGenerator` / `RandomIvGenerator` |
| Saída | `base64`, com delimitador `ENC(...)` |

**Antes de usar uma chave real no tool**, remova a linha que imprime `"password: " + password`. Ela expõe a chave mestre no terminal. Prefira o modo interativo, pois passar um valor secreto em `-Dexec.args` o coloca no histórico/argumentos do processo.

Em Bash, solicite a chave sem gravá-la no histórico (use a mesma chave para gerar os valores e iniciar o backend):

```bash
read -rsp "Chave mestre Jasypt: " JASYPT_ENCRYPTOR_PASSWORD
printf '\n'
export JASYPT_ENCRYPTOR_PASSWORD
```

No diretório do seu tool:

```bash
mvn -q compile exec:java
```

No prompt do tool, use `enc` seguido do valor que deseja criptografar e depois `exit`. Configure a saída completa `ENC(...)` em `DB_USER`, `DB_PASSWORD` ou diretamente nas propriedades Spring correspondentes. Mantenha a chave mestre fora de `application.yml` e do Git. Carregue `.env` **antes** de solicitar/exportar a chave; uma atribuição vazia nesse arquivo sobrescreve a variável.

**Com Docker Compose**, `DB_USER` e `DB_PASSWORD` inicializam o servidor PostgreSQL e precisam conter os valores originais, no `.env` ignorado pelo Git. Para criptografar apenas a configuração recebida pelo backend, use os overrides padrão do Spring:

```bash
export SPRING_DATASOURCE_USERNAME='ENC(resultado_gerado_pelo_tool)'
export SPRING_DATASOURCE_PASSWORD='ENC(resultado_gerado_pelo_tool)'
```

Os exemplos acima são placeholders; substitua pelos resultados reais. O Compose não descriptografa `ENC(...)`. Para PostgreSQL já existente, sem Compose, você também pode fornecer `DB_USER`/`DB_PASSWORD` diretamente criptografados. Valores em texto puro continuam funcionando sem chave mestre, como nos testes existentes e na configuração demo local.

Valores criptografados exigem a chave correta; uma chave ausente ou incorreta impede a resolução da configuração. Se alterar algoritmo ou iterações, atualize tool e backend juntos e gere novamente os valores. Não envie a chave mestre em chat nem a inclua em opções `-D` do processo.

Se uma senha foi publicada anteriormente em texto puro, removê-la do arquivo atual não a remove do histórico Git. Troque essa senha; esta alteração não reescreve o histórico.

## Executar localmente

Terminal 1, a partir da raiz (Bash):

```bash
set -a
source .env
set +a
cd backend
./mvnw spring-boot:run
```

Terminal 2, a partir da raiz:

```bash
cd frontend
npm ci
npm run dev
```

Aplicação em `http://localhost:5173`. O Vite encaminha `/api` para o backend em `http://localhost:8080`. Para outro backend, copie `frontend/.env.example` para `frontend/.env.local` e configure `VITE_API_BASE_URL`; inclua a origin do frontend em `CORS_ORIGINS` no backend. Reinicie o Vite após mudar variáveis. Variáveis `VITE_*` são públicas no bundle: nunca coloque segredos nelas.

Para gerar os artefatos:

```bash
cd backend
./mvnw verify
```

```bash
cd frontend
npm run build
```

Com as variáveis de banco exportadas, o backend empacotado roda com `java -jar backend/target/catalog-0.1.0.jar`. Não reempacote esse mesmo JAR enquanto ele estiver em execução. O diretório `frontend/dist` requer hospedagem estática com fallback das rotas para `index.html` e proxy `/api`, ou `VITE_API_BASE_URL` configurada no build. `npm run preview` serve para inspecionar o build, não é um servidor de produção.

## Testes

Backend, a partir de `backend/`:

```bash
./mvnw verify
```

Testcontainers cria um PostgreSQL isolado e o remove ao terminar. Os testes não usam `devdb`, `.env` nem H2. Cobrem CRUD persistido, not found, conflitos de ISBN, validação, JSON inválido, busca sem distinção de maiúsculas, escape de `%`, combinação de filtros, paginação, ordenação estável, parâmetros inválidos, CORS e OpenAPI. Os testes Jasypt verificam descriptografia, chaves ausentes/incorretas, configuração sem criptografia, compatibilidade com um valor fictício gerado pelo seu tool e conexão/migrations com URL, usuário e senha criptografados em PostgreSQL real. Mockito isola apenas regras em que não gravar dados importa.

Para usar Podman rootless nos testes no Linux, inicie `systemctl --user enable --now podman.socket` e exporte `DOCKER_HOST=unix://${XDG_RUNTIME_DIR}/podman/podman.sock` e `TESTCONTAINERS_RYUK_DISABLED=true` antes do Maven. O IntelliJ Flatpak também precisa de acesso a esse socket nas permissões do aplicativo.

Frontend, a partir de `frontend/`:

```bash
npm ci
npm test
npm run lint
npm run build
```

Vitest + Testing Library exercitam formulários, normalização, erros por campo, bloqueio durante salvamento, loading, falhas de API, coleção vazia e filtros/paginação. ESLint falha também em warnings.

Com backend e frontend rodando e um **banco demo dedicado**, execute:

```bash
npx playwright install chromium
npm run test:e2e
```

Os testes de navegador esperam os 18 livros demo originais. Exercitam buscas, filtro, ordenação, paginação, formulário inválido, criação, edição, exclusão confirmada/cancelada, responsividade e falhas. Criam e removem um registro fictício. Não execute E2E sobre uma coleção pessoal que queira preservar. `test-results/` recebe screenshots desktop, mobile, formulário inválido e detalhes; o relatório fica em `playwright-report/`, ambos ignorados pelo Git. No cloud foi usado Chromium já instalado, com `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`.

Validação inicial: **21 testes backend, 22 testes frontend e 2 testes Chromium passaram**, sem falhas ou testes ignorados. Após integrar Jasypt, **29 testes backend passaram**, incluindo criptografia, compatibilidade com o tool e banco. A suíte completa foi executada novamente, sem falhas ou testes ignorados. Build backend/frontend e lint passaram na validação da aplicação. Requisições reais diretamente à API e pelo proxy Vite retornaram os livros PostgreSQL. Springdoc informa nos logs que os endpoints de documentação estão habilitados; isso é intencional nesta POC.

## API

| Método | Endpoint | Resultado |
| --- | --- | --- |
| GET | `/api/books` | Página do catálogo |
| GET | `/api/books/{id}` | Detalhes ou 404 |
| POST | `/api/books` | 201 + `Location` |
| PUT | `/api/books/{id}` | Atualização completa, 200 |
| DELETE | `/api/books/{id}` | 204 ou 404 |

Parâmetros da listagem: `title`, `author`, `genre`, `page` (base zero), `size` (1–100), `sort` (`title`, `author`, `publicationYear`, `createdAt`) e `direction` (`asc`, `desc`). Filtros são combinados com AND; busca é parcial, literal e sem distinção de maiúsculas. Ordenação recebe `id` como desempate. A ordenação textual segue a collation do PostgreSQL; acentos não são removidos da busca.

Resposta paginada: `{ "items": [...], "page": 0, "size": 6, "totalItems": 18, "totalPages": 3 }`. Página além do fim retorna `items: []`; a interface ajusta uma página que ficou vazia após alterações.

```json
{
  "title": "Uma história fictícia",
  "author": "Clara Vale",
  "isbn": "9780000000996",
  "publicationYear": 2025,
  "genre": "FICTION",
  "available": true
}
```

`id` e `createdAt` são gerados no servidor. Título: 1–200 caracteres; autor: 1–120; ano: inteiro entre 1 e o ano atual. ISBN-13 aceita hífens/espaços, verifica prefixo e checksum, é normalizado e único no banco. Gêneros: `FICTION`, `FANTASY`, `SCIENCE`, `HISTORY`, `POETRY`, `TECHNOLOGY`. `available` deve ser um booleano explícito.

Erros da API usam Problem Details RFC 9457 (`application/problem+json`), com `status`, `title`, `detail` e `instance`. Erros de Bean Validation acrescentam `errors`, um mapa por campo. Entradas inválidas retornam 400; livros ausentes, 404; ISBN duplicado, 409. A constraint única também protege gravações concorrentes.

Swagger UI: `http://localhost:8080/swagger-ui.html`.
OpenAPI JSON: `http://localhost:8080/v3/api-docs`.

## Why these technologies were chosen in 2026

- **Java 25 LTS** oferece uma base com suporte prolongado. Records simplificam DTOs; `var` e `Optional` são usados onde tornam o código mais claro, sem recursos preview.
- **Spring Boot 4 / Spring Framework 7** integra HTTP, validação, transações, JPA e Problem Details com configuração pequena e um BOM coerente. Não há infraestrutura distribuída sem necessidade.
- **Lombok** reduz os getters e o construtor JPA da entidade, os construtores de injeção e a declaração do logger. O annotation processor é configurado explicitamente para Java 25 e a dependência fica fora do JAR executável. DTOs continuam sendo records; a entidade não usa `@Data`, setters genéricos nem `equals`/`hashCode` gerados.
- **PostgreSQL 18** oferece constraints, transações e tipos reais de produção. Flyway torna a criação do schema reproduzível; Testcontainers testa a mesma tecnologia, evitando diferenças mascaradas por H2.
- **React 19 + JavaScript** permite componentes funcionais e hooks, atendendo à escolha explícita de JavaScript. Vite mantém o fluxo de desenvolvimento e build rápido; React Router resolve as poucas rotas necessárias.
- **TanStack Query** cuida dos dados do servidor sem Redux. **React Hook Form + Zod** oferece validação e normalização do formulário com pouco código; o backend valida novamente.
- **CSS próprio** é suficiente para esta interface. As fontes são empacotadas localmente e as capas são ilustrações CSS, sem serviços externos. Vitest, Testing Library e Playwright verificam comportamento em níveis complementares.

## Decisões e limites

- POC de usuário único, sem autenticação, autorização ou upload de capas. Não há integração externa.
- ISBN identifica uma edição única; `available` registra disponibilidade, sem gestão de exemplares/empréstimos.
- Atualizações usam last-write-wins; não há versionamento otimista nesta POC.
- Lombok 1.18.48 emite um aviso de depreciação pelo uso interno de `sun.misc.Unsafe` durante a compilação com Java 25. A compilação e os testes passam; o Lombok não está presente no JAR executável. Não foi adicionada uma opção para ocultar esse aviso.
- Busca por substring foi escolhida para uma coleção pequena; não há índice/trigram nem mecanismo de busca adicional.
- Backend e frontend compartilham o contrato documentado no OpenAPI; não há geração de cliente nem checagem estática TypeScript.
- O volume PostgreSQL pertence ao Docker; processos e volumes não devem ser presumidos disponíveis numa nova máquina cloud. Recrie os serviços conforme as instruções do ambiente. Restauração em uma nova tarefa não foi validada.
- `.env`, dependências, builds, relatórios e arquivos de IDE são ignorados. Nenhuma credencial real é armazenada no código.
