import {IReviewPhotoRepository, ReviewPhotoRepository} from '@controllers/repositories/review/review-photo';
import {
    AddReviewEventRequestParam,
    DeleteReviewEventRequestParam,
    ModReviewEventRequestParam,
    PointType,
} from '@services/review-event.entity';
import {IReviewEventServiceHelper, ReviewEventServiceHelper} from '@services/review-event.helper';
import {IReviewRepository, ReviewRepository} from '@controllers/repositories/review/review';
import {
    IReviewPointHistoryBaseRepository,
    ReviewPointHistoryBaseRepository,
} from '@controllers/repositories/review/review-point-history.base';
import {IUserRepository, UserRepository} from '@controllers/repositories/user';

export interface IReviewPointHistoryRepository extends IReviewPointHistoryBaseRepository {
    add(param: AddReviewEventRequestParam): Promise<number>;
    modify(param: ModReviewEventRequestParam): Promise<number>;
    deleteReview(param: DeleteReviewEventRequestParam): Promise<number>;
    readPoints(userId: string): Promise<any>;
}

export class ReviewPointHistoryRepository extends ReviewPointHistoryBaseRepository implements IReviewPointHistoryRepository {
    helper: IReviewEventServiceHelper;
    userRepo: IUserRepository;
    reviewRepository: IReviewRepository;
    reviewPhotoRepository: IReviewPhotoRepository;
    constructor() {
        super();
        this.helper = new ReviewEventServiceHelper();
        this.userRepo = new UserRepository();
        this.reviewRepository = new ReviewRepository();
        this.reviewPhotoRepository = new ReviewPhotoRepository();
    }
    add = async (param: AddReviewEventRequestParam) => {
        const {userId, reviewId, placeId, attachedPhotoIds} = param;
        const createdAt = new Date().toISOString();
        const points: PointParam[] = [{point: 1, operator: 'plus', type: 'review', memo: '리뷰 작성'}];
        const photoReward = this.getNewPhotoReviewReward(attachedPhotoIds);
        if (photoReward) {
            points.push(photoReward);
        }
        const placeReward = await this.getNewPlaceReviewReward(placeId);
        if (placeReward) {
            points.push(placeReward);
        }
        await Promise.all(points.map((point) => this.insert({...point, userId, reviewId, createdAt})));
        return this.helper.calculateReviewPoint(points);
    };
    modify = async (param: ModReviewEventRequestParam) => {
        const {userId, reviewId, attachedPhotoIds} = param;
        const createdAt = new Date().toISOString();
        const photoReward = await this.getUpdatePhotoReviewReward(reviewId, attachedPhotoIds);
        if (!photoReward) {
            return 0;
        }
        await this.insert({...photoReward, userId, reviewId, createdAt});
        return this.helper.calculateReviewPoint([photoReward]);
    };
    deleteReview = async (param: DeleteReviewEventRequestParam) => {
        const {userId, reviewId} = param;
        const createdAt = new Date().toISOString();
        const points: PointParam[] = [{point: 1, operator: 'minus', type: 'review', memo: '리뷰 삭제'}];
        const photoReward = await this.getDeletePhotoReviewReward(reviewId);
        if (photoReward) {
            points.push(photoReward);
        }
        const placeReward = await this.getDeletePlaceReviewReward(reviewId);
        if (placeReward) {
            points.push(placeReward);
        }
        await Promise.all(points.map((point) => this.insert({...point, userId, reviewId, createdAt})));
        return this.helper.calculateReviewPoint(points);
    };

    async readPoints(userId: string): Promise<any> {
        const fields = ['id', 'reviewId', 'point', 'operator', 'memo', 'createdAt', 'type'];
        const pointsRes = await this.read({userId}, {fields});
        const user = await this.userRepo.readOne({userId});
        const points = pointsRes.map((point) => {
            const {userId, ...data} = point;
            return data;
        });
        return {...user, points};
    }

    private getNewPhotoReviewReward(photoIds: string[]): PointParam | undefined {
        if (!this.helper.isAddingPhotos(photoIds)) {
            return;
        }
        let point = 1;
        let operator: 'plus' | 'minus' = 'plus';
        let type: PointType = 'photo_review';
        let memo = '사진 리뷰 작성';
        return {point, operator, type, memo};
    }

    private async getUpdatePhotoReviewReward(reviewId: string, photoIds?: string[]): Promise<PointParam | undefined> {
        const previousPhotoCount = await this.reviewPhotoRepository.count({reviewId});
        // 기존에 사진 X , 사진 추가 O
        let type: PointType = 'photo_review';
        let point = 1;
        if (!this.helper.hasPreviouslyAddedPhotos(previousPhotoCount) && this.helper.isAddingPhotos(photoIds)) {
            let operator: 'plus' | 'minus' = 'plus';
            let memo = '사진 리뷰 작성';
            return {point, operator, type, memo};
        }
        // 기존에 사진 사진 O, 사진 추가 X
        if (this.helper.hasPreviouslyAddedPhotos(previousPhotoCount) && !this.helper.isAddingPhotos(photoIds)) {
            let point = 1;
            let operator: 'plus' | 'minus' = 'minus';
            let memo = '사진 리뷰 삭제';
            return {point, operator, type, memo};
        }
        // 후기 사진 변동 없음
        // Case1: 기존에 사진 X , 사진 추가 X
        // Case2: 기존에 사진 O , 사진 추가 O
        return;
    }
    private async getNewPlaceReviewReward(placeId: string): Promise<PointParam | undefined> {
        const count = await this.reviewRepository.count({placeId});
        if (!this.helper.isFirstPlaceReview(count)) {
            return;
        }
        let point = 1;
        let operator: 'plus' | 'minus' = 'plus';
        let type: PointType = 'first_place_review';
        let memo = '여행지 첫 리뷰 작성';
        return {point, operator, memo, type};
    }
    private async getDeletePhotoReviewReward(reviewId: string): Promise<PointParam | undefined> {
        const previousPhotoCount = await this.reviewPhotoRepository.count({reviewId});
        // 기존에 사진 X
        if (!this.helper.hasPreviouslyAddedPhotos(previousPhotoCount)) {
            return;
        }
        let point = 1;
        let operator: 'plus' | 'minus' = 'minus';
        let type: PointType = 'photo_review';
        let memo = '사진 리뷰 삭제';
        return {point, operator, type, memo};
    }
    private async getDeletePlaceReviewReward(reviewId: string): Promise<PointParam | undefined> {
        const count = await this.count({reviewId, type: 'first_place_review'});
        if (!this.helper.hasFirstPlaceReviewRewarded(count)) {
            return;
        }
        let point = 1;
        let operator: 'plus' | 'minus' = 'minus';
        let type: PointType = 'first_place_review';
        let memo = '여행지 첫 리뷰 삭제';
        return {point, operator, memo, type};
    }
}
type PointParam = {
    point: number;
    type: PointType;
    memo: string;
    operator: 'plus' | 'minus';
};
