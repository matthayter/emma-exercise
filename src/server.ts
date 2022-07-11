import express, { Request, Response } from 'express';
import 'express-async-errors';
import "./repos/firmShares";
import { FirmSharesJsonDb } from './repos/firmShares';
import { MockBroker } from './services/broker-mock';
import { UserRepo } from '@repos/user-repo';
import { App, ClaimFreeShareResult } from './app';
import { env } from 'process';
import { SharePurchaser } from '@services/share-purchaser';
import config from './config';

const app = express();

/***********************************************************************************
 *                                  Middlewares
 **********************************************************************************/

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Manual dependency injection
const firmShares = new FirmSharesJsonDb();
const broker = new MockBroker();
const usersRepo = new UserRepo();
const prodApp = new App(firmShares, broker, usersRepo);

// Clear any shares from previous session to get mockBroker and DB back in sync for this mock demo.
firmShares.devOnlyClearShares();

// Async handler note: current version of express doesn't show any failed
// promise errors; coming in the next version.
app.post("/claim-free-share", async (req: Request, res: Response) => {
    // Normally, the user would come from an Auth middleware
    const userId: string = req.body["userId"];
    const result = await prodApp.claimFreeShare(userId);
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

if (process.env.NODE_ENV === "development") {
    const sharePurchaser = new SharePurchaser(config, broker, firmShares);
    // Handy for playing around in development. Not needed if your tests work properly!
    // In prod, this would be run via a cronjob or similar on a single host.
    app.post("/check-and-buy-shares", async (req: Request, res: Response) => {
        try {
            await sharePurchaser.checkAndBuy();
        } catch (e) {console.error(e)}
        res.sendStatus(200);
    })
}

export default app;
