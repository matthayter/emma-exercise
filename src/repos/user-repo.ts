import { IUser } from '@models/user-model';
import { Database } from 'sqlite3';

export class UserRepo {
    constructor(private db: Database) {}
    decrementShareClaims(userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run("UPDATE user SET claims = claims - 1 WHERE id = ? AND claims > 0", userId, (err) => {
                if (err !== null) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    getById(userId: string): Promise<IUser | null> {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT user SET claims = claims - 1 WHERE id = ?", userId, (err, row) => {
                if (err !== null) {
                    reject(err);
                } else {
                    if (!row) { resolve(null); return; }
                    resolve({
                        id: row.id,
                        brokerAccountId: row.brokerAccount,
                        claims: row.claims,
                    });
                }
            });
        });
    }
}
