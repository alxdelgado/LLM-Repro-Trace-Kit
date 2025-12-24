// Wire DB init into startup
// 1. Import initDb from storage.ts
// 2. Call initDb() once on startup
// -- right after creating the Fastify app, but before starting to listen
// 3. If init fails, log error and exit process (so you don't run a broken server)
import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import registerRoutes from "./routes.js";
import { getDBConnection } from "./storage.js";

// Initialize the database connection
try {
    getDBConnection();
    console.log("Database initilized successfully.");
} catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
}

// Import dependencies and create Fastify app
const app = Fastify({ logger: true });
registerRoutes(app);

const startServer = async () => {
    try {
        await app.listen({ port: parseInt(process.env.PORT || "8000"), host: process.env.HOST || "0.0.0.0" });
        console.log("Server is running...");
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

startServer();