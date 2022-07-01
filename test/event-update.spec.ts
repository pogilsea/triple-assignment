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

describe('리뷰 이벤트 수정: SUCCESS', () => {
    const userRepo = new UserRepository();
    const reviewPointHistoryRepo = new ReviewPointHistoryRepository();
    const reviewRepo = new ReviewRepository();
    const reviewPhotoRepo = new ReviewPhotoRepository();
    describe('[Scenario #1] Success: 기존 이벤트: 리뷰만 작성, 수정 이벤트:사진 추가', () => {
        const reviewId = uuidv4();
        const userId = uuidv4();
        const firstReviewUserId = uuidv4();
        const placeId = uuidv4();
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
        it('리뷰 수정 이벤트 성공시, HTTP Status 값은 200', (done) => {
            const attachedPhotoIds: string[] = [uuidv4()];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'MOD';
            const param = {type, action, reviewId, content: '[test] modify review!', attachedPhotoIds, userId};
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
        it('리뷰만 작성 후 사진 추가시, total point 2', async () => {
            const user = await userRepo.readOne({userId});
            chai.assert.equal(user.totalPoint, 2);
        });

        it('리뷰만 작성 후 사진 추가시, 리뷰 table row 개수 1개로 유지', async () => {
            const review = await reviewRepo.read({reviewId});
            chai.assert.equal(review.length, 1);
        });
        it('리뷰만 작성 후 사진 1장 추가시, 리뷰 사진 table row 1개 추가', async () => {
            const review = await reviewPhotoRepo.read({reviewId});
            chai.assert.equal(review.length, 1);
        });
        it('리뷰만 작성 후 사진 추가시, 리뷰 이벤트 히스토리 table operator records are plus, plus', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({reviewId});
            let reviewOperators = reviewHistory.map((item) => item.operator);
            chai.assert.sameMembers(reviewOperators, ['plus', 'plus']);
        });
        it('리뷰만 작성 후 사진 추가시, 리뷰 이벤트 히스토리 table type records are review,photo_review', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({reviewId});
            let reviewTypes = reviewHistory.map((item) => item.type);
            chai.assert.sameMembers(reviewTypes, ['review', 'photo_review']);
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
    describe('[Scenario #2] Success: 기존 이벤트: 리뷰만 작성, 수정 이벤트: 리뷰내용 변경', () => {
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
        it('리뷰 수정 이벤트 성공시, HTTP Status 값은 200', (done) => {
            const attachedPhotoIds: string[] = [];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'MOD';
            const param = {type, action, reviewId, content: '[test] modify review!', attachedPhotoIds, userId};
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
        it('리뷰만 작성 후 리뷰 내용만 변경시, total point 1 유지', async () => {
            const user = await userRepo.readOne({userId});
            chai.assert.equal(user.totalPoint, 1);
        });

        it('리뷰만 작성 후 리뷰 내용만 변경시, 리뷰 이벤트 히스토리 table row 1개 유지', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({reviewId});
            chai.assert.equal(reviewHistory.length, 1);
        });
        after('테스트 리뷰 장소 제거', (done) => {
            helper.removePlace(placeId);
            done();
        });
        after('테스트 데이터 제거', (done) => {
            Promise.all([helper.removeUser(firstReviewUserId), helper.removeUser(userId)]);
            done();
        });
    });
    describe('[Scenario #3] Success: 기존 이벤트: 리뷰+사진 작성, 수정 이벤트:사진 삭제', () => {
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
        it('리뷰 수정 이벤트 성공시, HTTP Status 값은 200', (done) => {
            const attachedPhotoIds: string[] = [];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'MOD';
            const param = {type, action, reviewId, content: '[test] modify review!', attachedPhotoIds, userId};
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
        it('리뷰+사진 작성 후 사진 삭제시, total point 1', async () => {
            const user = await userRepo.readOne({userId});
            chai.assert.equal(user.totalPoint, 1);
        });

        it('리뷰+사진 작성 후 사진 삭제시, 리뷰 사진 table row 0 개', async () => {
            const review = await reviewPhotoRepo.read({reviewId});
            chai.assert.equal(review.length, 0);
        });
        it('리뷰+사진 작성 후 사진 삭제시, 리뷰 이벤트 히스토리 table operator records are plus, plus, minus', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({reviewId});
            let reviewOperators = reviewHistory.map((item) => item.operator);
            chai.assert.sameMembers(reviewOperators, ['plus', 'plus', 'minus']);
        });
        it('리뷰+사진 작성 후 사진 삭제시, 리뷰 이벤트 히스토리 table type records are review, photo_review', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({reviewId});
            let reviewTypes = reviewHistory.map((item) => item.type);
            chai.assert.sameMembers(reviewTypes, ['review', 'photo_review', 'photo_review']);
        });
        after('테스트 리뷰 장소 제거', (done) => {
            helper.removePlace(placeId);
            done();
        });
        after('테스트 데이터 제거', (done) => {
            Promise.all([helper.removeUser(firstReviewUserId), helper.removeUser(userId)]);
            done();
        });
    });
    describe('[Scenario #4] Success: 기존 이벤트: 리뷰+사진 작성, 수정 이벤트: 사진 변경', () => {
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
        it('리뷰 수정 이벤트 성공시, HTTP Status 값은 200', (done) => {
            const attachedPhotoIds: string[] = [uuidv4()];
            const type: EventType = 'REVIEW';
            const action: ActionType = 'MOD';
            const param = {type, action, reviewId, content: '[test] modify review!', attachedPhotoIds, userId};
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
        it('리뷰+사진 작성 후 리뷰 사진 변경시, total point 2 유지', async () => {
            const user = await userRepo.readOne({userId});
            chai.assert.equal(user.totalPoint, 2);
        });
        after('테스트 리뷰 장소 제거', (done) => {
            helper.removePlace(placeId);
            done();
        });
        after('테스트 리뷰&유저 제거', (done) => {
            Promise.all([helper.removeUser(firstReviewUserId), helper.removeUser(userId)]);
            done();
        });
    });
});

describe('리뷰 이벤트 수정: ERROR', () => {
    describe('시스템에 존재하지 않은 유저 Error', () => {
        let param = {
            type: 'REVIEW',
            action: 'MOD',
            reviewId: uuidv4(),
            content: 'test1',
            attachedPhotoIds: [],
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
        before('유저 추가 세팅', (done) => {
            helper.addNewUser(userId);
            done();
        });
        it('[#1] 리뷰 아이디가 시스템에 존재하지 않은 경우, HTTP Status 400을 반환', (done) => {
            const action: ActionType = 'MOD';
            let data = {type, action, reviewId: uuidv4(), content: '[test]second review', attachedPhotoIds: [], userId};
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
            action: 'MOD',
            reviewId: uuidv4(),
            content: 'test1',
            attachedPhotoIds: [],
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
            content: 'test1',
            attachedPhotoIds: [],
            userId: uuidv4(),
        };
        it('[#1] 리뷰 작성 내용 type is number, Bad Request Response 처리', (done) => {
            let content = null;
            chai.request(app)
                .post('/events')
                .send({...param, content})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(content)의 타입이 올바르지 않습니다`);
                    done();
                });
        });
        it('[#2] 리뷰 아이디 type is number, Bad Request Response 반환', (done) => {
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

        it('[#3] 유저 아이디 type is number, Bad Request Response 반환', (done) => {
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
            action: 'MOD',
            reviewId: uuidv4(),
            content: 'test1',
            attachedPhotoIds: [],
            userId: uuidv4(),
        };
        it('[#1] 리뷰 작성 내용 길이 한글자 미만일 경우, Bad Request Response 처리', (done) => {
            let content = '';
            chai.request(app)
                .post('/events')
                .send({...param, content})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(content)는 최소 1글자`);
                    done();
                });
        });
        it('[#2] 리뷰 아이디 한글자 미만인 경우, Bad Request Response 반환', (done) => {
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
