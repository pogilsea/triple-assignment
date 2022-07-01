import {
    ReviewEventResponse,
    AddReviewEventRequestParam,
    ModReviewEventRequestParam,
    DeleteReviewEventRequestParam,
} from '@services/review-event.entity';
import {
    IReviewPhotoRepository,
    IReviewPointHistoryRepository,
    IReviewRepository,
    ReviewPhotoRepository,
    ReviewPointHistoryRepository,
    ReviewRepository,
} from '@controllers/repositories/review';
import {IReviewEventValidator, ReviewEventValidator} from '@controllers/validator';
import {IUserRepository, UserRepository} from '@controllers/repositories/user';

export interface IReviewEventService {
    add(param: AddReviewEventRequestParam): Promise<void>;
    read(param: string): Promise<ReviewEventResponse[]>;
    modify(param: ModReviewEventRequestParam): Promise<void>;
    delete(param: DeleteReviewEventRequestParam): Promise<void>;
}

export class ReviewEventService implements IReviewEventService {
    private validator: IReviewEventValidator;
    private userRepository: IUserRepository;
    private reviewRepository: IReviewRepository;
    private reviewPhotoRepository: IReviewPhotoRepository;
    private reviewPointHistoryRepository: IReviewPointHistoryRepository;
    constructor() {
        this.validator = new ReviewEventValidator();
        this.userRepository = new UserRepository();
        this.reviewRepository = new ReviewRepository();
        this.reviewPhotoRepository = new ReviewPhotoRepository();
        this.reviewPointHistoryRepository = new ReviewPointHistoryRepository();
    }
    async add(param: AddReviewEventRequestParam) {
        const {userId} = param;
        // parameter validation
        await this.validator.add(param);
        // 리뷰 저장
        await this.reviewRepository.add(param);
        // 리뷰 사진 저장
        await this.reviewPhotoRepository.add(param);
        // 리뷰 포인트 저장
        const point = await this.reviewPointHistoryRepository.add(param);
        // 유저 포인트 변경
        await this.userRepository.updatePoint({userId, point});
    }
    async read(userId: string) {
        // parameter validation
        await this.validator.read(userId);
        // 리뷰 포인트 호출
        return this.reviewPointHistoryRepository.readPoints(userId);
    }
    async modify(param: ModReviewEventRequestParam) {
        const {userId} = param;
        // parameter validation
        await this.validator.modify(param);
        // 리뷰 포인트 저장
        const point = await this.reviewPointHistoryRepository.modify(param);
        // 리뷰 수정
        await this.reviewRepository.modify(param);
        // 리뷰 사진 수정
        await this.reviewPhotoRepository.modify(param);
        if (point === 0) {
            return;
        }
        // 유저 포인트 변경
        await this.userRepository.updatePoint({userId, point});
    }
    async delete(param: DeleteReviewEventRequestParam) {
        const {userId, reviewId} = param;
        // parameter validation
        await this.validator.delete(param);
        // 리뷰 포인트 저장
        const point = await this.reviewPointHistoryRepository.deleteReview(param);
        // 리뷰 사진 저장
        await this.reviewPhotoRepository.remove({reviewId});
        // 리뷰 저장
        await this.reviewRepository.remove({reviewId});
        // 유저 포인트 계산
        await this.userRepository.updatePoint({userId, point});
    }
}
