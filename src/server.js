const express = require('express');
const session = require('express-session');
const cors = require('cors');
/* admin */
const path = require('path');
const adminRoutes = require('./routes/admin');
/* admin */
const userRoutes = require('./routes/user'); // user.js 경로�? �??��??? ?��?��
const diagnosisRoutes = require('./routes/diagnosis'); // diagnosis.js 경로�? �??��??? ?��?��
const mypageRoutes = require('./routes/mypage'); // mypage.js 경로�? �??��??? ?��?��
const communityRoutes = require('./routes/community');
const db = require('./db'); // DB ?���?

const app = express();

app.use(session({
    secret: 'your-secret-key', // ?��?�� 비�?? ?�� ?��?��
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS ?��경에?���? true�? ?��?��
}));

const PORT = 60017;

// CORS ?��?��
app.use(cors({
    origin: '*', // 모든 ?��메인 ?��?��
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // ?��로드?�� ?��?��?��?�� ?��?�� 경로�? ?���?

app.use('/api/user', userRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/mypage', mypageRoutes);
app.use('/api/community', communityRoutes);

/* yonghwan */
// app.use('/admin', express.static(path.join('/home/t24202/svr/HK_test/Frontend/web/build')));
// app.get('/admin/*', (req, res) => {
//     res.sendFile(path.join('/home/t24202/svr/HK_test/Frontend/web/build', 'index.html'));
// });
/* yonghwan */

/* hyunwoo just enter admin login at / */
// public 경로?�� ?��?�� ?���?
// app.use(express.static('public'));

// React 빌드 결과�? ?���?
app.use(express.static(path.join('/home/t24202/svr/src/views/Frontend/web/build')));

app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});

app.use('/admin', adminRoutes);
app.get('*', (req, res) => {
    res.sendFile(path.join('/home/t24202/svr/src/views/Frontend/web/build', 'index.html'));
});
/* hyunwoo */

// ?���? ?��?��
app.listen(PORT, async () => {
    try {
        await db.getConnection(); // DB ?���? ?��?��?��
        console.log('DB?�� ?��공적?���? ?��결되?��?��?��?��.');
    } catch (error) {
        console.error('DB ?���? ?���?:', error);
    }
    console.log(`?��버�?? ${PORT} ?��?��?��?�� 구동?���? ?��?��?��?��.`);
});
