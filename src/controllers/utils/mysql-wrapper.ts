import {OkPacket} from 'mysql';
import createError from 'http-errors';
import {ConditionType, JoinType, QueryBuilder, UpdateQuerySet} from '@controllers/utils';
import {MySQLConnection} from '@controllers/utils/mysql-connector';
import {HTTP_RESPONSE_CODE} from '@controllers/utils/error-code';

export interface IMySQLWrapper {
    _insert<T>(param: T, opt?: {onDuplicate?: string[]; ignore?: boolean}): Promise<OkPacket>;
    _insertBulk<T>(param: T[], opt?: {onDuplicate?: string[]}): Promise<OkPacket>;
    _get<T>(conditions: ConditionType[], opt?: GetQueryPropertyType): Promise<T[]>;
    _setGetQueryBuilder<T>(Query: QueryBuilder, conditions: ConditionType[], opt?: GetQueryPropertyType): void;
    _getOne<T>(conditions: ConditionType[], opt?: GetQueryPropertyType): Promise<T>;
    _update<T>(conditions: ConditionType[], param: T, opt?: GetQueryPropertyType): Promise<OkPacket>;
    _updateMaths<T>(conditions: ConditionType[], param: UpdateQuerySet[]): Promise<OkPacket>;
    _delete(conditions: ConditionType[]): Promise<OkPacket>;
    _count(conditions: ConditionType[]): Promise<{count: number}>;
}

export class MySQLWrapper implements IMySQLWrapper {
    tableName: string;
    tableShort?: string;

    constructor(param: {tableName: string; tableShort?: string}) {
        this.tableName = param.tableName;
        this.tableShort = param.tableShort;
    }

    _insert = async (param: any, opt?: {onDuplicate?: string[]; ignore?: boolean}): Promise<OkPacket> => {
        let Query = new QueryBuilder().insert(this.tableName, opt && opt.ignore).values(param);
        if (opt && opt.onDuplicate) {
            opt.onDuplicate.forEach((fieldName) => {
                Query.onDuplicate(fieldName);
            });
        }
        let finalStatement = Query.build().returnString();
        return MySQLConnection.getInstance().queryWrite(finalStatement);
    };

    _insertBulk = async <T>(param: T[], opt?: {onDuplicate?: string[]}): Promise<OkPacket> => {
        let Query = new QueryBuilder().insert(this.tableName).arrayValues(param);
        if (opt && opt.onDuplicate) {
            opt.onDuplicate.forEach((fieldName) => {
                Query.onDuplicate(fieldName);
            });
        }
        let finalStatement = Query.build().returnString();
        return MySQLConnection.getInstance().queryWrite(finalStatement);
    };

    _update = async <T>(conditions: ConditionType[], param: T, opt?: GetQueryPropertyType): Promise<OkPacket> => {
        let Query = new QueryBuilder().update(this.tableName, this.tableShort).setMultiple(param);
        this._conditionBuilder(Query, conditions);
        // 페이징 조건 설정
        if (opt && typeof opt.limit !== 'undefined' && opt.limit !== null) {
            Query.updateLimit(opt.limit);
        }
        if (opt && opt.orderBy) {
            opt.orderBy.forEach((item) => {
                Query.orderBy(item.fieldName, item.sort);
            });
        }
        if (opt && opt.join) {
            opt.join.forEach((join) => {
                Query.join(join.tableName, join.column1, '=', join.column2, join.tableShort);
            });
        }
        if (conditions.length < 1) {
            throw createError(500, HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR, {reason: '[위험] 업데이트 불가'});
        }
        let finalStatement = Query.build().returnString();
        return MySQLConnection.getInstance().queryWrite(finalStatement);
    };

    async _updateMaths<T>(conditions: ConditionType[], param: UpdateQuerySet[]): Promise<OkPacket> {
        let Query = new QueryBuilder().update(this.tableName, this.tableShort).setMathMultiple(param);
        this._setGetQueryBuilder(Query, conditions);
        let finalStatement = Query.build().returnString();
        return await MySQLConnection.getInstance().queryWrite(finalStatement);
    }

    _delete = async (conditions: ConditionType[]): Promise<OkPacket> => {
        let Query = new QueryBuilder().delete(this.tableName, this.tableShort);
        this._conditionBuilder(Query, conditions);
        let finalStatement = Query.build().returnString();
        if (conditions.length < 1) {
            throw createError(HTTP_RESPONSE_CODE.BAD_REQUEST, 'Bad Request', {reason: '[위험] 삭제 불가'});
        }
        return await MySQLConnection.getInstance().queryWrite(finalStatement);
    };

    _get = async <T>(conditions: ConditionType[], opt?: GetQueryPropertyType): Promise<T[]> => {
        let Query = new QueryBuilder().select(this.tableName, this.tableShort);
        this._setGetQueryBuilder(Query, conditions, opt);
        let finalStatement = Query.build().returnString();
        return await MySQLConnection.getInstance().query<T>(finalStatement);
    };

    _getOne = async <T>(conditions: ConditionType[], opt?: GetQueryPropertyType): Promise<T> => {
        let Query = new QueryBuilder().select(this.tableName, this.tableShort);
        this._setGetQueryBuilder(Query, conditions, opt);
        let finalStatement = Query.build().returnString();
        let getRes = await MySQLConnection.getInstance().query<T>(finalStatement);
        return getRes[0];
    };

    _count = async (conditions: ConditionType[]): Promise<{count: number}> => {
        let Query = new QueryBuilder().select(this.tableName, this.tableShort).getAs('COUNT(*) as count');
        this._conditionBuilder(Query, conditions);
        let finalStatement = Query.build().returnString();
        let getRes = await MySQLConnection.getInstance().query<{count: number}>(finalStatement);
        return getRes[0];
    };
    _conditionBuilder = (Query: QueryBuilder, conditions: ConditionType[]) => {
        let orConditions = conditions.filter((item) => item.or);
        let andConditions = conditions.filter((item) => !item.or);
        orConditions.forEach((condition, index) => {
            if (orConditions.length === 1) {
                Query.where(condition);
            } else {
                if (index > 0 && condition.isNewOrGroup) {
                    Query.whereOr(condition);
                } else {
                    Query.whereOr(condition);
                }
            }
        });
        andConditions.forEach((condition) => {
            Query.where(condition);
        });
    };
    _setGetQueryBuilder = (Query: QueryBuilder, conditions: ConditionType[], opt?: GetQueryPropertyType) => {
        if (opt && opt.fields) {
            opt.fields.forEach((field) => {
                Query.getAs(field);
            });
        } else {
            Query.get('*');
        }
        if (opt && opt.leftJoin) {
            opt.leftJoin.forEach((join) => {
                Query.leftJoin(join.tableName, join.column1, '=', join.column2, join.tableShort, join.condition);
            });
        }
        if (opt && opt.join) {
            opt.join.forEach((join) => {
                Query.join(join.tableName, join.column1, '=', join.column2, join.tableShort, join.condition);
            });
        }
        this._conditionBuilder(Query, conditions);
        if (opt && opt.orderBy) {
            opt.orderBy.forEach((item) => {
                Query.orderBy(item.fieldName, item.sort);
            });
        }
        if (opt && typeof opt.groupBy !== 'undefined') {
            opt.groupBy.forEach((field) => {
                Query.groupBy(field);
            });
        }
        if (opt && typeof opt.having !== 'undefined') {
            opt.having.forEach((condition) => {
                Query.having(condition.fieldName, condition.operator ? condition.operator : '=', condition.value);
            });
        }
        // 페이징 조건 설정
        if (opt && !!opt.limit) {
            if (!opt.offset) {
                opt.offset = 0;
            }
            Query.limit(opt.limit, opt.offset);
        }
        if (conditions.length < 1 && (!opt || !opt.noCondition)) {
            throw createError(HTTP_RESPONSE_CODE.BAD_REQUEST, 'Bad Request', {
                query: Query.build().returnString(),
                reason: 'query filter condition is not defined',
            });
        }
    };
}
/*
----------------------------------------------------------------------------------------------------------------
----------------------------------     Parent  Interface   -----------------------------------------------------
----------------------------------------------------------------------------------------------------------------
 */

export type GetQueryPropertyType = {
    fields?: string[];
    orderBy?: {fieldName: string; sort: string}[];
    leftJoin?: JoinType[];
    join?: JoinType[];
    limit?: number | null;
    offset?: number | null;
    groupBy?: string[];
    having?: ConditionType[];
    noCondition?: boolean;
    conditions?: ConditionType[];
};
