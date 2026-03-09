# 🚀 Parse Server TypeScript Template

A production-ready, Dockerized Parse Server template configured for Back4App deployments. This template enforces strict Infrastructure-as-Code (IaC) principles, strong TypeScript typing, and a domain-driven folder structure to keep cloud code scalable.

📖 **Note:** This README is a Quick Start guide. For deep-dive explanations on ACLs, validations, and architecture, please read the **wiki** file.

---

## 🛠 Prerequisites

- **Docker & Docker Compose**
- **Node.js** (v18+)
- **PNPM**

---

## 🏎 Quick Start

### 1. Configure Project Details

Before installing packages, open your `package.json` file and change the `"name"` property from the template default to your specific app's name and add a description if necessary.

### 2. Prevent Docker Conflicts (Crucial First Step)

Because this template is shared across multiple projects, you **must** rename your Docker services to avoid local network collisions.

1. Open `docker-compose.yml`.
2. Rename `mongodb` to `[yourapp]-mongodb` (e.g., `myapp-mongodb`).
3. Rename `parse-app` to `[yourapp]-parse-app`.
4. Update the `depends_on` block to match the new MongoDB service name.

### 3. Set Up Environment Variables

Copy the provided `.env.example` file to create your local `.env` file:

```bash
cp .env.example .env
```

Open the newly created `.env` file and fill in your specific Back4App keys.

**⚠️ CRITICAL CONFIGURATIONS:**

- **Mobile Dev:** Set `SERVER_URL` to your computer's local Wi-Fi IP (e.g., `http://192.168.1.50:1337/parse`), **NOT** `localhost`. This is required for physical devices/emulators to resolve files and images correctly.
- **Database:** Ensure your `DATABASE_URI` matches the exact MongoDB service name you configured in Step 2 (e.g., `mongodb://[yourapp]-mongodb:27017/parsedb`).

### 4. Install & Start

Run the following commands to install dependencies using the shared global store and spin up the Docker container:

```bash
pnpm install
docker compose up --build
```

> **Note:** If you add new dependencies via `pnpm add <package>` later, you must run `docker compose up --build` again to update the container's cache.

Once running, access the Parse Dashboard securely at: `http://localhost:1337/dashboard`

---

## 🗂 Project Structure

We strictly organize our code by **Domain (Parse Class)**.

```text
.
├── deploy.sh                    # Customizable Back4App deployment script
├── docker-compose.yml           # Local infrastructure
├── package.json
├── src/
│   ├── index.ts                 # Express & Parse Server initialization
│   ├── config.ts                # Parse Server configuration object
│   └── cloud/                   # ☁️ ALL PARSE LOGIC LIVES HERE
│       ├── main.ts              # Entry point: Imports all domain index files
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
2. **One Folder per Class:** All Cloud Triggers (`beforeSave`, `afterDelete`) and Cloud Functions related to a specific class (e.g., `Profile`) must live inside a folder named exactly after that class (e.g., `src/cloud/profile/`).
3. **One Function per File:** Never group multiple Cloud Functions into a single file. Create a dedicated file for each function (e.g., `updateAvatar.ts`) and export it via the folder's `index.ts` barrel.
4. **Enforce Server-Side ACLs:** Frontend clients should not dictate security. Always set Row-Level Security (`ACL`) using `beforeSave` triggers inside your domain folders.

---

## 🚀 Deployment to Back4App

Before deploying for the first time, open `deploy.sh` and replace the placeholder values (`<YOUR_APP_NAME>`, `<YOUR_APP_ID>`) with your specific Back4App credentials.

**1. Clean up demo code:**
Delete `test.schema.ts`, `test.object.ts`, and the `src/cloud/test/` directory.

**2. Update Version & Changelog:**
Open `package.json` and bump the `"version"` number. Document your additions, fixes, and schema updates in a `CHANGELOG.md` file to keep a clear history of releases.

**3. Run the deployment script:**

```bash
./deploy.sh
```

**4. Run the Database Migration:**
Once deployed, go to your **Back4App API Console** in the browser, check the "Master Key" box, and send a `POST` request to:  
`/functions/dbMigrate`

This will automatically create and sync all your classes, columns, and CLPs on the production database!
