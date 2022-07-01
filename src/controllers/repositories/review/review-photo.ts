import {OkPacket} from 'mysql';
import {IReviewPhotoBaseRepository, ReviewPhotoBaseRepository} from '@controllers/repositories/review/review-photo.base';
import {AddReviewEventRequestParam, ModReviewEventRequestParam} from '@services/review-event.entity';

export interface IReviewPhotoRepository extends IReviewPhotoBaseRepository {
    add(vendor: any): Promise<OkPacket[]>;
    modify(vendor: any): Promise<OkPacket[] | undefined>;
}

export class ReviewPhotoRepository extends ReviewPhotoBaseRepository implements IReviewPhotoRepository {
    constructor() {
        super();
    }
    add = async (param: AddReviewEventRequestParam) => {
        const {attachedPhotoIds, reviewId} = param;
        return Promise.all(attachedPhotoIds.map((photoId) => this.insert({reviewId, photoId})));
    };

    modify = async (param: ModReviewEventRequestParam) => {
        const {attachedPhotoIds, reviewId} = param;
        if (!attachedPhotoIds) {
            return;
        }
        await this.remove({reviewId});
        return await Promise.all(attachedPhotoIds.map((photoId) => this.insert({reviewId, photoId})));
    };
}
