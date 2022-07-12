import sqlite3, { Database } from "sqlite3";
const sqlv = sqlite3.verbose();

export function createMockDb(): Promise<Database> {
    return new Promise((resolve) => {
        const db = new sqlv.Database(":memory:");
        db.serialize(() => {
            db.run("CREATE TABLE share (symbol VARCHAR(10))");
            db.run("CREATE TABLE user (id VARCHAR(25) PRIMARY KEY, brokerAccount TEXT, claims INTEGER)");

            const userStmt = db.prepare("INSERT INTO user VALUES (?, ?, ?)");
            userStmt.run("someUser", "broker1", 5);
            userStmt.run("someOtherUser", "broker2", 1);
            userStmt.finalize();

            const shareStmt = db.prepare("INSERT INTO share VALUES (?)");
            for (let i = 0; i < 5; i++) {
                shareStmt.run("msft");
            }
            shareStmt.finalize();

            resolve(db);
        });
    });
}