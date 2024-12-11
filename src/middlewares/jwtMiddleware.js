const jwt = require('jsonwebtoken');

// JWT 인증 미들웨어
const jwtMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    //console.log('authHeader:' , authHeader);
    if (!authHeader) {
        console.log('토큰이 제공되지 않았습니다.');
        return res.status(401).json({ message: '토큰이 제공되지 않았습니다.' });
    }

    // 토큰 파싱: 'Bearer <token>' 형식에서 토큰 부분만 추출
    const token = authHeader.split(' ')[1];
    //console.log('Parsed Token:', token);
    
    if (!token) {
        console.log('토큰 형식이 올바르지 않습니다.');
        return res.status(401).json({ message: '토큰 형식이 올바르지 않습니다.' });
    }

    try {
        // 토큰 검증 및 사용자 정보 추출
        const decoded = jwt.verify(token, 'your_secret_key');
        //console.log('Decoded Token:', decoded);
        req.user = decoded; // 사용자 정보를 req 객체에 저장
        next(); // 다음 미들웨어 또는 라우트 핸들러로 이동
    } catch (error) {
        console.log('유효하지 않은 토큰:', error.message);
        return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

module.exports = jwtMiddleware;
