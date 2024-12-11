const express = require('express');
const session = require('express-session');
const cors = require('cors');
/* admin */
const path = require('path');
const adminRoutes = require('./routes/admin');
/* admin */
const userRoutes = require('./routes/user'); // user.js ê²½ë¡œë¥? ê°?? ¸??? ?‚¬?š©
const diagnosisRoutes = require('./routes/diagnosis'); // diagnosis.js ê²½ë¡œë¥? ê°?? ¸??? ?‚¬?š©
const mypageRoutes = require('./routes/mypage'); // mypage.js ê²½ë¡œë¥? ê°?? ¸??? ?‚¬?š©
const communityRoutes = require('./routes/community');
const db = require('./db'); // DB ?—°ê²?

const app = express();

app.use(session({
    secret: 'your-secret-key', // ?„¸?…˜ ë¹„ë?? ?‚¤ ?„¤? •
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS ?™˜ê²½ì—?„œë§? trueë¡? ?„¤? •
}));

const PORT = 60017;

// CORS ?„¤? •
app.use(cors({
    origin: '*', // ëª¨ë“  ?„ë©”ì¸ ?—ˆ?š©
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // ?—…ë¡œë“œ?œ ?ŒŒ?¼?“¤?„ ? •?  ê²½ë¡œë¡? ? œê³?

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
// public ê²½ë¡œ?— ?ŒŒ?¼ ? œê³?
// app.use(express.static('public'));

// React ë¹Œë“œ ê²°ê³¼ë¥? ? œê³?
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

// ?„œë²? ?‹¤?–‰
app.listen(PORT, async () => {
    try {
        await db.getConnection(); // DB ?—°ê²? ?…Œ?Š¤?Š¸
        console.log('DB?— ?„±ê³µì ?œ¼ë¡? ?—°ê²°ë˜?—ˆ?Šµ?‹ˆ?‹¤.');
    } catch (error) {
        console.error('DB ?—°ê²? ?˜¤ë¥?:', error);
    }
    console.log(`?„œë²„ê?? ${PORT} ?¬?Š¸?—?„œ êµ¬ë™?˜ê³? ?žˆ?Šµ?‹ˆ?‹¤.`);
});
