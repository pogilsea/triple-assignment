import {OkPacket} from 'mysql';
import {ConditionType, GetQueryPropertyType, IMySQLWrapper, MySQLWrapper} from '@controllers/utils';
import {ReviewTableKeyType} from '@controllers/repositories/review/review.base';

export interface IReviewPhotoBaseRepository extends IMySQLWrapper {
    insert(data: Partial<ReviewPhotoTableSchemaType>): Promise<OkPacket>;
    readOne(param: Partial<ReviewPhotoTableKeyType>, opt?: GetQueryPropertyType): Promise<any>;
    read(param: Partial<ReviewPhotoTableKeyType>, opt?: GetQueryPropertyType): Promise<any[]>;
    remove(param: Partial<ReviewPhotoTableKeyType>): Promise<OkPacket>;
    count(param: Partial<ReviewTableKeyType>, opt?: GetQueryPropertyType): Promise<number>;
    updateOne(param: Partial<ReviewPhotoTableKeyType>, user: Partial<ReviewPhotoTableSchemaType>): Promise<OkPacket>;
}
export class ReviewPhotoBaseRepository extends MySQLWrapper implements IReviewPhotoBaseRepository {
    constructor() {
        super({tableName: 'review_photo', tableShort: 'rvp'});
    }
    insert = (data: Partial<ReviewPhotoTableSchemaType>, onDuplicate?: string[]) => {
        let ignore = false;
        if (!onDuplicate) {
            ignore = true;
        }
        return this._insert(data, {ignore, onDuplicate});
    };
    remove = (keyObject: Partial<ReviewPhotoTableKeyType>) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._delete(conditions);
    };
    updateOne = (keyObject: Partial<ReviewPhotoTableKeyType>, user: Partial<ReviewPhotoTableSchemaType>) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._update(conditions, user);
    };
    read = (keyObject: Partial<ReviewPhotoTableKeyType>, opt?: GetQueryPropertyType) => {
        let conditions = this.getKeyConditions(keyObject);
        if (opt && opt.conditions) {
            conditions = conditions.concat(opt.conditions);
        }
        return this._get<any>(conditions, {...opt});
    };
    readOne = (keyObject: Partial<ReviewPhotoTableKeyType>, opt?: GetQueryPropertyType) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._getOne<any>(conditions, {...opt});
    };
    async count(keyObject: Partial<ReviewTableKeyType>, opt?: GetQueryPropertyType) {
        const conditions = this.getKeyConditions(keyObject);
        const fields = ['COUNT(*) as count'];
        const response = await this._getOne<{count: number}>(conditions, {...opt, fields});
        return response.count;
    }

    getKeyConditions = (query: Partial<ReviewPhotoTableKeyType>) => {
        let conditions: ConditionType[] = [];
        const {photoId, reviewId} = query;
        if (photoId) {
            conditions.push({fieldName: 'rvp.photoId', value: photoId});
        }
        if (reviewId) {
            conditions.push({fieldName: 'rvp.reviewId', value: reviewId});
        }
        return conditions;
    };
}

export type ReviewPhotoTableKeyType = {
    photoId: string;
    reviewId: string;
};
export type ReviewPhotoTableSchemaType = {
    photoId: string;
    reviewId: string;
};
