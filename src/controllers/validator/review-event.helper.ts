import createHttpError from 'http-errors';

export interface IReviewEventValidateHelper {
    assertUserExist(user: any): void;
    assertPlaceExist(user: any): void;
    assertReviewExist(user: any): void;
    assertDuplicateReview(user: any): void;
}
export class ReviewEventValidateHelper implements IReviewEventValidateHelper {
    assertUserExist(user: any) {
        if (!user) {
            const message = '시스템에 존재하지 않은 사용자 입니다.';
            throw createHttpError(400, message);
        }
    }
    assertPlaceExist(place: any) {
        if (!place) {
            const message = '시스템에 존재하지 여행지 입니다.';
            throw createHttpError(400, message);
        }
    }
    assertReviewExist(review: any) {
        if (!review) {
            const message = '요청한 후기가 시스템에 존재하지 않습니다.';
            throw createHttpError(400, message);
        }
    }
    assertDuplicateReview(duplicateReview: any) {
        if (!!duplicateReview) {
            const message = '해당 장소에 이미 리뷰를 작성한 이력이 있습니다. 하나의 장소에 한 개의 리뷰만 작성이 가능합니다.';
            throw createHttpError(400, message);
        }
    }
}
