const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'localhost', // DB 호스트
    port: '3306', 
    user: 'dbid233',
    password: 'dbpass233',
    database: 'db24202',
    connectionLimit: 20,
    acquireTimeout: 15000

});

// DB 연결 테스트 함수
async function testConnection() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('DB에 성공적으로 연결되었습니다.');
    } catch (err) {
        console.error('DB 연결 실패:', err);
    } finally {
        if (conn) conn.release(); // 연결을 반환
    }
}

testConnection(); // 연결 테스트 실행

module.exports = pool; // 연결 풀을 모듈로 내보냄