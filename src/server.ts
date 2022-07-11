import express, { Request, Response } from 'express';
import 'express-async-errors';
import "./repos/firmShares";
import { FirmSharesJsonDb } from './repos/firmShares';
import { MockBroker } from './services/broker-mock';
import { UserRepo } from '@repos/user-repo';
import { App, ClaimFreeShareResult } from './app';

const app = express();

/***********************************************************************************
 *                                  Middlewares
 **********************************************************************************/

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Manual dependency injection, for now.
const firmShares = new FirmSharesJsonDb();
const broker = new MockBroker();
const usersRepo = new UserRepo();
const prodApp = new App(firmShares, broker, usersRepo);

// Clear any shares from previous session to get mockBroker and DB back in sync.
firmShares.devOnlyClearShares();

app.post("/claim-free-share", async (req: Request, res: Response) => {
    // Normally, the user would come from an Auth middleware
    const userId: string = req.body["userId"];
    console.log("User id: ", userId);
    const promise = prodApp.claimFreeShare(userId);
    const result = await promise;
    console.log("Result: ", result);
    switch (result.result) {
        case "user_not_found":
            res.sendStatus(404); // Or something appropriate to the Auth flows
            break;
        case "no_shares_available":
            res.setHeader("Retry-After", result.retryAfter)
            res.sendStatus(503);
            break;
        case "unhandled_error":
            res.sendStatus(500);
            break;
        case "ok":
            res.sendStatus(200);
            break;
    }
});

export default app;
