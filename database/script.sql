create table place
(
    placeId varchar(64) not null comment '장소 아이디'
        primary key
)
    comment '장소 테이블';

create table user
(
    userId     varchar(64)   not null comment '유저 id'
        primary key,
    totalPoint int default 0 null comment '누적 리뷰 포인트'
)
    comment '회원 테이블';

create table review
(
    reviewId  varchar(64)                        not null comment '리뷰 아이디'
        primary key,
    placeId   varchar(64)                        null comment '장소 아이디',
    userId    varchar(64)                        null comment '유저아이디',
    content   text                               null,
    createdAt datetime default CURRENT_TIMESTAMP null comment '리뷰 생성 시간',
    constraint review_place_placeId_fk
        foreign key (placeId) references place (placeId)
            on delete set null,
    constraint review_user_userId_fk
        foreign key (userId) references user (userId)
            on delete cascade
)
    comment '리뷰 테이블';

create table review_photo
(
    photoId  varchar(64) not null comment '사진 아이디'
        primary key,
    reviewId varchar(64) null comment '리뷰 아이디',
    constraint review_photo_review_reviewId_fk
        foreign key (reviewId) references review (reviewId)
            on delete cascade
)
    comment '리뷰 사진 테이블';

create table review_point_history
(
    id        int auto_increment
        primary key,
    userId    varchar(64)                                           null comment '유저 id',
    reviewId  varchar(64)                                           null comment '리뷰 id',
    point     int      default 1                                    null comment '지급 포인트 amount',
    operator  enum ('plus', 'minus')                                null comment '포인트 증감 여부',
    memo      varchar(64)                                           null comment '포인트 증감 내역 사유',
    createdAt datetime default CURRENT_TIMESTAMP                    null comment '포인트 변동 일자',
    type      enum ('review', 'photo_review', 'first_place_review') null,
    constraint review_point_history_review_reviewId_fk
        foreign key (reviewId) references review (reviewId)
            on delete set null,
    constraint review_point_history_user_userId_fk
        foreign key (userId) references user (userId)
            on delete cascade
)
    comment '리뷰 포인트 내역 테이블';
