import {IReviewBaseRepository, ReviewBaseRepository} from '@controllers/repositories/review/review.base';
import {AddReviewEventRequestParam, ModReviewEventRequestParam} from '@services/review-event.entity';
import {OkPacket} from 'mysql';

export interface IReviewRepository extends IReviewBaseRepository {
    add(param: AddReviewEventRequestParam): Promise<OkPacket>;
    modify(param: ModReviewEventRequestParam): Promise<OkPacket>;
}

export class ReviewRepository extends ReviewBaseRepository implements IReviewRepository {
    constructor() {
        super();
    }
    async add(param: AddReviewEventRequestParam) {
        const {placeId, userId, reviewId, content} = param;
        const createdAt = new Date().toISOString();
        return this.insert({placeId, userId, reviewId, content, createdAt});
    }
    async modify(param: ModReviewEventRequestParam) {
        const {reviewId, content} = param;
        return this.updateOne({reviewId}, {content});
    }
}
