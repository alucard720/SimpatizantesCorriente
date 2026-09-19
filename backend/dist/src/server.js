import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./lib/db.js";
await db.$connect();
const server = app.listen(env.PORT, () => console.log(`API escuchando en puerto ${env.PORT}`));
for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => {
        server.close(() => {
            void db.$disconnect().then(() => process.exit(0));
        });
        setTimeout(() => process.exit(1), 10000).unref();
    });
