import express, { Application } from "express";
import path from "node:path";
import ParseDashboard from "parse-dashboard";
import { ParseServer } from "parse-server";
import { config } from "./config";

const app: Application = express();
const port = process.env.PORT;

app.use("/public", express.static(path.join(__dirname, "/public")));

async function startServer() {
  try {
    const parseServer = new ParseServer(config);
    await parseServer.start();

    const dashboard = new ParseDashboard(
      {
        apps: [
          {
            appId: process.env.APP_ID!,
            appName: process.env.APP_NAME!,
            masterKey: process.env.MASTER_KEY!,
            restKey: process.env.REST_API_KEY!,
            serverURL: process.env.SERVER_URL!,
          },
        ],
        users: [
          {
            user: "admin",
            pass: "admin",
          },
        ],
        trustProxy: 1,
      },
      { allowInsecureHTTP: true },
    );

    app.use("/parse", parseServer.app);
    app.use("/dashboard", dashboard);

    app.listen(port, () => {
      console.log(
        `🚀 Mobile App Endpoint (SERVER_URL): ${process.env.SERVER_URL}`,
      );
      console.log(
        `📊 Parse Dashboard (Browser access):  http://localhost:${port}/dashboard`,
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
