import {NextFunction, Request, Response} from 'express';
import {BaseRouteHandler} from '@controllers/utils/base-route';
import {IReviewEventService, ReviewEventService} from '@services/review-event';
import {ActionType} from '@services/review-event.entity';
import createError from 'http-errors';

interface IEventRouteHandler {
    event(req: Request, res: Response, next: NextFunction): void;
    getPoints(req: Request, res: Response, next: NextFunction): void;
}

export class ReviewEventRouteHandler extends BaseRouteHandler implements IEventRouteHandler {
    service: IReviewEventService;
    constructor() {
        super();
        this.service = new ReviewEventService();
        this.setRouterPath();
    }
    private setRouterPath = () => {
        this.router.post('/events', this.event.bind(this));
        this.router.get('/events/:userId', this.getPoints.bind(this));
    };

    // 리뷰 작성 이벤트
    async event(req: Request, res: Response, next: NextFunction) {
        try {
            const param = req.body;
            console.log('request param', param);
            const eventType = param.action as ActionType;
            switch (eventType) {
                case 'ADD':
                    await this.service.add(param);
                    break;
                case 'MOD':
                    await this.service.modify(param);
                    break;
                case 'DELETE':
                    await this.service.delete(param);
                    break;
                default:
                    const message = '지정된 리뷰 액션 값을 입력해주세요(allowed values: ["ADD","MOD","DELETE"])';
                    return next(createError(400, message, {reason: {param}}));
            }
            // HTTP 응답값 처리
            return res.send({responseCode: 200, resultMessage: 'Success'});
        } catch (err) {
            return this.errorHandler(err, next);
        }
    }
    // 포인트 조회
    async getPoints(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.userId;
            console.log('get userId', userId);
            const data = await this.service.read(userId);
            console.log('get points', data);
            return res.send({responseCode: 200, resultMessage: 'Success', data});
        } catch (err) {
            this.errorHandler(err, next);
        }
    }
}
