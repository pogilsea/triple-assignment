import {OkPacket} from 'mysql';
import {ConditionType, GetQueryPropertyType, IMySQLWrapper, MySQLWrapper} from '@controllers/utils';

export interface IPlaceBaseRepository extends IMySQLWrapper {
    insert(data: Partial<PlaceTableSchemaType>): Promise<OkPacket>;
    readOne(param: Partial<PlaceTableKeyType>, opt?: GetQueryPropertyType): Promise<any>;
    read(param: Partial<PlaceTableKeyType>, opt?: GetQueryPropertyType): Promise<any[]>;
    remove(param: Partial<PlaceTableKeyType>): Promise<OkPacket>;
    updateOne(param: Partial<PlaceTableKeyType>, user: Partial<PlaceTableSchemaType>): Promise<OkPacket>;
}
export class PlaceBaseRepository extends MySQLWrapper implements IPlaceBaseRepository {
    constructor() {
        super({tableName: 'place', tableShort: 'pl'});
    }
    insert = (data: Partial<PlaceTableSchemaType>, onDuplicate?: string[]) => {
        let ignore = false;
        if (!onDuplicate) {
            ignore = true;
        }
        return this._insert(data, {ignore, onDuplicate});
    };
    remove = (keyObject: Partial<PlaceTableKeyType>) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._delete(conditions);
    };
    updateOne = (keyObject: Partial<PlaceTableKeyType>, user: Partial<PlaceTableSchemaType>) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._update(conditions, user);
    };
    read = (keyObject: Partial<PlaceTableKeyType>, opt?: GetQueryPropertyType) => {
        let conditions = this.getKeyConditions(keyObject);
        if (opt && opt.conditions) {
            conditions = conditions.concat(opt.conditions);
        }
        return this._get<any>(conditions, {...opt});
    };
    readOne = (keyObject: Partial<PlaceTableKeyType>, opt?: GetQueryPropertyType) => {
        const conditions = this.getKeyConditions(keyObject);
        return this._getOne<any>(conditions, {...opt});
    };
    getKeyConditions = (query: Partial<PlaceTableKeyType>) => {
        let conditions: ConditionType[] = [];
        const {placeId} = query;
        if (placeId) {
            conditions.push({fieldName: 'pl.placeId', value: placeId});
        }
        return conditions;
    };
}

export type PlaceTableKeyType = {
    placeId: string;
};
export type PlaceTableSchemaType = {
    placeId: string;
};
