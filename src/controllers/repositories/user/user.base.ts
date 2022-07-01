import {OkPacket} from 'mysql';
import {ConditionType, GetQueryPropertyType, IMySQLWrapper, MySQLWrapper} from '@controllers/utils';

export interface IUserBaseRepository extends IMySQLWrapper {
    insert(data: Partial<UserTableSchemaType>, onDuplicate?: string[]): Promise<OkPacket>;
    readOne(param: Partial<UserTableKeyType>, opt?: GetQueryPropertyType): Promise<any>;
    read(param: Partial<UserTableKeyType>, opt?: GetQueryPropertyType): Promise<any[]>;
    remove(param: Partial<UserTableKeyType>): Promise<OkPacket>;
    updateOne(param: Partial<UserTableKeyType>, user: Partial<UserTableSchemaType>): Promise<OkPacket>;
}
export class UserBaseRepository extends MySQLWrapper implements IUserBaseRepository {
    constructor() {
        super({tableName: 'user', tableShort: 'us'});
    }
    insert = (data: Partial<UserTableSchemaType>, onDuplicate?: string[]) => {
        let ignore = false;
        if (!onDuplicate) {
            ignore = true;
        }
        return this._insert(data, {ignore, onDuplicate});
    };
    remove = (keyObject: Partial<UserTableKeyType>) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._delete(conditions);
    };
    updateOne = (keyObject: Partial<UserTableKeyType>, user: Partial<UserTableSchemaType>) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._update(conditions, user);
    };
    read = (keyObject: Partial<UserTableKeyType>, opt?: GetQueryPropertyType) => {
        let conditions = this.getKeyConditions(keyObject);
        if (opt && opt.conditions) {
            conditions = conditions.concat(opt.conditions);
        }
        return this._get<any>(conditions, {...opt});
    };
    readOne = (keyObject: Partial<UserTableKeyType>, opt?: GetQueryPropertyType) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._getOne<any>(conditions, {...opt});
    };
    getKeyConditions = (query: Partial<UserTableKeyType>) => {
        let conditions: ConditionType[] = [];
        const {userId} = query;
        if (userId) {
            conditions.push({fieldName: 'us.userId', value: userId});
        }
        return conditions;
    };
}

export type UserTableKeyType = {
    userId: string;
};
export type UserTableSchemaType = {
    userId: string;
    totalPoint: number;
};
