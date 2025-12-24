import Fastify from "fastify";
import registerRoutes from "./routes";

const app = Fastify({ logger: true });
registerRoutes(app);

const startServer = async () => {
    try {
        await app.listen({ port: process.env.PORT || 8000, host: process.env.HOST || "0.0.0.0" });
        console.log("Server is running...");
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

startServer();