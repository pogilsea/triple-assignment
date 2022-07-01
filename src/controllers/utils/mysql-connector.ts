import * as mySQL from 'mysql';
import {OkPacket, Pool, PoolConnection} from 'mysql';
import {HTTP_RESPONSE_CODE} from '@controllers/utils/error-code';

export class MySQLConnection {
    private static instance: MySQLConnection;
    static getInstance() {
        if (!MySQLConnection.instance) {
            MySQLConnection.instance = new MySQLConnection();
        }
        return MySQLConnection.instance;
    }
    pool: Pool;
    constructor() {
        const connectOptions: mySQL.PoolConfig = {
            connectionLimit: 10,
            port: Number(process.env.MYSQL_PORT),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PWD,
            database: process.env.MYSQL_DATABASE_NAME,
            charset: 'utf8mb4',
            multipleStatements: true,
        };
        this.pool = mySQL.createPool(connectOptions);
    }
    getConnection = () => {
        return new Promise<PoolConnection>((resolve, reject) => {
            this.pool.getConnection(function (err, conn) {
                if (err) {
                    return reject({status: 500, ...err, level: 'critical'});
                }
                resolve(conn);
            });
        });
    };

    query = async <T>(queryString: string): Promise<T[]> => {
        const connection = await this.getConnection();
        return new Promise((resolve, reject) => {
            connection.query(queryString, function (error, results: T[]) {
                connection.release();
                if (error) {
                    console.log('query err', error);
                    reject({status: 500, ...error, level: 'critical'});
                } else {
                    resolve(results);
                }
            });
        });
    };

    //쿼리 타입이 write( insert, update, delete ) 일 경우 사용
    queryWrite = async (queryString: string): Promise<OkPacket> => {
        const connection = await this.getConnection();
        return new Promise((resolve, reject) => {
            connection.query(queryString, function (error, results: OkPacket) {
                connection.release();
                if (error) {
                    console.log('query err', error);
                    reject({status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR, level: 'critical', reason: error});
                } else {
                    resolve(results);
                }
            });
        });
    };
}
