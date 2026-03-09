import { schemaDefinitions } from "./cloud/schemas";

export const config = {
  databaseURI: process.env.DATABASE_URI,
  cloud: "./src/cloud/main.ts",
  appId: process.env.APP_ID!,
  masterKey: process.env.MASTER_KEY!,
  serverURL: process.env.SERVER_URL!,
  publicServerURL: process.env.SERVER_URL!,
  restAPIKey: process.env.REST_API_KEY!,
  maintenanceKey: process.env.MAINTENANCE_KEY!,
  allowHeaders: [
    "X-Parse-Installation-Id",
    "X-Parse-Client-Key",
    "X-Parse-REST-API-Key",
    "X-Parse-Master-Key",
    "Content-Type",
    "Accept",
  ],
  allowOrigin: ["*"],
  masterKeyIps: ["0.0.0.0/0", "::/0"],
  verbose: false,
  silent: false,
  enableAnonymousUsers: true,
  schema: {
    definitions: schemaDefinitions,
    lockSchemas: true,
    strict: true,
    recreateModifiedFields: false,
    deleteExtraFields: false,
  },
};
