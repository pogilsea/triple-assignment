import createError from 'http-errors';
import {NextFunction, Router} from 'express';

export class BaseRouteHandler {
    public router: Router;
    constructor() {
        this.router = Router();
    }

    errorHandler = (err: any, next: NextFunction) => {
        console.log('err', err);
        const message = '[Error] 서버정애발생!';
        return next(
            createError(err.status || 500, err.message || message, {
                ...err,
                reason: err.reason || err.message,
            }),
        );
    };
}
