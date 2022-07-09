import supertest from 'supertest';
import StatusCodes from 'http-status-codes';
import { SuperTest, Test, Response } from 'supertest';

import app from '@server';
import userRepo from '@repos/user-repo';
import { IUser } from '@models/user-model';
import { pErr } from '@shared/functions';
// import { p as userPaths } from '@routes/user-router';
import { ParamMissingError, UserNotFoundError } from '@shared/errors';

type TReqBody = string | object | undefined;


