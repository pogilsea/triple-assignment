import 'module-alias/register';
import chai from 'chai';
import app from '../src/app';
import {before} from 'mocha';
import {v4 as uuidv4} from 'uuid';
import {UserRepository} from '@controllers/repositories/user';
import {ReviewPhotoRepository, ReviewPointHistoryRepository, ReviewRepository} from '@controllers/repositories/review';
import {ReviewEventTestHelper} from './helpers/review-event';
import {ActionType, EventType} from '@services/review-event.entity';
import chaiHttp = require('chai-http');

process.env.NODE_ENV = 'debug';
chai.use(chaiHttp);
chai.should();
const helper = new ReviewEventTestHelper();

describe('리뷰 이벤트 추가: SUCCESS', () => {
    const userRepo = new UserRepository();
    const reviewPhotoRepo = new ReviewPhotoRepository();
    const reviewRepo = new ReviewRepository();
    const reviewPointHistoryRepo = new ReviewPointHistoryRepository();
    describe('[Scenario #1] 리뷰만 작성(특정장소 첫 리뷰X, 사진 추가 X)', () => {
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
        before((done) => {
            helper.addNewUser(userId);
            done();
        });

        before((done) => {
            helper.addNewPlace(placeId);
            done();
        });
        it('리뷰 이벤트 추가 성공시, HTTP Status 값은 200', (done) => {
            const param = {
                type: 'REVIEW',
                action: 'ADD',
                reviewId,
                content: 'test!!',
                attachedPhotoIds: [],
                userId,
                placeId,
            };
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
        it('리뷰만 작성시, 포인트 +1', async () => {
            const user = await userRepo.readOne({userId});
            chai.assert.equal(user.totalPoint, 1);
        });
        it('리뷰만 작성시, 리뷰 table row 1개 추가', async () => {
            const reviews = await reviewRepo.read({reviewId});
            chai.assert.equal(reviews.length, 1);
        });

        it('리뷰만 작성시, 리뷰 이벤트 히스토리 table operator record is plus', async () => {
            const review = await reviewPointHistoryRepo.readOne({reviewId});
            chai.assert.equal(review.operator, 'plus');
        });
        it('리뷰만 작성시, 리뷰 이벤트 히스토리 table type record is review', async () => {
            const review = await reviewPointHistoryRepo.readOne({reviewId});
            chai.assert.equal(review.type, 'review');
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

    describe('[Scenario #2] 리뷰+사진 작성', () => {
        const reviewId = uuidv4();
        const userId = uuidv4();
        const firstReviewUserId = uuidv4();
        const placeId = '2e4baf1c-5acb-4efb-a1af-eddada31b00f';
        const param = {
            type: 'REVIEW',
            action: 'ADD',
            reviewId,
            content: ' !',
            attachedPhotoIds: ['e4d1a64e-a531-46de-88d0-ff0ed70c0bb8', 'afb0cef2-851d-4a50-bb07-9cc15cbdc332'],
            userId,
            placeId,
        };
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
        before('테스트 초기값 세팅', async () => {
            await helper.addNewPlace(placeId);
            await helper.addNewUser(userId);
        });

        it('리뷰+사진 추가 성공시, HTTP Status 값은 200', (done) => {
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
        it('리뷰+사진 작성시, 포인트 +2', async () => {
            const user = await userRepo.readOne({userId});
            chai.assert.equal(user.totalPoint, 2);
        });

        it('리뷰+사진 작성시, 사진수 만큼 리뷰 사진 table row 추가', async () => {
            const reviewPhotos = await reviewPhotoRepo.read({reviewId});
            chai.assert.equal(reviewPhotos.length, param.attachedPhotoIds.length);
        });

        it('리뷰+사진 작성시, 리뷰 이벤트 히스토리 table operator records are plus, plus', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({reviewId});
            let reviewOperators = reviewHistory.map((item) => item.operator);
            chai.assert.sameMembers(reviewOperators, ['plus', 'plus']);
        });
        it('리뷰+사진 작성시, 리뷰 이벤트 히스토리 table type record are review, photo_review', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({reviewId});
            let reviewTypes = reviewHistory.map((item) => item.type);
            chai.assert.sameMembers(reviewTypes, ['review', 'photo_review']);
        });
        after('테스트 장소 제거', (done) => {
            helper.removePlace(placeId);
            done();
        });
        after('테스트 유저&리뷰 제거', (done) => {
            Promise.all([helper.removeUser(firstReviewUserId), helper.removeUser(userId)]);
            done();
        });
    });

    describe('[Scenario #3] 리뷰+사진+첫 특정장소 리뷰 작성', () => {
        const reviewId = uuidv4();
        const placeId = uuidv4();
        const userId = uuidv4();
        const param = {
            type: 'REVIEW',
            action: 'ADD',
            reviewId,
            content: ' !',
            attachedPhotoIds: [uuidv4(), uuidv4()],
            userId,
            placeId,
        };
        before((done) => {
            helper.addNewUser(userId);
            done();
        });
        before((done) => {
            helper.addNewPlace(placeId);
            done();
        });
        it('리뷰+사진+ 첫 여행지 리뷰 추가 성공시, HTTP Status 값은 200', (done) => {
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

        it('리뷰+사진+첫 특정장소 리뷰 작성시, 포인트 +3', async () => {
            const user = await userRepo.readOne({userId});
            chai.assert.equal(user.totalPoint, 3);
        });

        it('리뷰+사진+첫 특정장소 리뷰 작성시, 리뷰 이벤트 히스토리 table operator records are plus, plus, plus', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({reviewId});
            let reviewOperators = reviewHistory.map((item) => item.operator);
            chai.assert.sameMembers(reviewOperators, ['plus', 'plus', 'plus']);
        });
        it('리뷰+사진+첫 특정장소 리뷰 작성시, 리뷰 이벤트 히스토리 table type record are review, photo_review, first_place_review', async () => {
            const reviewHistory = await reviewPointHistoryRepo.read({reviewId});
            let reviewTypes = reviewHistory.map((item) => item.type);
            chai.assert.sameMembers(reviewTypes, ['review', 'photo_review', 'first_place_review']);
        });
        after('테스트 장소 제거', (done) => {
            helper.removePlace(placeId);
            done();
        });
        after('테스트 유저&리뷰 제거', (done) => {
            helper.removeUser(userId);
            done();
        });
    });
});
describe('리뷰 이벤트 추가: ERROR', () => {
    describe('후기 중복 작성', () => {
        const userId = uuidv4();
        const placeId = uuidv4();
        const type: EventType = 'REVIEW';
        const action: ActionType = 'ADD';
        before('같은 장소 후기 사전 추가 세팅', async () => {
            const reviewId = uuidv4();
            const attachedPhotoIds: string[] = [];
            await helper.addNewPlace(placeId);
            await helper.addNewUser(userId);
            const param = {type, action, reviewId, content: '[test]first review', attachedPhotoIds, userId, placeId};
            await chai.request(app).post('/events').send(param);
        });
        it('[#1] 이미 같은 장소에 리뷰를 작성한 경우, HTTP Status 400을 반환', (done) => {
            let data = {type, action, reviewId: uuidv4(), content: '[test]second review', attachedPhotoIds: [], userId, placeId};
            console.log('request data', data);
            chai.request(app)
                .post('/events')
                .send(data)
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    console.log('request res', res.body);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, '해당 장소에 이미 리뷰를 작성한 이력이 있습니다.');
                    done();
                });
        });
        after('테스트 장소 제거', (done) => {
            helper.removePlace(placeId);
            done();
        });
        after('테스트 유저&리뷰 제거', (done) => {
            helper.removeUser(userId);
            done();
        });
    });
    describe('시스템에 존재하지 않은 유저 Error', () => {
        let param = {
            type: 'REVIEW',
            action: 'ADD',
            reviewId: uuidv4(),
            content: 'test1',
            attachedPhotoIds: [],
            userId: uuidv4(),
            placeId: uuidv4(),
        };
        it('[#1] 유저 아이디가 시스템에 존재하지 않은 경우, Bad Request Response 반환', (done) => {
            chai.request(app)
                .post('/events')
                .send(param)
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.equal(resultMessage, '시스템에 존재하지 않은 사용자 입니다.');
                    done();
                });
        });
    });
    describe('시스템에 존재하지 않은 장소 Error', () => {
        const userId = uuidv4();
        let param = {
            type: 'REVIEW',
            action: 'ADD',
            reviewId: uuidv4(),
            content: 'test1',
            attachedPhotoIds: [],
            userId,
            placeId: uuidv4(),
        };
        before('유저 세팅', (done) => {
            helper.addNewUser(userId);
            done();
        });
        it('[#1] 장소 아이디가 시스템에 존재하지 않은 경우, Bad Request Response 반환', (done) => {
            chai.request(app)
                .post('/events')
                .send(param)
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.equal(resultMessage, '시스템에 존재하지 여행지 입니다.');
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
            action: 'ADD',
            reviewId: uuidv4(),
            content: 'test1',
            attachedPhotoIds: [],
            userId: uuidv4(),
            placeId: uuidv4(),
        };
        it('[#1] 리뷰 작성 내용 누락시, Bad Request Response 처리', (done) => {
            let content = undefined;
            chai.request(app)
                .post('/events')
                .send({...param, content})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(content)이 존재하지 않습니다`);
                    done();
                });
        });
        it('[#2] 리뷰 아이디 누락시, Bad Request Response 반환', (done) => {
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

        it('[#3] 유저 아이디 누락시, Bad Request Response 반환', (done) => {
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
        it('[#4] 장소 아이디 누락시, Bad Request Response 반환', (done) => {
            let placeId = undefined;
            chai.request(app)
                .post('/events')
                .send({...param, placeId})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(placeId)이 존재하지 않습니다`);
                    done();
                });
        });
        it('[#5] action 누락시, Bad Request Response 반환', (done) => {
            let action = undefined;
            chai.request(app)
                .post('/events')
                .send({...param, action})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `지정된 리뷰 액션 값을 입력해주세요(allowed values: ["ADD","MOD","DELETE"])`);
                    done();
                });
        });
        it('[#6] type 누락시, Bad Request Response 반환', (done) => {
            let type = undefined;
            chai.request(app)
                .post('/events')
                .send({...param, type})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(type)이 존재하지 않습니다`);
                    done();
                });
        });
    });
    describe('Request Body 잘못 입력: Type error', () => {
        let param = {
            type: 'REVIEW',
            action: 'ADD',
            reviewId: uuidv4(),
            content: 'test1',
            attachedPhotoIds: [],
            userId: uuidv4(),
            placeId: uuidv4(),
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
        it('[#4] 장소 아이디 type is number, Bad Request Response 반환', (done) => {
            let placeId = 123;
            chai.request(app)
                .post('/events')
                .send({...param, placeId})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `(placeId)의 타입이 올바르지 않습니다`);
                    done();
                });
        });
    });
    describe('Request Body 잘못 입력: value 최소 길이', () => {
        let param = {
            type: 'REVIEW',
            action: 'ADD',
            reviewId: uuidv4(),
            content: 'test1',
            attachedPhotoIds: [],
            userId: uuidv4(),
            placeId: uuidv4(),
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
    describe('Request Body 잘못 입력: enum value', () => {
        let param = {
            type: 'REVIEW',
            action: 'ADD',
            reviewId: uuidv4(),
            content: 'test1',
            attachedPhotoIds: [],
            userId: uuidv4(),
            placeId: uuidv4(),
        };
        it('[#1] 리뷰 액션 값이 지정된 값이 아닐 경우, Bad Request Response 처리', (done) => {
            let action = 'test';
            chai.request(app)
                .post('/events')
                .send({...param, action})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.include(resultMessage, `지정된 리뷰 액션 값을 입력해주세요(allowed values: ["ADD","MOD","DELETE"])`);
                    done();
                });
        });
        it('[#2] Request 타입 값이 지정된 값이 아닐 경우, Bad Request Response 반환', (done) => {
            let type = 'test';
            chai.request(app)
                .post('/events')
                .send({...param, type})
                .end((err, res) => {
                    if (err) console.log('Test Error Message:', err);
                    const status = res.status;
                    const resultMessage = res.body.resultMessage;
                    chai.assert.equal(status, 400);
                    chai.assert.equal(resultMessage, '지정된 Request type 값을 입력해주세요(allowed values: ["REVIEW"])');
                    done();
                });
        });
    });
});
