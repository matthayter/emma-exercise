// import cookieParser from 'cookie-parser';
// import morgan from 'morgan';
import path from 'path';
// import helmet from 'helmet';

import express, { NextFunction, Request, Response } from 'express';
// import StatusCodes from 'http-status-codes';
import 'express-async-errors';
import "./repos/firmShares";
import {DbFirmShares, MockFirmShares} from './repos/firmShares';
import { MockBroker } from './services/broker-mock';
import UserRepo from '@repos/user-repo';
import "./services/broker-mock";
import { App } from './app';

// import apiRouter from './routes/api';
// import logger from 'jet-logger';
// import { CustomError } from '@shared/errors';


// Constants
const app = express();


/***********************************************************************************
 *                                  Middlewares
 **********************************************************************************/

// Common middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// app.use(cookieParser());

// Show routes called in console during development
// if (process.env.NODE_ENV === 'development') {
//     app.use(morgan('dev'));
// }

// Security (helmet recommended in express docs)
// if (process.env.NODE_ENV === 'production') {
//     app.use(helmet());
// }

// Production dependencies.
const firmShares = new DbFirmShares();
const broker = new MockBroker();
const usersRepo = new UserRepo();
const prodApp = new App(firmShares, broker, usersRepo);

app.post("/claim-free-share", async (req: Request, res: Response) => {
    // Normally, the user would come from an Auth middleware
    const userId: string = req.body["userId"];
    const result = await prodApp.claimFreeShare(userId);
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

// Export here and start in a diff file (for testing).
export default app;
