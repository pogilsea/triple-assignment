import {
    IReviewPhotoRepository,
    IReviewPointHistoryRepository,
    IReviewRepository,
    ReviewPhotoRepository,
    ReviewPointHistoryRepository,
    ReviewRepository,
} from '@controllers/repositories/review';
import {IPlaceRepository, PlaceRepository} from '@controllers/repositories/place';
import {IUserRepository, UserRepository} from '@controllers/repositories/user';
import {IReviewEventService, ReviewEventService} from '@services/review-event';
import {IReviewEventServiceHelper, ReviewEventServiceHelper} from '@services/review-event.helper';
import {v4 as uuidv4} from 'uuid';

export interface IReviewEventBaseTestHelper {
    removeReviewEvent(reviewId: string): Promise<void>;
    removePlace(placeId: string): Promise<void>;
    setFirstReviewByPlace(placeId: string): Promise<void>;
    removeUser(userId: string): Promise<void>;
    addNewUser(userId: string): Promise<void>;
    addNewPlace(placeId: string): Promise<void>;
}

export class ReviewEventTestHelper implements IReviewEventBaseTestHelper {
    reviewRepo: IReviewRepository;
    reviewPhotoRepo: IReviewPhotoRepository;
    reviewPointHistoryRepo: IReviewPointHistoryRepository;
    placeRepo: IPlaceRepository;
    userRepo: IUserRepository;
    helper: IReviewEventServiceHelper;
    service: IReviewEventService;
    constructor() {
        this.reviewRepo = new ReviewRepository();
        this.reviewPhotoRepo = new ReviewPhotoRepository();
        this.reviewPointHistoryRepo = new ReviewPointHistoryRepository();
        this.placeRepo = new PlaceRepository();
        this.userRepo = new UserRepository();
        this.helper = new ReviewEventServiceHelper();
        this.service = new ReviewEventService();
    }
    async removeReviewEvent(userId: string): Promise<void> {
        await this.reviewPointHistoryRepo.remove({userId});
        await this.reviewRepo.remove({userId});
    }
    async removePlace(placeId: string): Promise<void> {
        await this.placeRepo.remove({placeId});
    }
    async removeUser(userId: string): Promise<void> {
        await this.userRepo.remove({userId});
    }
    async setFirstReviewByPlace(placeId: string): Promise<void> {
        const userId = uuidv4();
        const reviewId = uuidv4();
        await this.addNewPlace(placeId);
        await this.userRepo.insert({userId, totalPoint: 1}, ['totalPoint']);
        await this.reviewRepo.insert({userId, reviewId, placeId, content: 'first review on this place'});
    }
    async addNewUser(userId: string): Promise<void> {
        await this.userRepo.insert({userId, totalPoint: 0}, ['totalPoint']);
    }
    async addNewPlace(placeId: string): Promise<void> {
        await this.placeRepo.insert({placeId});
    }
}
