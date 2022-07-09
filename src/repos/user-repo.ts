import { IUser } from '@models/user-model';
import { randomUUID } from 'crypto';
import orm from './mock-orm';


export default class UserRepo {
    async decrementShareClaims(userId: number): Promise<void> {
        // TODO
    }
    /**
     * Get one user.
     * 
     * @param email 
     * @returns 
     */
    async getById(userId: string): Promise<IUser | null> {
        const db = await orm.openDb();
        return (db.users as IUser[]).
            find(u => u.id === userId) || null;
    }
}
