# CodeMaster
CodeMaster is a free programming learning workspace for C, C++, Java, and JavaScript. It includes student authentication, a persisted starter curriculum, notes, progress, bookmarks, practice submissions, an optional learning assistant, and role-protected content management.

## Requirements

- Node.js 20 or newer.
- MongoDB Atlas or another MongoDB server reachable from the backend.
- A Judge0 runner to enable code execution. CodeMaster deliberately does not run student code in its Express process.
- An OpenAI-compatible API endpoint only if provider-generated tutor responses are wanted. Lessons and local code review work without an AI key.

## Configure the backend

In PowerShell, go to `C:\Users\admin\OneDrive\Desktop\CodeMaster\server` and create a local environment file from the example:

```powershell
Copy-Item .env.example .env
```

Edit `server\.env` locally. Set `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`. Keep `.env` private; never paste database passwords, signing keys, or API tokens into chat or commit them to Git.

Generate a long random JWT signing key with Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Install and start the API:

```powershell
npm install
npm start
```

The server creates starter language, topic, lesson, note, and practice content on startup. It uses upsert-only inserts and leaves later edits intact. Verify the connection in a second PowerShell window:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health
```

To initialize the first Super Admin, set `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, and `SUPER_ADMIN_PASSWORD` in `server\.env`, then run once from the `server` folder:

```powershell
node src/utils/createSuperAdmin.js
```

The script refuses short passwords and refuses to create a second Super Admin. Remove those three bootstrap values from `.env` after initialization.

To update the existing Super Admin credentials, set the same three values to the desired name, email, and password in `server\.env`, then run from the `server` folder:

```powershell
node src/utils/resetSuperAdmin.js
```

This local utility updates the existing Super Admin, hashes the password through the User model, and refuses to take an email already used by another account. Remove the three values from `.env` again after the update.

## Google and GitHub login

OAuth login works from both the Login and Create Account pages. On a provider's first successful sign-in, CodeMaster creates a Student account; subsequent sign-ins use the linked provider identity. Existing accounts can be linked only when the provider returns the same verified email address. Provider IDs are stored on the user record, and provider secrets stay on the backend.

Create OAuth apps with these local callback URLs:

- Google web OAuth client: `http://localhost:5000/api/auth/google/callback`
- GitHub OAuth app: `http://localhost:5000/api/auth/github/callback`

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` in `server\.env`. The optional `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL` values default to the local URLs above. For deployment, set `API_PUBLIC_URL`, `CLIENT_URL`, and each provider callback URL to the HTTPS production addresses registered with Google and GitHub. GitHub needs the `read:user` and `user:email` scopes so CodeMaster can retrieve a verified email address.

After provider approval, the backend returns the CodeMaster session in a URL fragment, verifies it through the existing `/api/auth/me` endpoint, then removes it from the address bar. Do not add provider client secrets to the client environment.

## Start the frontend

In a second PowerShell window:

```powershell
Set-Location C:\Users\admin\OneDrive\Desktop\CodeMaster\client
Copy-Item .env.example .env
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`. `VITE_API_URL` can point the client to a different API origin.

## Roles and routes

- **Student:** registration and login, language and lesson library, notes, bookmarks, completion tracking, practice history, personal analytics, a safe straight-line JavaScript tracer with Mermaid flowcharts, and learning assistant.
- **Admin:** all student learning features plus the content studio for languages, topics, lessons, notes, and questions.
- **Super Admin:** Admin content tools plus Admin account creation and student/Admin account activation controls.

The server checks roles on protected endpoints. Frontend route guards are for navigation and do not replace API authorization.

## Isolated code execution

The practice editor remains available when no runner is set up, but submission returns a clear `503` response. The local development configuration uses the hosted Judge0 CE endpoint at `https://ce.judge0.com`; submitted source code and test input are sent to that provider. Use this shared endpoint for development only. For production, configure a private or protected Judge0 deployment, set `JUDGE0_URL` in `server\.env`, and configure language IDs if they differ from the defaults. Restrict runner network and resource use, and set execution, memory, output, and request limits. `JUDGE0_AUTH_TOKEN` is sent as the `X-Auth-Token` header when configured.

The application caps source size, test count, request rate, and runner wait time. Hidden test inputs and expected outputs are removed from public content responses. Do not point this application at an untrusted execution service.

## Optional learning assistant provider

Without provider credentials, the tutor shows built-in educational guidance and the analyzer performs basic structural checks. To enable provider-generated responses, configure `AI_API_URL`, `AI_API_KEY`, and optionally `AI_MODEL` in `server\.env`. The URL is the provider base path (for example, one ending in `/v1`); the backend sends requests to `/chat/completions`. Provider calls are rate-limited and code and prompts are bounded in size.

## Deploy to Render

The root `render.yaml` blueprint defines one Node web service that builds the Vite client and serves it alongside the API. To use it, push the reviewed project to GitHub, create a Blueprint in Render from that repository, and select the intended branch. Render generates `JWT_SECRET` and prompts for `MONGODB_URI`; the public application URL is used for the client, API, and OAuth callbacks. Keep database credentials in Render’s environment settings; do not upload or commit `server\.env`.

Before the API can start, enter a production MongoDB URI and configure MongoDB network access for the API host. Add optional `AI_API_URL`, `AI_API_KEY`, and `AI_MODEL` in the API service’s environment if AI-generated help is wanted. Add OAuth client IDs and secrets there as well; register `https://<api-host>/api/auth/google/callback` and `https://<api-host>/api/auth/github/callback` with Google and GitHub. The blueprint intentionally leaves code execution unconfigured; use a private/protected Judge0 deployment before enabling public submissions.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/auth/google`, `GET /api/auth/github`
- `GET /api/content` and `GET /api/content/:id` for published curriculum
- `GET/POST/PUT/DELETE /api/content` for Admin content authoring
- `GET/PUT /api/learning/progress/:itemId`, `/bookmarks`, `/submissions`, `/analytics`, `/overview`
- `POST /api/execution/:questionId/run` to preview code with custom standard input
- `POST /api/execution/:questionId` for isolated code evaluation
- `POST /api/ai/help` for tutor, explanation, and analysis
- `POST /api/admin/create` and `/api/superadmin/users` for protected account management

## Build and security checks

From `client`:

```powershell
npm run lint
npm run build
```

From `server`:

```powershell
Get-ChildItem src -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Before deployment, set a production-only JWT secret, exact frontend CORS origin, private database credentials, secure MongoDB network access, and production `NODE_ENV`. Deploy the static client and API separately, enable HTTPS, configure logs and backups, and verify a database restore plan. The API must be deployed with a reachable MongoDB and an isolated runner if submissions are enabled.

## Current scope

The included curriculum is intentionally a small starter set; Admins can expand it from the content studio. User role assignment and fine-grained Admin permissions are not yet exposed as platform settings. AI tutoring is a bounded adapter with an offline fallback, not a required paid feature. Production code execution should use a separately deployed, secured Judge0 service.

The guided dry-run tool traces numeric JavaScript assignments and `console.log` statements without executing source code. Its Mermaid view produces compatible `flowchart TD` text and a local SVG preview from trace steps; other languages show compile/run stages after a runner result. The JavaScript tracer currently stops when the program uses branches, loops, functions, or asynchronous work.
