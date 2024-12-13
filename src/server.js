const express = require('express');
const session = require('express-session');
const cors = require('cors');
/* admin */
const path = require('path');
const adminRoutes = require('./routes/admin');
/* admin */
const userRoutes = require('./routes/user'); // user.js 경로에 연결하여 사용
const diagnosisRoutes = require('./routes/diagnosis'); // diagnosis.js 경로에 연결하여 사용
const mypageRoutes = require('./routes/mypage'); // mypage.js 경로에 연결하여 사용
const communityRoutes = require('./routes/community');
const db = require('./db'); // DB 연결

const app = express();

app.use(session({
    secret: 'your-secret-key', // 세션 비밀 키 설정
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS 환경에서만 true로 설정
}));

const PORT = 60017;

// CORS 설정
app.use(cors({
    origin: '*', // 모든 도메인 허용
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // 업로드된 파일들을 정적 경로로 제공

app.use('/api/user', userRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/mypage', mypageRoutes);
app.use('/api/community', communityRoutes);

// React 빌드 결과를 제공
app.use(express.static(path.join('/home/t24202/svr/src/views/Frontend/web/build')));

app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});

app.use('/admin', adminRoutes);
app.get('*', (req, res) => {
    res.sendFile(path.join('/home/t24202/svr/src/views/Frontend/web/build', 'index.html'));
});

// 서버 실행
app.listen(PORT, async () => {
    try {
        await db.getConnection(); // DB 연결 테스트
        console.log('DB에 성공적으로 연결되었습니다.');
    } catch (error) {
        console.error('DB 연결 오류:', error);
    }
    console.log(`서버가 ${PORT} 포트에서 구동 중입니다.`);
});
