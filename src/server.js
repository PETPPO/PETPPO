const express = require('express');
const session = require('express-session');
const cors = require('cors');
/* admin */
const path = require('path');
const adminRoutes = require('./routes/admin');
/* admin */
const userRoutes = require('./routes/user'); // user.js κ²½λ‘λ₯? κ°?? Έ??? ?¬?©
const diagnosisRoutes = require('./routes/diagnosis'); // diagnosis.js κ²½λ‘λ₯? κ°?? Έ??? ?¬?©
const mypageRoutes = require('./routes/mypage'); // mypage.js κ²½λ‘λ₯? κ°?? Έ??? ?¬?©
const communityRoutes = require('./routes/community');
const db = require('./db'); // DB ?°κ²?

const app = express();

app.use(session({
    secret: 'your-secret-key', // ?Έ? λΉλ?? ?€ ?€? 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS ?κ²½μ?λ§? trueλ‘? ?€? 
}));

const PORT = 60017;

// CORS ?€? 
app.use(cors({
    origin: '*', // λͺ¨λ  ?λ©μΈ ??©
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // ?λ‘λ? ??Ό?€? ? ?  κ²½λ‘λ‘? ? κ³?

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
// public κ²½λ‘? ??Ό ? κ³?
// app.use(express.static('public'));

// React λΉλ κ²°κ³Όλ₯? ? κ³?
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

// ?λ²? ?€?
app.listen(PORT, async () => {
    try {
        await db.getConnection(); // DB ?°κ²? ??€?Έ
        console.log('DB? ?±κ³΅μ ?Όλ‘? ?°κ²°λ??΅??€.');
    } catch (error) {
        console.error('DB ?°κ²? ?€λ₯?:', error);
    }
    console.log(`?λ²κ?? ${PORT} ?¬?Έ?? κ΅¬λ?κ³? ??΅??€.`);
});
