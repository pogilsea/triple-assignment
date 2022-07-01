import {OkPacket} from 'mysql';
import {ConditionType, GetQueryPropertyType, IMySQLWrapper, MySQLWrapper} from '@controllers/utils';

export interface IReviewBaseRepository extends IMySQLWrapper {
    insert(data: Partial<ReviewTableSchemaType>): Promise<OkPacket>;
    readOne(param: Partial<ReviewTableKeyType>, opt?: GetQueryPropertyType): Promise<any>;
    read(param: Partial<ReviewTableKeyType>, opt?: GetQueryPropertyType): Promise<any[]>;
    count(param: Partial<ReviewTableKeyType>, opt?: GetQueryPropertyType): Promise<number>;
    remove(param: Partial<ReviewTableKeyType>): Promise<OkPacket>;
    updateOne(param: Partial<ReviewTableKeyType>, user: Partial<ReviewTableSchemaType>): Promise<OkPacket>;
}
export class ReviewBaseRepository extends MySQLWrapper implements IReviewBaseRepository {
    constructor() {
        super({tableName: 'review', tableShort: 'rv'});
    }
    insert(data: Partial<ReviewTableSchemaType>, onDuplicate?: string[]) {
        let ignore = false;
        if (!onDuplicate) {
            ignore = true;
        }
        return this._insert(data, {ignore, onDuplicate});
    }
    remove(keyObject: Partial<ReviewTableKeyType>) {
        const conditions = this.getKeyConditions(keyObject);
        return this._delete(conditions);
    }
    updateOne(keyObject: Partial<ReviewTableKeyType>, user: Partial<ReviewTableSchemaType>) {
        const conditions = this.getKeyConditions(keyObject);
        return this._update(conditions, user);
    }
    read(keyObject: Partial<ReviewTableKeyType>, opt?: GetQueryPropertyType) {
        let conditions = this.getKeyConditions(keyObject);
        if (opt && opt.conditions) {
            conditions = conditions.concat(opt.conditions);
        }
        return this._get<any>(conditions, {...opt});
    }
    readOne(keyObject: Partial<ReviewTableKeyType>, opt?: GetQueryPropertyType) {
        const conditions = this.getKeyConditions(keyObject);
        return this._getOne<any>(conditions, {...opt});
    }
    async count(keyObject: Partial<ReviewTableKeyType>, opt?: GetQueryPropertyType) {
        const conditions = this.getKeyConditions(keyObject);
        const fields = ['COUNT(*) as count'];
        const response = await this._getOne<{count: number}>(conditions, {...opt, fields});
        return response.count;
    }
    getKeyConditions = (query: Partial<ReviewTableKeyType>) => {
        let conditions: ConditionType[] = [];
        const {placeId, reviewId, userId} = query;
        if (placeId) {
            conditions.push({fieldName: 'rv.placeId', value: placeId});
        }
        if (reviewId) {
            conditions.push({fieldName: 'rv.reviewId', value: reviewId});
        }
        if (userId) {
            conditions.push({fieldName: 'rv.userId', value: userId});
        }
        return conditions;
    };
}

export type ReviewTableKeyType = {
    reviewId: string;
    placeId: string;
    userId: string;
};
export type ReviewTableSchemaType = {
    reviewId: string;
    placeId: string;
    userId: string;
    content: string;
    createdAt: string;
};
