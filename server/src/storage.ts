// 1. Import dependencies
// - Import SQLite library (better-sqlite3)
// - Import Node helpers for file paths (so DB file ends up in a predictable location
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import os from "os"; 
import fs from "fs";

// 2. Choose a DB file path
// - Use filename like 'debug_bundles.sqlite3
// - Decide where it lives (e.g. store in server root (so it's next to package.json))
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, "..", "debug_bundles.sqlite3");

// 3. Create a single DB connection
// - Build a function that returns the db connection
// -- if db already exists , return it
// -- otherwise open it and store it for future use
let dbInstance: Database.Database | null = null;

export function getDBConnection(): Database.Database {
    if (dbInstance) {
        return dbInstance;
    } else {
        // Ensure the directory exists
        const dir = path.dirname(dbFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        dbInstance = new Database(dbFilePath);
        initializeDatabase(dbInstance);
        return dbInstance; 
    }
}

// 4. Create initDb()
// -- Call "get DB Connection"
// -- Execute a 'CREATE TABLE IF NOT EXISITS' statement for bundles table
// --- id: text primary key
// --- createdATMs: integer not null
// --- payload_json: text not null
export function initializeDatabase(db: Database.Database) {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS debug_bundles (
            id TEXT PRIMARY KEY,
            createdAtMs INTEGER NOT NULL,
            payload_json TEXT NOT NULL
        )
    `;
    db.exec(createTableSQL);
}

// 5. Create `saveDebugBundle(bundle: DebugBundle)`
// -- Convert bundle object to JSON string
// -- Insert row into bundles table
// --- store `create_at_ms` seperately, AND store full JSON
import { DebugBundle } from "./types.js";

export function saveDebugBundle(bundle: DebugBundle) {
    const db = getDBConnection();
    const insertSQL = `
        INSERT INTO debug_bundles(id, createdAtMs, payload_json)
        VALUES(?, ?, ?)
        `;
        const payloadJson = JSON.stringify(bundle);
        const stmt = db.prepare(insertSQL);
        stmt.run(bundle.id, bundle.createdAtMs, payloadJson);
}

// 6. Create `getBundle(id: string)
// -- Query by `id`
// -- If row not found, return null
// -- Parse JSON payload into object and return it
// -- Export these functions (initDB, saveBundle, getBundle)
export function getDebugBundle(id: string): DebugBundle | null {
    const db = getDBConnection();
    const selectSQL = `
        SELECT payload_json FROM debug_bundles WHERE id = ?`;
        const stmt = db.prepare(selectSQL);
        const row = stmt.get(id) as { payload_json: string } | undefined;  
        if (!row) {
            return null;
        } else {
            const bundle: DebugBundle = JSON.parse(row.payload_json);
            return bundle;
        }
}



