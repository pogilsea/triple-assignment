import {OkPacket} from 'mysql';
import {ConditionType, UpdateQuerySet} from '@controllers/utils';
import {IUserBaseRepository, UserBaseRepository} from '@controllers/repositories/user/user.base';

export interface IUserRepository extends IUserBaseRepository {
    updatePoint(vendor: {userId: string; point: number}): Promise<OkPacket>;
}

export class UserRepository extends UserBaseRepository implements IUserRepository {
    constructor() {
        super();
    }
    updatePoint = async (param: {userId: string; point: number}) => {
        const {userId, point} = param;
        const conditions: ConditionType[] = [{fieldName: 'userId', value: userId}];
        const data: UpdateQuerySet[] = [{fieldName: 'totalPoint', value: point, operator: 'plus'}];
        return this._updateMaths(conditions, data);
    };
}
