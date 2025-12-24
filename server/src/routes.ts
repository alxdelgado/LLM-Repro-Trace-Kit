// src/routes.ts 
// This file defines the routes for the server application.

export default function registerRoutes(app: any) {
    app.get("/healthz", async (request: any, reply: any) => {
        reply.send({
            ok: true,
            service: "llm-repro-trace-kit",
            version: "0.1.0"
        });
    });
}
    