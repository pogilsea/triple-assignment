import 'module-alias/register';
import express, {Express, NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import {resolve} from 'path';
import {ReviewEventRouteHandler} from '@routes/review-events';
import createError from 'http-errors';
import errorHandler from 'errorhandler';
import bodyParser = require('body-parser');

dotenv.config({path: resolve(process.env.NODE_PATH || '.', '.env')});

const app: Express = express();
const port = process.env.PORT || 3000;
app.set('port', port);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use([new ReviewEventRouteHandler().router]);
app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Node API Server');
});

// catch 404 and forward to error handler
app.use(function (req: express.Request, res: express.Response, next: express.NextFunction) {
    console.log('req.path', req.path);
    next(createError(404));
});

// error handler
app.use(function (err: any, req: express.Request, res: express.Response, next: NextFunction) {
    // set locals, only providing error in development
    const {status, message, ...error} = err;
    res.locals.message = message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    const errorStatus = err.status || 500;
    res.status(errorStatus);
    res.send({responseCode: err.errorCode || errorStatus, resultMessage: message, error});
});
app.use(errorHandler());
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    console.log(`서버 시작 시간: ${new Date().toLocaleString('ko-KR')}`);
});

export default app;
