const express = require('express');
const router = express.Router();
const db = require('../db');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key'; // JWT 토큰 (유효기간 1시간)
const REFRESH_SECRET = 'your_refresh_secret_key'; // 리프레시 토큰 (유효기간 1일)

const { v4: uuidv4 } = require('uuid'); // 이메일 인증을 위한 UUID 생성 모듈
const nodemailer = require('nodemailer'); // 이메일 인증을 위한 Nodemailer 모듈

// Nodemailer 설정
const transporter = nodemailer.createTransport({
    host: 'smtp.naver.com', // 네이버 SMTP 서버
    port: 587, // 네이버 SMTP 포트
    secure: false, // TLS 사용 시 false로 설정
    auth: {
        user: 'cyhh0719@naver.com', // 네이버 이메일 주소
        pass: 'Cyh07199@@' // 네이버에서 생성한 앱 비밀번호
    },
    tls: {
        rejectUnauthorized: false // SSL 인증 무시 (필요 시)
    }
});

// 이메일 중복확인 및 인증 링크 전송 API
router.post('/send-verification-link', async (req, res) => {
    const { userEmail } = req.body; 
    console.log('userEmail:', userEmail);

    try {
        // 1. 이메일 중복 확인
        const existingUser = await db.query('SELECT * FROM USER WHERE userEmail = ?', [userEmail]);

        if (existingUser.length > 0) {
            return res.status(409).json({ message: '이미 사용중인 이메일입니다.' });
        }

        // 2. 인증 토큰 생성 및 저장
        const token = uuidv4(); // 고유 토큰 생성

        // 토큰을 데이터베이스에 저장
        const insertResult = await db.query('INSERT INTO VERIFICATION_TOKENS (token, userEmail) VALUES (?, ?)', [token, userEmail]);
        //console.log(`Generated token for ${userEmail}: ${token}`);
        //console.log('Token insert result:', insertResult);

        // 3. 인증 링크 생성
        const verificationLink = `http://ceprj.gachon.ac.kr:60017/api/user/verify-email?token=${token}`;
        
        // 4. 이메일 전송
        await transporter.sendMail({
            from: 'cyhh0719@naver.com', // 발신자 이메일
            to: userEmail, // 수신자 이메일
            subject: '이메일 인증 링크',
            text: `다음 링크를 클릭하여 이메일 인증을 완료하세요: ${verificationLink}`
        });

        res.status(200).json({ message: '이메일 인증 링크가 전송되었습니다.' });
    } catch (error) {
        console.error('이메일 전송 오류:', error);
        res.status(500).json({ message: '이메일 인증 링크 전송에 실패했습니다.', error: error.message });
    }
});

// 이메일 인증 확인 API
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    console.log('Received token:', token);

    try {
        // 토큰 유효성 확인 (DB에서 확인)
        const [result] = await db.query('SELECT * FROM VERIFICATION_TOKENS WHERE token = ?', [token]);
        
        // 쿼리 결과 로그 추가
        console.log('Verification token query result:', result);

        if (!result) {
            console.log('Invalid or missing token:', token);
            return res.status(400).json({ message: '유효하지 않은 인증 링크입니다.' });
        }

        const userEmail = result.userEmail;

        if (!userEmail) {
            console.log('userEmail이 존재하지 않습니다.', result);
            return res.status(400).json({ message: '유효하지 않은 인증 링크입니다.' });
        }

        // 인증 완료 처리 (DB 업데이트)
        await db.query('INSERT INTO VERIFIED_EMAILS (userEmail) VALUES (?)', [userEmail]);
        console.log('INSERT INTO VERIFIED_EMAILS:', userEmail);

        // 인증 완료 후 토큰 삭제 (DB에서 삭제)
        await db.query('DELETE FROM VERIFICATION_TOKENS WHERE token = ?', [token]);
        console.log('Token deleted after verification:', token);

        res.status(200).json({ message: '이메일 인증이 완료되었습니다.' });
    } catch (error) {
        console.error('이메일 인증 처리 오류:', error);
        res.status(500).json({ message: '이메일 인증 처리에 실패했습니다.' });
    }
});


// 이메일 인증 상태 확인 API
router.get('/verify-status/:email', async (req, res) => {
    const { email } = req.params;
    console.log('94verify-status email:', email);

    try {
        // VERIFIED_EMAILS 테이블에서 인증된 이메일인지 확인
        console.log('98verify-status email:', email);
        const [result] = await db.query('SELECT * FROM VERIFIED_EMAILS WHERE userEmail = ?', [email]);
        console.log('verify-status query result:', result);

        // 쿼리 결과 확인 후 상세 응답 반환
        if (result) {
            return res.status(200).json({
                verified: true,
                message: "이메일 인증이 완료되었습니다.",
            });
        }

        return res.status(400).json({
            verified: false,
            message: "이메일이 인증되지 않았습니다.",
        });
    } catch (error) {
        console.error('이메일 인증 상태 확인 중 오류:', error);
        res.status(500).json({
            verified: false,
            message: "이메일 인증 상태 확인 중 오류가 발생했습니다.",
        });
    }
});

// 로그인 API
router.post('/login', async (req, res) => {
    const { userEmail, userPW } = req.body;
    console.log(`Received login request: email=${userEmail}, password=${userPW}`);

    try {
        // 데이터베이스에서 이메일로 사용자 검색
        const result = await db.query('SELECT * FROM USER WHERE userEmail = ?', [userEmail]);
        console.log('Query result:', result);

        if (!Array.isArray(result) || result.length === 0) {
            console.log('No user found with email:', userEmail);
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const user = result[0];
        
        // 비밀번호 비교 (대소문자 구분 없이 비교)
        if (!user.userPw || user.userPw !== userPW) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }
        console.log('user.userPw:', user.userPw)
        console.log('userPW:', userPW)

        // JWT 토큰 생성 (사용자 id와 이메일을 페이로드로 포함)
        const token = jwt.sign({ id: user.userId, email: user.userEmail }, JWT_SECRET, { expiresIn: '1h' });
        console.log('login_token:', token)

        // 리프레시 토큰 생성
        const refreshToken = jwt.sign({ id: user.userId, email: user.userEmail }, REFRESH_SECRET, { expiresIn: '1d' });
        console.log('login_refreshToken:', refreshToken)

        // 리프레시 토큰을 쿠키로 설정하여 클라이언트에 전달
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 });

        // 로그인 성공 시 토큰과 사용자 정보를 반환
        return res.status(200).json({
            message: '로그인 성공',
            token: token, // JWT 토큰 반환
            user: {
                id: user.userId,
                email: user.userEmail,
                username: user.userName,
                dogName: user.dogName
            }
        });
    } catch (err) {
        console.error('DB 쿼리 실패:', err);
        return res.status(500).json({ message: '서버 오류', error: err.message });
    }
});

module.exports = router;
