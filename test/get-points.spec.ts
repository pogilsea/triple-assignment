import 'module-alias/register';
import chai from 'chai';
import app from '../src/app';
import {before} from 'mocha';
import {ActionType, EventType} from '@services/review-event.entity';
import {ReviewEventTestHelper} from './helpers/review-event';
import {v4 as uuidv4} from 'uuid';
import chaiHttp = require('chai-http');

process.env.NODE_ENV = 'debug';
chai.use(chaiHttp);
chai.should();
const helper = new ReviewEventTestHelper();
describe('포인트 조회', () => {
    describe('[Success] 포인트 조회: 값 체크', () => {
        const userId = uuidv4();
        const placeId = uuidv4();
        before('리뷰 세팅(리뷰만 작성+특정 장소 최초 후기)', async () => {
            const reviewId = uuidv4();
            await helper.addNewUser(userId);
            await helper.addNewPlace(placeId);
            const attachedPhotoIds: string[] = [];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'ADD';
            const param = {type, action, reviewId, content: '[test] add review!', attachedPhotoIds, userId, placeId};
            await chai.request(app).post('/events').send(param);
        });
        it('포인트 조회, 리스폰스 값 체크', (done) => {
            chai.request(app)
                .get('/events/' + userId)
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const data = res.body.data;
                    const points = res.body.data.points;
                    chai.assert.equal(status, 200);
                    chai.assert.equal(data.userId, userId);
                    chai.assert.equal(data.totalPoint, 2);
                    chai.assert.lengthOf(points, 2);
                    points.forEach((point: any) => {
                        chai.assert.hasAllKeys(point, ['id', 'reviewId', 'point', 'operator', 'memo', 'createdAt', 'type']);
                        chai.assert.isNumber(point.id, 'id is not number');
                        chai.assert.isNumber(point.point, 'point is not number');
                        chai.assert.isString(point.reviewId, 'reviewId is not string');
                        chai.assert.isString(point.memo, 'memo is not string');
                        chai.assert.isString(point.createdAt, 'createdAt is not string');
                        chai.assert.oneOf(point.operator, ['plus', 'minus'], 'operator is not allowed value');
                        chai.assert.oneOf(point.type, ['review', 'photo_review', 'first_place_review'], 'type is not allowed value');
                    });
                    done();
                });
        });
        after('테스트 리뷰 장소 제거', (done) => {
            helper.removePlace(placeId);
            done();
        });
        after('테스트 유저&리뷰 제거', (done) => {
            helper.removeUser(userId);
            done();
        });
    });
    describe(' [ERROR] - 유저 아이디 존재 X', () => {
        it('시스템에 존재하지 않은 userId 조회시, HTTP Status 400을 반환', (done) => {
            const userId = uuidv4();
            chai.request(app)
                .get('/events/' + userId)
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    chai.assert.equal(status, 400);
                    done();
                });
        });
    });
});
