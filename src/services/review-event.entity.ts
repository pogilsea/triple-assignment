export type EventType = 'REVIEW';
export type ActionType = 'ADD' | 'MOD' | 'DELETE';

export type ReviewEvent = {
    type: EventType;
    reviewId: string;
    userId: string;
    action: ActionType /* "MOD", "DELETE" */;
};

export type AddReviewEventRequestParam = ReviewEvent & {
    placeId: string;
    attachedPhotoIds: string[];
    content: string;
};
export type ModReviewEventRequestParam = ReviewEvent & Partial<{attachedPhotoIds: string[]; content: string}>;
export type DeleteReviewEventRequestParam = ReviewEvent;
export type ReviewEventResponse = {
    userId: string;
    totalPoint: number;
    points: ReviewPointResponse[];
};
export type PointType = 'review' | 'photo_review' | 'first_place_review';
export type ReviewPointResponse = {
    id: number;
    userId: string;
    reviewId: string;
    point: number;
    operator: 'plus' | 'minus';
    memo: string;
    createdAt: string;
    type: PointType;
};
