import {OkPacket} from 'mysql';
import {ConditionType, GetQueryPropertyType, IMySQLWrapper, MySQLWrapper} from '@controllers/utils';

export interface IReviewPointHistoryBaseRepository extends IMySQLWrapper {
    insert(data: Partial<ReviewPointHistoryTableSchemaType>): Promise<OkPacket>;
    readOne(param: Partial<ReviewPointHistoryTableKeyType>, opt?: GetQueryPropertyType): Promise<any>;
    read(param: Partial<ReviewPointHistoryTableKeyType>, opt?: GetQueryPropertyType): Promise<any[]>;
    count(param: Partial<ReviewPointHistoryTableKeyType>, opt?: GetQueryPropertyType): Promise<number>;
    remove(param: Partial<ReviewPointHistoryTableKeyType>): Promise<OkPacket>;
    updateOne(param: Partial<ReviewPointHistoryTableKeyType>, user: Partial<ReviewPointHistoryTableSchemaType>): Promise<OkPacket>;
}
export class ReviewPointHistoryBaseRepository extends MySQLWrapper implements IReviewPointHistoryBaseRepository {
    constructor() {
        super({tableName: 'review_point_history', tableShort: 'rvph'});
    }
    insert = (data: Partial<ReviewPointHistoryTableSchemaType>, onDuplicate?: string[]) => {
        let ignore = false;
        if (!onDuplicate) {
            ignore = true;
        }
        const {userId, reviewId, point, operator, type, memo} = data;
        return this._insert({userId, reviewId, point, operator, type, memo}, {ignore, onDuplicate});
    };
    remove = (keyObject: Partial<ReviewPointHistoryTableKeyType>) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._delete(conditions);
    };
    updateOne = (keyObject: Partial<ReviewPointHistoryTableKeyType>, user: Partial<ReviewPointHistoryTableSchemaType>) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._update(conditions, user);
    };
    read = (keyObject: Partial<ReviewPointHistoryTableKeyType>, opt?: GetQueryPropertyType) => {
        let conditions = this.getKeyConditions(keyObject);
        if (opt && opt.conditions) {
            conditions = conditions.concat(opt.conditions);
        }
        return this._get<any>(conditions, {...opt});
    };
    readOne = (keyObject: Partial<ReviewPointHistoryTableKeyType>, opt?: GetQueryPropertyType) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._getOne<any>(conditions, {...opt});
    };
    async count(keyObject: Partial<ReviewPointHistoryTableKeyType>, opt?: GetQueryPropertyType) {
        const conditions = this.getKeyConditions(keyObject);
        const fields = ['COUNT(*) as count'];
        const response = await this._getOne<{count: number}>(conditions, {...opt, fields});
        return response.count;
    }
    getKeyConditions = (query: Partial<ReviewPointHistoryTableKeyType>) => {
        let conditions: ConditionType[] = [];
        const {userId, reviewId, type} = query;
        if (userId) {
            conditions.push({fieldName: 'rvph.userId', value: userId});
        }
        if (reviewId) {
            conditions.push({fieldName: 'rvph.reviewId', value: reviewId});
        }
        if (type) {
            conditions.push({fieldName: 'rvph.type', value: type});
        }
        return conditions;
    };

    getInsertParam(data: any) {
        const {userId, reviewId, point, operator, type, memo} = data;
        return {userId, reviewId, point, operator, type, memo};
    }
}

export type ReviewPointHistoryTableKeyType = {
    userId: string;
    reviewId: string;
    type: 'review' | 'photo_review' | 'first_place_review';
};
export type ReviewPointHistoryTableSchemaType = {
    id: number;
    userId: string;
    reviewId: string;
    point: number;
    type: 'review' | 'photo_review' | 'first_place_review';
    operator: 'plus' | 'minus';
    memo: string;
    createdAt: string;
};
