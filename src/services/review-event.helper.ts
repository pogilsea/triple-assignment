export interface IReviewEventServiceHelper {
    isAddingPhotos(ids?: string[]): boolean;
    isFirstPlaceReview(count?: number): boolean;
    hasFirstPlaceReviewRewarded(count?: number): boolean;
    hasPreviouslyAddedPhotos(count?: number): boolean;
    calculateReviewPoint(param: {point: number; operator: 'plus' | 'minus'}[]): number;
}
export class ReviewEventServiceHelper implements IReviewEventServiceHelper {
    isAddingPhotos(ids?: string[]) {
        return !!ids && ids.length > 0;
    }
    isFirstPlaceReview(count: number) {
        return count === 1;
    }
    hasFirstPlaceReviewRewarded(count: number) {
        return count > 0;
    }
    hasPreviouslyAddedPhotos(count?: number) {
        return typeof count === 'number' && count > 0;
    }
    calculateReviewPoint(param: {point: number; operator: 'plus' | 'minus'}[]) {
        return param.reduce((prev, current) => prev + (current.operator === 'plus' ? current.point : -current.point), 0);
    }
}
