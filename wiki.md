# 📖 Parse Server Development Standards & Workflow

## 🛑 1. The Problem: Why We Need This

Historically, our database schemas have been created dynamically via the Parse Client SDK or manually clicking around the Back4App dashboard. This causes several massive problems:

1.  **Environment Drift:** Local databases and the Production database fall out of sync. A feature works locally but crashes in prod because a column is missing or a type is wrong.
2.  **Security Risks:** Relying on the frontend (iOS/Web) to set ACLs or default values is a major security flaw. Clients can be manipulated to bypass security.
3.  **Deployment Surprises:** If we only test on Back4App, we often run into versioning issues (Node.js, MongoDB, or Parse SDK version mismatches) that break in production. Furthermore, Back4App logs can take a long time to update and truncate data, making it incredibly difficult to debug what is actually happening.

### 🚫 The "Zero Dashboard Modifications" Rule

Moving forward, **no one is allowed to modify the database architecture via the Back4App dashboard.**

- No creating new schemas in the dashboard.
- No adding new columns to existing schemas.
- No modifying CLPs or ACLs manually.

The Back4App dashboard should **only** be used to view or manually create _information/data records_. By strictly enforcing schema creation via our backend code, we lock down the ability for clients to dynamically create new classes. This ensures that even if our secret keys (like the Client Key or REST API Key) are exposed, a malicious actor cannot arbitrarily alter our database structure or inject new tables.

---

## ⚠️ 2. The Current Situation: The "Hybrid" Extremes

Right now, our app uses a hybrid approach: some features use the Parse SDK directly from the frontend, while others rely entirely on Cloud Functions.

**To be clear: using both Cloud Functions and the Client SDK is not wrong.** In fact, that is the correct architecture (Client SDK for simple CRUD, Cloud Functions for complex/secure business logic).

**What _is_ wrong is our current execution**, which bounces between two dangerous security extremes:

- **Extreme A: The "All Private" Approach (Too Slow)** Some of our schemas are completely locked down. Because the frontend can't access them directly, developers are writing custom Cloud Functions for every single basic CRUD operation and bypassing security with the `Master Key`. This defeats the entire purpose of having a BaaS with a powerful Client SDK, slowing down frontend development and bloating our Cloud Code.
- **Extreme B: The "All Public" Approach (Too Insecure)**
  To move faster, other features use the Parse Client SDK directly from the frontend. However, because developers forget to attach ACLs or don't configure CLPs in the dashboard, these tables are completely public. Anyone with our App ID can read, modify, or delete the data.

---

## ✅ 3. The Solution: Infrastructure as Code & Standardized Security

We need to balance the **speed** of the Parse Client SDK with the **security** of a traditional backend. From now on, our Backend code is the **Single Source of Truth**.

- **Speed:** The frontend uses the Parse SDK directly for standard CRUD operations.
- **Security:** Security (ACLs/CLPs) is enforced strictly on the server so the frontend cannot manipulate it.
- **Consistency:** Schema changes are deployed via automated migration scripts, eliminating environment drift.

---

## 📦 4. Package Management with PNPM

Because this backend serves as a **template** that will be duplicated across many of our apps, using standard `npm` or `yarn` would be highly inefficient. Standard package managers copy every dependency into each project's folder, meaning you would download and store heavy libraries (like `parse-server`, `typescript`, `express`) over and over again.

**To solve this, we strictly use `pnpm` (Performant NPM).**
👉 **[Official PNPM Installation Guide](https://pnpm.io/installation)**

### Why `pnpm` is the standard for our templates:

1. **Shared Global Store:** `pnpm` downloads a dependency exactly _once_ and saves it in a single global store on your machine. When you scaffold a new app from this template, `pnpm` simply creates a hard link from the global store to your local `node_modules`.
2. **Massive Disk Space Savings:** If you have 10 projects using this template, standard `npm` would consume 10x the disk space. With `pnpm`, it only consumes 1x.
3. **Lightning Fast Installs:** Because dependencies for new projects are just linked from the global store instead of being downloaded from the internet, running `pnpm install` on a new template takes seconds.
4. **Strict Module Resolution:** `pnpm` enforces strict dependency trees, meaning your code won't accidentally rely on "phantom dependencies" that happen to be installed by other libraries. This prevents "it works on my machine" bugs during deployment.

_Moving forward, always use `pnpm install`, `pnpm add <package>`, and `pnpm run` instead of their `npm` equivalents._

---

## 💻 5. Local Environment Setup

To avoid deployment surprises and the nightmare of debugging via delayed Back4App logs, **all development must happen locally using Docker.** Our Docker setup uses the exact same Node.js, MongoDB, and Parse versions as our Back4App production environment.

### 🐳 The Dockerfile

Our Dockerfile is specifically optimized to use PNPM via Node's native `corepack` for lightning-fast container builds:

```dockerfile
FROM node:19.9.0-alpine

WORKDIR /usr/src/app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install

EXPOSE 1337

CMD ["pnpm", "run", "dev"]
```

### ⚠️ Preventing Container Conflicts

**1. Updated `.env` file:**
Make sure your `DATABASE_URI` connection string targets the exact service name you just created for MongoDB!

```env
# PARSE SERVER
PORT=1337
APP_NAME=Parse App
APP_ID=myAppId
MASTER_KEY=myMasterKey
REST_API_KEY=myRestApiKey
MAINTENANCE_KEY=myMaintenanceKey

# ⚠️ CRITICAL FOR MOBILE DEV: Use your local IP, NOT localhost!
SERVER_URL=http://192.168.1.50:1337/parse

# DATABASE
# MUST MATCH the new mongodb service name from docker-compose.yml!
DATABASE_URI=mongodb://myapp-mongodb:27017/parsedb
```

**💡 Why the Local IP and not Localhost?**
If you are developing a mobile app (like Flutter or React Native), you **must** set the `SERVER_URL` to your computer's local network IP (e.g., `192.168.1.50`). If you set it to `localhost`, the Parse Server will save file and image URLs as `http://localhost...`. When your physical phone tries to load that image, it will look for `localhost` inside the phone itself instead of your computer, and all your images will be broken!

**2. Dynamic Console Logging in `index.ts`:**
Even though the app needs the IP address for the `SERVER_URL`, **you must access the Parse Dashboard in your computer's browser using `localhost`**.

If you try to open the dashboard via the `192.168.x.x` IP over standard HTTP, modern web browsers will block the `crypto.randomUUID()` function for security reasons, causing the dashboard to instantly crash with an error.

To keep this clear for your team, update your `app.listen` block to print both specific URLs:

```typescript
app.listen(port, () => {
  // The IP address your mobile app needs to connect to
  console.log(`🚀 Mobile App Endpoint (SERVER_URL): ${process.env.SERVER_URL}`);
  // The secure localhost URL you should click to view the dashboard
  console.log(
    `📊 Parse Dashboard (Browser access):  http://localhost:${port}/dashboard`,
  );
});
```

**3. Start the server:**
For the very first time, build and start the containers by running:

```bash
docker compose up --build
```

This spins up the database and backend. Any changes you make to TypeScript files will automatically restart the server. **After building the first time, only `docker compose up` is necessary to start your environment.**

**4. Stop the server:**
To gracefully stop the containers, use:

```bash
docker compose down
```

_Warning:_ If you want to completely wipe your local database and start fresh, run `docker compose down -v`. The `-v` flag deletes all attached volumes holding your MongoDB data.

**🔄 Note on Dependencies:**
Because Docker caches your `node_modules` inside the container, running `pnpm add <package>` on your local machine is not enough. **Whenever you install a new dependency, you must rebuild the container** by stopping the server and running:

```bash
docker compose up --build
```

---

## 📂 6. Project Structure & Organization

To keep our codebase scalable, we strictly group logic by domain (Class).

**The Golden Rules of Folder Structure:**

1. **Name folders after the Class:** The folder name must match the name of the Parse Class it represents (e.g., `test` for the `Test` class, `profile` for the `Profile` class).
2. **Everything lives inside:** _All_ Cloud Triggers (`beforeSave`, `afterDelete`, etc.) and _all_ custom Cloud Functions related to that class must live inside its dedicated folder.
3. **One function per file:** Crucially, every single Cloud Function must have its own dedicated file. Do not dump multiple functions into one file or into `main.ts`.

### 🗂️ Example Directory Tree

Here is how the project looks with a `Test` class and a `Profile` class. Note that this is a template—as your app grows, you should add shared folders like `utils`, `helpers`, or `services` (for third-party integrations like Stripe), but **they must all live inside the `src/cloud/` directory**.

```text
src/cloud/
 ├── main.ts                     # Imports all domain index files
 ├── schemas/                    # SCHEMA DEFINITIONS
 │   ├── index.ts
 │   ├── profile.schema.ts
 │   └── test.schema.ts
 ├── parseObjects/               # STRONGLY TYPED OBJECTS
 │   ├── index.ts
 │   ├── profile.object.ts
 │   └── test.object.ts
 ├── test/                       # DOMAIN LOGIC: Test Class
 │   ├── beforeSave.ts           # Triggers for Test
 │   ├── testFunctionOne.ts      # ONE Cloud Function per file!
 │   └── index.ts                # Exports Test triggers and functions
 ├── profile/                    # DOMAIN LOGIC: Profile Class
 │   ├── beforeSave.ts           # Triggers for Profile
 │   ├── afterSave.ts
 │   ├── updateAvatar.ts         # ONE Cloud Function per file!
 │   └── index.ts                # Exports Profile triggers and functions
 ├── utils/                      # Shared utility functions (e.g., math, dates)
 ├── services/                   # Third-party logic (e.g., Stripe, AWS)
 └── migrations/                 # DEPLOYMENT SCRIPTS
```

### 🔗 The `index.ts` Wiring Patterns (Barrels)

To keep imports clean and migrations automated, we use `index.ts` files to act as "barrels" for each folder.

**1. Schemas (`src/cloud/schemas/index.ts`)**
This file exports individual schemas for typing, but _also_ exports an array of all schemas so the migration script can loop through them.

```typescript
import { ProfileSchema } from "./profile.schema";
import { TestSchema } from "./test.schema";

export { ProfileSchema, TestSchema };

export const schemaDefinitions: Parse.TypedRestSchema[] = [
  ProfileSchema,
  TestSchema,
];
```

**2. Parse Objects (`src/cloud/parseObjects/index.ts`)**
A simple barrel file so you can import all your strongly typed objects from one place.

```typescript
export * from "./profile.object";
export * from "./test.object";
```

**3. Domain Modules (`src/cloud/profile/index.ts`)**
This registers your triggers and functions with the Parse Server instance when `main.ts` imports the folder.

```typescript
import "./beforeSave";
import "./afterSave";
import "./updateAvatar";
```

---

## 🏗️ 7. Defining Schemas & CLPs (The Front Door)

**Never create a class from the client side or the dashboard.** Every new database table must have a schema definition file in `src/cloud/schemas/`.

This acts as our Infrastructure-as-Code. We use the `satisfies` operator to strictly type our schemas while preserving the exact string literals.

### Understanding Class Level Permissions (CLP)

CLPs act as the "Bouncer" to the entire table. Before the database even looks at row-level ACLs, it checks the CLP. Here is what every property does:

- **`get`**: Can a user fetch a specific object by its ID?
- **`find`**: Can a user run a query to return a list of objects?
- **`count`**: Can a user count the objects?
- **`create`**: Can a user create a new row?
- **`update` / `delete`**: Can a user modify or delete an existing row?
- **`addField`**: Can a user alter the schema dynamically? _(Always keep this locked down)._
- **`writeUserFields`**: Provide an array of Pointer column names (e.g., `["owner"]`). Parse automatically grants update/delete access to the specific user stored in that row's Pointer column.
- **`readUserFields`**: Automatically grants find/get access to the user in the Pointer column.
- **`protectedFields`**: Hide specific columns from certain users or the public.

**Example: `test.schema.ts`**

```typescript
export const TestSchema = {
  className: "Test",
  fields: {
    test: { type: "String" },
    owner: { type: "Pointer", targetClass: "_User" },
  },
  classLevelPermissions: {
    find: { requiresAuthentication: true },
    get: { requiresAuthentication: true },
    create: { requiresAuthentication: true },
    update: { "role:Admin": true },
    delete: { "role:Admin": true },
  },
} as const satisfies Parse.TypedRestSchema;
```

---

## 🧩 8. Creating Strongly-Typed Parse Objects (Repository Pattern)

By default, `Parse.Object` in JavaScript is completely untyped. By creating a subclass using our `AttributesFromSchema` utility, TypeScript will automatically map your Schema definition into a perfect Interface.

Furthermore, we use these classes as **Repositories**. By adding `static` methods, you encapsulate complex queries and creation logic directly within the object class, keeping your codebase clean and reusable.

```typescript
import { TestSchema } from "../schemas";

// Automatically extracts { test?: string, owner?: Parse.User }
export type ITestObjectAttributes = Parse.AttributesFromSchema<
  typeof TestSchema
>;

export class TestObject extends Parse.Object<ITestObjectAttributes> {
  constructor(attributes?: ITestObjectAttributes) {
    super(TestSchema.className, attributes as any);
  }

  // --- INSTANCE METHODS (Getters) ---
  getTest(): string | undefined {
    return this.get("test");
  }
  getOwner(): Parse.User | undefined {
    return this.get("owner");
  }

  // --- REPOSITORY METHODS (Static) ---
  static async findByOwner(user: Parse.User): Promise<TestObject[]> {
    const query = new Parse.Query(TestObject);
    query.equalTo("owner", user);
    return await query.find({ useMasterKey: true }); // Secure internal query
  }

  static async create(
    testString: string,
    owner: Parse.User,
  ): Promise<TestObject> {
    const testObj = new TestObject({ test: testString, owner });
    return await testObj.save(null, { useMasterKey: true });
  }
}

Parse.Object.registerSubclass(TestSchema.className, TestObject);
```

### 🛡️ Total Type Safety in Cloud Functions

Because we registered the subclass, you can now use both the **Static (Repository) Methods** and the **Instance Methods** inside your Cloud Functions with total type safety and flawless autocomplete!

```typescript
import { TestObject } from "../parseObjects";

Parse.Cloud.define(
  "getUserTests",
  async (request) => {
    const user = request.user!;

    // 1. Using the Static Repository Method safely
    const userTests = await TestObject.findByOwner(user);

    // 2. Using the Instance Methods safely
    return userTests.map((testObj) => {
      return {
        id: testObj.id,
        title: testObj.getTest(),
        ownerId: testObj.getOwner()?.id,
      };
    });
  },
  { requireUser: true },
);
```

---

## 🔒 9. Enforcing ACLs (The VIP List) via Triggers

**Never trust the client SDK to set access control.**
We allow the frontend SDK to create objects to move quickly, but we lock down the row-level security (ACLs) entirely in `src/cloud/<className>/beforeSave.ts`.

### Understanding Access Control Lists (ACL)

While CLPs protect the entire table, an ACL acts as a padlock on a single, specific row.

#### 1. Empty ACL: `new Parse.ACL()`

Starts completely empty. No one can read or write to it by default.

```typescript
const acl = new Parse.ACL();
acl.setPublicReadAccess(true); // Now the public can read it
acl.setRoleWriteAccess("Moderators", true); // Only Moderators can edit it
```

#### 2. User-Specific ACL: `new Parse.ACL(user)`

When you pass a user object into the constructor, Parse automatically runs `acl.setReadAccess(user, true)` and `acl.setWriteAccess(user, true)`. It instantly grants the owner full control.

### 🛡️ The Standard Cloud Trigger Pattern

For **all** Cloud Triggers (`beforeSave`, `afterSave`, `beforeDelete`, etc.), you must pass your strongly-typed class (e.g., `TestObject`) as both the generic type `<T>` and the first parameter. This guarantees flawless autocomplete on `request.object`.

```typescript
import { TestObject } from "../parseObjects";

// Notice <TestObject> and passing TestObject as the first argument!
Parse.Cloud.beforeSave<TestObject>(TestObject, async (request) => {
  const { object, user } = request;

  if (object.isNew()) {
    if (!user) {
      throw new Parse.Error(
        Parse.Error.SCRIPT_FAILED,
        "You must be logged in to create a Test object.",
      );
    }

    // Anti-Spoofing: Force the owner pointer to be the user making the request
    object.set("owner", user);

    // Enforce the ACL securely on the backend
    const acl = new Parse.ACL(user);
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(false);

    object.setACL(acl);
  }
});
```

---

## ⚙️ 10. Standardizing Cloud Functions & Validations

When you _do_ need a custom Cloud Function, **you must use built-in route validators.** Do not write manual `if (!request.params.myField)` checks inside the function body.

Parse allows you to pass a massive validation object as the third parameter to `Parse.Cloud.define()`.

### The Core Validation Properties

- **`requireMaster`**: Can _only_ be called if the Master Key is provided.
- **`requireUser`**: Rejects the request if no valid session token is provided.
- **`requireAnyUserRoles` / `requireAllUserRoles`**: Ensures the user belongs to specific Parse Roles.
- **`fields`**: Defines the exact shape, type, and rules of the parameters sent by the client. Includes `type`, `required`, `default`, `options`, and `error`.

### 🛡️ Type-Safe Request Parameters (The Standard Approach)

Always define an interface and cast `request.params` to it.

```typescript
interface IUpdateStatusParams {
  status: string;
  reason?: string;
}

Parse.Cloud.define(
  "updateUserStatus",
  async (request) => {
    const { status, reason } = request.params as IUpdateStatusParams;
    // Logic here...
  },
  {
    requireUser: true,
    fields: {
      status: { required: true, type: String, options: ["active", "inactive"] },
      // THE STANDARD: Use required: false alongside type: String
      reason: { required: false, type: String },
    },
  },
);
```

### ⚠️ The `null` vs `undefined` Trap in Validations

When defining optional fields, the difference between `undefined` and `null` can break your validation.

**Case 1: The Clean Frontend (Sending `undefined`)**
If the frontend sets a variable to `undefined`, `JSON.stringify` removes the key entirely before sending the request.
If your validator says `reason: { required: false, type: String }`, Parse correctly sees the key is missing, respects the flag, and passes validation perfectly.

**Case 2: The Defensive Backend (Handling Explicit `null`)**
Often, frontends explicitly send `null` when a field is empty (`{"status": "active", "reason": null}`).
If your validator relies on `type: String`, Parse sees the key exists, realizes `null` is an object (not a string), and **throws a validation error**.

**The Fix:** If you expect the frontend to send `null` values, you must remove the strict `type: String` check and handle validation manually using `options`:

```typescript
reason: {
  required: false,
  // Accept it if it's missing, explicitly null, OR a string
  options: (val) => val === undefined || val === null || typeof val === 'string',
  error: "Reason must be a string or omitted entirely."
}
```

---

## 🚀 11. Synchronizing & Deploying to Back4App

When a feature is complete, do not copy-paste code into the Back4App dashboard. Instead, we use a deployment script to compile our strict TypeScript into clean JavaScript and securely upload it.

### 🧹 Pre-Deployment Cleanup (Important!)

Before executing your deployment script, ensure you have completed the following:

1. **Remove Demo Code:** Delete `test.schema.ts`, `test.object.ts`, and the `src/cloud/test/` directory. Be sure to remove their exports from the respective barrel files.
2. **Bump the Version:** Update the `"version"` field in your `package.json` to reflect the new release.
3. **Update the Changelog:** Add an entry to your `CHANGELOG.md` detailing the new features, bug fixes, or schema changes included in this deployment.

### The Base `deploy.sh` Script

This is the standard deployment script. It builds the code, extracts the production dependencies, and deploys it to Back4App.

#### ⚠️ Critical Configuration Warnings for Deployment

When copying this script into a new project, you **must** update the `<PLACEHOLDER>` values, or you will accidentally deploy code to the wrong database:

- **`link`**: Must be the exact App Name you created in Back4App (e.g., `"my-awesome-app"`).
- **`applicationId`**: Replace with the specific Application ID found in your Back4App Security & Keys settings.
- **Email:** Leave `info@cyberneid.com` as is, since we use a shared account for our projects.

```bash
#!/bin/bash
set -e

# Remove old dist
rm -rf dist/

# Build TypeScript (Using PNPM)
pnpm run build

# Ensure public folder exists
mkdir -p ./dist/public

# Create minimal package.json with only dependencies
jq '{dependencies: .dependencies}' package.json > ./dist/cloud/package.json

# Create .parse.local file
cat > ./dist/.parse.local <<EOL
{
  "applications": {
    "_default": {
      "link": "<YOUR_APP_NAME>"
    },
    "<YOUR_APP_NAME>": {
      "applicationId": "<YOUR_APP_ID>"
    }
  }
}
EOL

# Create .parse.project file
cat > ./dist/.parse.project <<EOL
{
  "project_type": 1,
  "parse": {
    "jssdk": "2.2.25"
  },
  "email": "info@cyberneid.com"
}
EOL

# Change to dist folder
cd dist

# Deploy
b4a deploy
```

### Customizing the Deploy Script

This base script can be modified according to your needs. For example, if you need to deploy static assets, email templates, or private JSON keys (like a Firebase FCM Service Account), you simply add `cp` (copy) commands to ensure those files make it into the final `/dist` folder before the script pushes to Back4App.

```bash
#!/bin/bash
set -e

# Remove old dist
rm -rf dist/

# Build TypeScript (Using PNPM)
pnpm run build

# Ensure public folder exists
mkdir -p ./dist/public

# Copy custom cloud assets (e.g., email templates, images)
mkdir -p ./dist/cloud
cp -r ./cloud/assets ./dist/cloud

# Copy private keys (e.g., Firebase FCM service key)
mkdir -p ./dist/cloud/fcm
cp ./cloud/fcm/<YOUR_FCM_KEY_FILE>.json ./dist/cloud/fcm/

# Create minimal package.json with only production dependencies
jq '{dependencies: .dependencies}' package.json > ./dist/cloud/package.json

# Create .parse.local
cat > ./dist/.parse.local <<EOL
{
  "applications": {
    "_default": {
      "link": "<YOUR_APP_NAME>"
    },
    "<YOUR_APP_NAME>": {
      "applicationId": "<YOUR_APP_ID>"
    }
  }
}
EOL

# Create .parse.project
cat > ./dist/.parse.project <<EOL
{
  "project_type": 1,
  "parse": {
    "jssdk": "2.2.25"
  },
  "email": "info@cyberneid.com"
}
EOL

# Deploy to Back4App
cd dist
b4a deploy
```

---

### Running the Migration via API Console

Once your code is successfully deployed via the script, you must run the `dbMigrate` Cloud Function on the Production server. This loops through our schemas and syncs the Back4App database to match our local architecture.

_Tip:_ Trigger this directly from the **Back4App API Console** in your browser. Set the endpoint to `POST /functions/dbMigrate`, ensure the **Master Key** is checked, and hit "Send Query"!

#### The Base `dbMigrate` Script

This is the standard migration script. It automatically loops through the schemas you defined in code and updates the database to match.

```typescript
import { schemaDefinitions } from "../schemas";
import { createClassFromRestSchema } from "./createClassFromRestSchema";

Parse.Cloud.define(
  "dbMigrate",
  async () => {
    const createClassFromSchemaPromises: Promise<void>[] = [];

    schemaDefinitions.forEach((schemaDefinition) => {
      createClassFromSchemaPromises.push(
        createClassFromRestSchema(schemaDefinition),
      );
    });

    await Promise.all(createClassFromSchemaPromises);
  },
  {
    requireMaster: true,
    validateMasterKey: true,
  },
);
```

#### Customizing the `dbMigrate` Script (Modifying Internal Parse Classes)

Our migration script handles all custom classes automatically. However, Parse Server has internal private classes (like `_User`, `_Role`, `_Installation`).

**Best Practice:** It is highly recommended to leave the `_User` class primarily for authentication purposes. For all other user-related data (like `firstName`, `bio`), create a separate `Profile` class with a pointer to the `_User`.

If you absolutely _must_ add a specific field to a private class (for example, push notification tokens on the `_User`), append it at the end of the `dbMigrate` script like this:

```typescript
import { schemaDefinitions } from "../schemas";
import { createClassFromRestSchema } from "./createClassFromRestSchema";

Parse.Cloud.define(
  "dbMigrate",
  async () => {
    // 1. Run migrations for all our custom defined schemas
    const createClassFromSchemaPromises: Promise<void>[] = [];

    schemaDefinitions.forEach((schemaDefinition) => {
      createClassFromSchemaPromises.push(
        createClassFromRestSchema(schemaDefinition),
      );
    });

    await Promise.all(createClassFromSchemaPromises);

    // 2. Safely update internal Parse private classes (e.g., _User)
    const existing = await new Parse.Schema("_User").get();
    const userSchema = new Parse.Schema("_User");

    // Check if the field exists before adding it to avoid errors
    if (!existing.fields.notificationTokens) {
      userSchema.addArray("notificationTokens", { defaultValue: [] });
    }
    await userSchema.update();
  },
  {
    requireMaster: true,
    validateMasterKey: true,
  },
);
```
