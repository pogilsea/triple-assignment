import {BaseValidator, IBaseValidator} from '@controllers/utils';
import {AddReviewEventRequestParam, DeleteReviewEventRequestParam, ModReviewEventRequestParam} from '@services/review-event.entity';
import {IUserRepository, UserRepository} from '@controllers/repositories/user';
import {IPlaceRepository, PlaceRepository} from '@controllers/repositories/place';
import {IReviewRepository, ReviewRepository} from '@controllers/repositories/review';
import {IReviewEventValidateHelper, ReviewEventValidateHelper} from '@controllers/validator/review-event.helper';

export interface IReviewEventValidator extends IBaseValidator {
    add(param: AddReviewEventRequestParam): Promise<void>;
    read(param: any): void;
    modify(param: ModReviewEventRequestParam): Promise<void>;
    delete(param: DeleteReviewEventRequestParam): Promise<void>;
}

export class ReviewEventValidator extends BaseValidator implements IReviewEventValidator {
    userRepo: IUserRepository;
    placeRepo: IPlaceRepository;
    reviewRepo: IReviewRepository;
    validateHelper: IReviewEventValidateHelper;
    constructor() {
        super();
        this.userRepo = new UserRepository();
        this.placeRepo = new PlaceRepository();
        this.reviewRepo = new ReviewRepository();
        this.validateHelper = new ReviewEventValidateHelper();
    }
    async add(param: AddReviewEventRequestParam) {
        try {
            const {userId, placeId} = param;
            this.execute(RequestParamSchema.AddEvent, param);
            const user = await this.userRepo.readOne({userId}, {fields: ['userId']});
            this.validateHelper.assertUserExist(user);
            const place = await this.placeRepo.readOne({placeId}, {fields: ['placeId']});
            this.validateHelper.assertPlaceExist(place);
            const review = await this.reviewRepo.readOne({userId, placeId}, {fields: ['placeId']});
            this.validateHelper.assertDuplicateReview(review);
        } catch (err) {
            this.setAddEventErrorMessage(err);
            throw err;
        }
    }
    async read(userId: string) {
        try {
            this.execute(RequestParamSchema.Read, {userId});
            const user = await this.userRepo.readOne({userId}, {fields: ['userId']});
            this.validateHelper.assertUserExist(user);
        } catch (err) {
            this.setAddEventErrorMessage(err);
            throw err;
        }
    }
    async modify(param: ModReviewEventRequestParam) {
        try {
            const {userId, reviewId} = param;
            this.execute(RequestParamSchema.ModEvent, param);
            const user = await this.userRepo.readOne({userId}, {fields: ['userId']});
            this.validateHelper.assertUserExist(user);
            const review = await this.reviewRepo.readOne({userId, reviewId}, {fields: ['reviewId']});
            this.validateHelper.assertReviewExist(review);
        } catch (err) {
            this.setAddEventErrorMessage(err);
            throw err;
        }
    }

    async delete(param: DeleteReviewEventRequestParam) {
        try {
            const {userId, reviewId} = param;
            this.execute(RequestParamSchema.DeleteEvent, param);
            const user = await this.userRepo.readOne({userId}, {fields: ['userId']});
            this.validateHelper.assertUserExist(user);
            const review = await this.reviewRepo.readOne({userId, reviewId}, {fields: ['reviewId']});
            this.validateHelper.assertReviewExist(review);
        } catch (err) {
            this.setAddEventErrorMessage(err);
            throw err;
        }
    }

    setAddEventErrorMessage = (err: any) => {
        switch (this.keyword) {
            case 'minLength':
                err.message = this.getMinLengthErrorMessage();
                break;
            case 'maxLength':
                err.message = this.getMaxLengthErrorMessage();
                break;
            case 'required':
                err.message = this.getRequiredErrorMessage();
                break;
            case 'enum':
                err.message = this.getEnumErrorMessage();
                break;
            case 'type':
                err.message = this.getTypeErrorMessage();
                break;
            default:
                break;
        }
    };
    getMinLengthErrorMessage = () => {
        const property = this.notAllowedTypeProperty;
        if (!property) {
            return 'Bad Request';
        }
        const limitText = this.params.limit;
        return `RequestBody ??????(${property})??? ?????? ${limitText}?????? ???????????? ???????????? ?????????`;
    };
    getMaxLengthErrorMessage = () => {
        if (!this.notAllowedTypeProperty) {
            return 'Bad Request';
        }
        const limitText = this.params.limit;
        const property = this.notAllowedTypeProperty;
        return `RequestBody ??????(${property})??? ?????? ${limitText}?????? ???????????? ???????????? ?????????`;
    };
    getRequiredErrorMessage = () => {
        switch (this.missingProperty) {
            case 'reviewId':
                return '?????? ????????? ???(reviewId)??? ???????????? ????????????.';
            case 'userId':
                return '?????? ????????? ???(userId)??? ???????????? ????????????.';
            case 'placeId':
                return '?????? ????????? ???(placeId)??? ???????????? ????????????.';
            case 'content':
                return '?????? ?????? ???(content)??? ???????????? ????????????.';
            case 'type':
                return '????????? ?????? ???(type)??? ???????????? ????????????.';
            default:
                break;
        }
    };
    getTypeErrorMessage = () => {
        const type = this.params.type;
        switch (this.notAllowedTypeProperty) {
            case 'reviewId':
                return `?????? ????????? ???(reviewId)??? ????????? ???????????? ????????????.(allowed type: ${type})`;
            case 'userId':
                return `?????? ????????? ???(userId)??? ????????? ???????????? ????????????.(allowed type: ${type})`;
            case 'placeId':
                return `?????? ????????? ???(placeId)??? ????????? ???????????? ????????????.(allowed type: ${type})`;
            case 'content':
                return `?????? ?????? ???(content)??? ????????? ???????????? ????????????.(allowed type: ${type})`;
            default:
                break;
        }
    };
    getEnumErrorMessage = () => {
        switch (this.notAllowedTypeProperty) {
            case 'action':
                return '????????? ?????? ?????? ?????? ??????????????????(allowed values: ' + JSON.stringify(this.allowedValues) + ')';
            case 'type':
                return '????????? Request type ?????? ??????????????????(allowed values: ' + JSON.stringify(this.allowedValues) + ')';
            default:
                break;
        }
    };
}
const RequestParamSchema = {
    AddEvent: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'reviewId', 'content', 'userId', 'placeId', 'action'],
        properties: {
            type: {type: 'string', enum: ['REVIEW']},
            reviewId: {type: 'string', minLength: 1},
            content: {type: 'string', minLength: 1},
            attachedPhotoIds: {type: 'array'},
            userId: {type: 'string'},
            placeId: {type: 'string'},
            action: {type: 'string', enum: ['ADD']},
        },
    },
    ModEvent: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'reviewId', 'userId', 'action'],
        properties: {
            type: {type: 'string', enum: ['REVIEW']},
            reviewId: {type: 'string', minLength: 1},
            content: {type: 'string', minLength: 1},
            attachedPhotoIds: {type: 'array'},
            userId: {type: 'string'},
            action: {type: 'string', enum: ['MOD']},
        },
    },
    Read: {
        type: 'object',
        additionalProperties: false,
        required: ['userId'],
        properties: {
            userId: {type: 'string'},
        },
    },

    DeleteEvent: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'reviewId', 'userId', 'action'],
        properties: {
            type: {type: 'string', enum: ['REVIEW']},
            reviewId: {type: 'string', minLength: 1},
            userId: {type: 'string'},
            action: {type: 'string', enum: ['DELETE']},
        },
    },
};
