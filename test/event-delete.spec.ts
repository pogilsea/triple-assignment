import 'module-alias/register';
import chai from 'chai';
import app from '../src/app';
import {before} from 'mocha';
import {v4 as uuidv4} from 'uuid';
import {UserRepository} from '@controllers/repositories/user';
import {ReviewPhotoRepository, ReviewPointHistoryRepository, ReviewRepository} from '@controllers/repositories/review';
import {ReviewEventTestHelper} from './helpers/review-event';
import chaiHttp = require('chai-http');
import {ActionType, EventType} from '@services/review-event.entity';

process.env.NODE_ENV = 'debug';
chai.use(chaiHttp);
chai.should();
const helper = new ReviewEventTestHelper();

describe('리뷰 이벤트 삭제: SUCCESS', () => {
    const userRepo = new UserRepository();
    const reviewPointHistoryRepo = new ReviewPointHistoryRepository();
    const reviewRepo = new ReviewRepository();
    const reviewPhotoRepo = new ReviewPhotoRepository();
    describe('[Scenario #1] Success: 기존 이벤트: 리뷰만 작성, 리뷰 삭제', () => {
        const reviewId = uuidv4();
        const userId = uuidv4();
        const placeId = uuidv4();
        const firstReviewUserId = uuidv4();
        before('첫 특정장소 후기 세팅', async () => {
            const reviewId = uuidv4();
            const attachedPhotoIds: string[] = [];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'ADD';
            await helper.addNewPlace(placeId);
            await helper.addNewUser(firstReviewUserId);
            const param = {
                type,
                action,
                reviewId,
                content: '[test] first place review!',
                attachedPhotoIds,
                userId: firstReviewUserId,
                placeId,
            };
            await chai.request(app).post('/events').send(param);
        });

        before('기존 리뷰 세팅', async () => {
            await helper.addNewUser(userId);
            const attachedPhotoIds: string[] = [];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'ADD';
            const param = {type, action, reviewId, content: '[test] add review!', attachedPhotoIds, userId, placeId};
            await chai.request(app).post('/events').send(param);
        });

        it('리뷰 이벤트 삭제 성공시, HTTP Status 값은 200', (done) => {
            const attachedPhotoIds: string[] = [uuidv4()];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'DELETE';
            const param = {type, action, reviewId, content: '[test] delete review!', attachedPhotoIds, userId, placeId};
            chai.request(app)
                .post('/events')
                .send(param)
                .end((err, res) => {
                    if (err) {
                        console.log('err', err);
                    }
                    const status = res.status;
                    chai.assert.equal(status, 200);
                    done();
                });
        });
        it('리뷰만 작성 후 삭제시, total point 0', async () => {
            const user = await userRepo.readOne({userId});
            chai.assert.equal(user.totalPoint, 0);
        });

        it('리뷰만 작성 후 삭제시, 리뷰 table row 개수 0개로 변경', async () => {
            const review = await reviewRepo.read({reviewId});
            chai.assert.equal(review.length, 0);
        });
        it('리뷰만 작성 후 삭제시, 리뷰 이벤트 히스토리 table operator records are plus, minus', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({userId});
            let reviewOperators = reviewHistory.map((item) => item.operator);
            chai.assert.sameMembers(reviewOperators, ['plus', 'minus']);
        });
        it('리뷰만 작성 후 사진 추가시, 리뷰 이벤트 히스토리 table type records are review,photo_review', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({userId});
            let reviewTypes = reviewHistory.map((item) => item.type);
            chai.assert.sameMembers(reviewTypes, ['review', 'review']);
        });

        after('테스트 리뷰 장소 제거', (done) => {
            helper.removePlace(placeId);
            done();
        });
        after('테스트 유저&리뷰 제거', (done) => {
            Promise.all([helper.removeUser(firstReviewUserId), helper.removeUser(userId)]);
            done();
        });
    });
    describe('[Scenario #2] Success: 기존 이벤트: 리뷰+사진 작성, 리뷰 삭제', () => {
        const reviewId = uuidv4();
        const userId = uuidv4();
        const placeId = uuidv4();
        const firstReviewUserId = uuidv4();
        before('첫 특정장소 후기 세팅', async () => {
            const reviewId = uuidv4();
            const attachedPhotoIds: string[] = [];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'ADD';
            await helper.addNewPlace(placeId);
            await helper.addNewUser(firstReviewUserId);
            const param = {
                type,
                action,
                reviewId,
                content: '[test] first place review!',
                attachedPhotoIds,
                userId: firstReviewUserId,
                placeId,
            };
            await chai.request(app).post('/events').send(param);
        });

        before('기존 리뷰 세팅', async () => {
            await helper.addNewUser(userId);
            const attachedPhotoIds: string[] = [uuidv4()];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'ADD';
            const param = {type, action, reviewId, content: '[test] add review!', attachedPhotoIds, userId, placeId};
            await chai.request(app).post('/events').send(param);
        });

        it('리뷰 이벤트 삭제 성공시, HTTP Status 값은 200', (done) => {
            const attachedPhotoIds: string[] = [];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'DELETE';
            const param = {type, action, reviewId, content: '[test] delete review!', attachedPhotoIds, userId, placeId};
            chai.request(app)
                .post('/events')
                .send(param)
                .end((err, res) => {
                    if (err) {
                        console.log('err', err);
                    }
                    const status = res.status;
                    chai.assert.equal(status, 200);
                    done();
                });
        });
        it('리뷰+사진 작성 후 삭제시, total point 0', async () => {
            const user = await userRepo.readOne({userId});
            chai.assert.equal(user.totalPoint, 0);
        });

        it('리뷰+사진 작성 후 삭제시, 리뷰 사진 table row 개수 0개로 변경', async () => {
            const review = await reviewPhotoRepo.read({reviewId});
            chai.assert.equal(review.length, 0);
        });
        it('리뷰+사진 작성 후 삭제시, 리뷰 이벤트 히스토리 table operator records are plus, plus, minus, minus', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({userId});
            let reviewOperators = reviewHistory.map((item) => item.operator);
            chai.assert.sameMembers(reviewOperators, ['plus', 'plus', 'minus', 'minus']);
        });
        it('리뷰만 작성 후 삭제시, 리뷰 이벤트 히스토리 table type records are review, photo_review, review, photo_review', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({userId});
            let reviewTypes = reviewHistory.map((item) => item.type);
            chai.assert.sameMembers(reviewTypes, ['review', 'photo_review', 'review', 'photo_review']);
        });

        after('테스트 리뷰 장소 제거', (done) => {
            helper.removePlace(placeId);
            done();
        });
        after('테스트 유저&리뷰 제거', (done) => {
            Promise.all([helper.removeUser(firstReviewUserId), helper.removeUser(userId)]);
            done();
        });
    });

    describe('[Scenario #3] Success: 기존 이벤트: 리뷰+사진+첫 리뷰 작성, 리뷰 삭제', () => {
        const reviewId = uuidv4();
        const userId = uuidv4();
        const placeId = uuidv4();
        before('기존 리뷰 세팅', async () => {
            await helper.addNewPlace(placeId);
            await helper.addNewUser(userId);
            const attachedPhotoIds: string[] = [uuidv4()];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'ADD';
            const param = {type, action, reviewId, content: '[test] add review!', attachedPhotoIds, userId, placeId};
            await chai.request(app).post('/events').send(param);
        });

        it('리뷰 이벤트 삭제 성공시, HTTP Status 값은 200', (done) => {
            const attachedPhotoIds: string[] = [];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'DELETE';
            const param = {type, action, reviewId, content: '[test] delete review!', attachedPhotoIds, userId, placeId};
            chai.request(app)
                .post('/events')
                .send(param)
                .end((err, res) => {
                    if (err) {
                        console.log('err', err);
                    }
                    const status = res.status;
                    chai.assert.equal(status, 200);
                    done();
                });
        });

        it('리뷰+사진+첫 여행지 리뷰 작성 후 삭제시, 리뷰 이벤트 히스토리 table minus row는 3건', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({userId});
            console.log('review hist', reviewHistory);
            let reviewOperators = reviewHistory.filter((item) => item.operator === 'minus');
            chai.assert.lengthOf(reviewOperators, 3);
        });
        it('리뷰만 작성 후 삭제시, 리뷰 이벤트 히스토리 table minus 내역 types are review, photo_review, first_place_review', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({userId});
            let filtered = reviewHistory.filter((item) => item.operator === 'minus');
            let reviewTypes = filtered.map((item) => item.type);
            chai.assert.sameMembers(reviewTypes, ['review', 'photo_review', 'first_place_review']);
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
});

describe('리뷰 이벤트 삭제: ERROR', () => {
    describe('시스템에 존재하지 않은 유저 Error', () => {
        let param = {
            type: 'REVIEW',
            action: 'DELETE',
            reviewId: uuidv4(),
            userId: uuidv4(),
        };
        it('[#1] 유저 아이디가 시스템에 존재하지 않은 경우, Bad Request Response 반환', (done) => {
            chai.request(app)
                .post('/events')
                .send(param)
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    chai.assert.equal(status, 400);
                    done();
                });
        });
    });
    describe('시스템에 존재하지 않은 리뷰 Error', () => {
        const userId = uuidv4();
        const type: EventType = 'REVIEW';
        const action: ActionType = 'DELETE';
        before('유저 추가 세팅', (done) => {
            helper.addNewUser(userId);
            done();
        });
        it('[#1] 리뷰 아이디가 시스템에 존재하지 않은 경우, HTTP Status 400을 반환', (done) => {
            let data = {type, action, reviewId: uuidv4(), userId};
            console.log('request data', data);
            chai.request(app)
                .post('/events')
                .send(data)
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    chai.assert.equal(status, 400);
                    done();
                });
        });

        after('테스트 유저&리뷰 제거', (done) => {
            helper.removeUser(userId);
            done();
        });
    });
    describe('Request Body 잘못 입력: 필수값 누락', () => {
        let param = {
            type: 'REVIEW',
            action: 'DELETE',
            reviewId: uuidv4(),
            userId: uuidv4(),
        };
        it('[#1] 리뷰 아이디 누락시, Bad Request Response 반환', (done) => {
            let reviewId = undefined;
            chai.request(app)
                .post('/events')
                .send({...param, reviewId})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(reviewId)이 존재하지 않습니다`);
                    done();
                });
        });

        it('[#2] 유저 아이디 누락시, Bad Request Response 반환', (done) => {
            let userId = undefined;
            chai.request(app)
                .post('/events')
                .send({...param, userId})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(userId)이 존재하지 않습니다`);
                    done();
                });
        });
    });
    describe('Request Body 잘못 입력: Type error', () => {
        let param = {
            type: 'REVIEW',
            action: 'MOD',
            reviewId: uuidv4(),
            userId: uuidv4(),
        };
        it('[#1] 리뷰 아이디 type is number, Bad Request Response 반환', (done) => {
            let reviewId = 123;
            chai.request(app)
                .post('/events')
                .send({...param, reviewId})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(reviewId)의 타입이 올바르지 않습니다`);
                    done();
                });
        });

        it('[#2] 유저 아이디 type is number, Bad Request Response 반환', (done) => {
            let userId = 123;
            chai.request(app)
                .post('/events')
                .send({...param, userId})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(userId)의 타입이 올바르지 않습니다`);
                    done();
                });
        });
    });
    describe('Request Body 잘못 입력: value 최소 길이', () => {
        let param = {
            type: 'REVIEW',
            action: 'DELETE',
            reviewId: uuidv4(),
            userId: uuidv4(),
        };
        it('[#1] 리뷰 아이디 한글자 미만인 경우, Bad Request Response 반환', (done) => {
            let reviewId = '';
            chai.request(app)
                .post('/events')
                .send({...param, reviewId})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(reviewId)는 최소 1글자`);
                    done();
                });
        });
    });
});
