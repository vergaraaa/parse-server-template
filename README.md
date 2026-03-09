# 🚀 Parse Server TypeScript Template

A production-ready, Dockerized Parse Server template configured for Back4App deployments. This template enforces strict Infrastructure-as-Code (IaC) principles, strong TypeScript typing, and a domain-driven folder structure to keep cloud code scalable.

📖 **Note:** This README is a Quick Start guide. For deep-dive explanations on ACLs, validations, and architecture, please read the [Parse Server Development Standards Workflow](https://dev.azure.com/cyberneid/Components/_wiki/wikis/Components.wiki/408/Parse-Server-Development-Standards-Workflow).

---

## 🛠 Prerequisites

- **Docker & Docker Compose**
- **Node.js** (v18+)
- **PNPM**

---

## 🏎 Quick Start

> ⚠️ **Do not clone this repo directly.** Use the CLI below to scaffold a new project — it handles all configuration automatically.

### 1. Scaffold a New Project

```bash
npx @vergaraaa/create-parse-app my-new-app
```

The CLI will prompt you for:

- **Back4App app name** — exact name from your Back4App dashboard
- **Back4App App ID** — found in your app's Security & Keys settings
- **Back4App account email** — used in the deployment script

It will then automatically:

- Clone this template into a new `./my-new-app` folder
- Rename all Docker services and containers with your app prefix
- Create a `.env` from `.env.example` and configure `APP_NAME` and `DATABASE_URI`
- Patch `package.json` with your app name
- Fill in all placeholders in `deploy.sh`
- Initialise a fresh git repo with an initial commit

### 2. Set Remaining Environment Variables

Open the generated `.env` file and fill in your Back4App keys:

```bash
cd my-new-app
```

```env
APP_ID=your_app_id
MASTER_KEY=your_master_key
REST_API_KEY=your_rest_api_key
MAINTENANCE_KEY=your_maintenance_key
```

**⚠️ Critical for mobile development:** Set `SERVER_URL` to your computer's local Wi-Fi IP (e.g., `http://192.168.1.50:1337/parse`), **NOT** `localhost`. Physical devices and emulators resolve files and images from this URL — if it points to `localhost` they will look inside the device itself.

### 3. Install & Start

```bash
pnpm install
docker compose up --build
```

> **Note:** If you add new dependencies via `pnpm add <package>` later, run `docker compose up --build` again to update the container cache.

Once running, access the Parse Dashboard at: `http://localhost:1337/dashboard`

---

## 🗂 Project Structure

We strictly organize code by **Domain (Parse Class)**.

```text
.
├── deploy.sh                    # Back4App deployment script (pre-configured by CLI)
├── docker-compose.yml           # Local infrastructure (pre-configured by CLI)
├── package.json
├── src/
│   ├── index.ts                 # Express & Parse Server initialization
│   ├── config.ts                # Parse Server configuration object
│   └── cloud/                   # ☁️ ALL PARSE LOGIC LIVES HERE
│       ├── main.ts              # Entry point: imports all domain index files
│       │
│       ├── schemas/             # 1. INFRASTRUCTURE AS CODE
│       │   ├── index.ts         # Barrel file + schema definitions array
│       │   ├── profile.schema.ts
│       │   └── test.schema.ts   # (⚠️ Delete before production)
│       │
│       ├── parseObjects/        # 2. STRONGLY TYPED REPOSITORIES
│       │   ├── index.ts
│       │   ├── profile.object.ts
│       │   └── test.object.ts   # (⚠️ Delete before production)
│       │
│       ├── profile/             # 3. DOMAIN: Profile Class
│       │   ├── beforeSave.ts    # Triggers inside the class folder
│       │   └── index.ts         # Barrel exporting triggers/functions
│       │
│       └── migrations/          # 4. DEPLOYMENT SYNC SCRIPTS
│           ├── createClassFromRestSchema.ts
│           ├── dbMigrate.ts     # Script to sync Back4App with schemas/
│           └── index.ts
└── types/                       # Custom TypeScript declarations
```

---

## 📜 The Golden Rules of Development

1. **Zero Dashboard Modifications:** NEVER create classes, add columns, or modify CLPs from the Back4App dashboard. All database architecture must be defined in `src/cloud/schemas/`.
2. **One Folder per Class:** All Cloud Triggers (`beforeSave`, `afterDelete`) and Cloud Functions related to a specific class must live inside a folder named exactly after that class (e.g., `src/cloud/profile/`).
3. **One Function per File:** Never group multiple Cloud Functions into a single file. Create a dedicated file for each function (e.g., `updateAvatar.ts`) and export it via the folder's `index.ts` barrel.
4. **Enforce Server-Side ACLs:** Frontend clients should not dictate security. Always set Row-Level Security (`ACL`) using `beforeSave` triggers inside your domain folders.

---

## 🚀 Deployment to Back4App

**1. Clean up demo code:**
Delete `test.schema.ts`, `test.object.ts`, and the `src/cloud/test/` directory. Remove their exports from the respective barrel files.

**2. Update Version & Changelog:**
Bump the `"version"` in `package.json` and document your changes in `CHANGELOG.md`.

**3. Run the deployment script:**

```bash
./deploy.sh
```

**4. Run the Database Migration:**
Once deployed, go to the **Back4App API Console** in your browser, check the "Master Key" box, and send a `POST` request to:

```
/functions/dbMigrate
```

This automatically creates and syncs all your classes, columns, and CLPs on the production database.
