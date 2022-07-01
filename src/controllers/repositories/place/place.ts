import {IPlaceBaseRepository, PlaceBaseRepository} from '@controllers/repositories/place/place.base';

export interface IPlaceRepository extends IPlaceBaseRepository {}

export class PlaceRepository extends PlaceBaseRepository implements IPlaceRepository {
    constructor() {
        super();
    }
}
