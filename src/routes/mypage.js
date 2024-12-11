const express = require('express');
const router = express.Router();
const db = require('../db'); // 데이터베이스 모듈 가져오기 (연결 설정)
const jwtMiddleware = require('../middlewares/jwtMiddleware'); // JWT 미들웨어

// 사용자 이름 조회 API
router.get('/username', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // JWT에서 추출된 사용자 ID

        const query = 'SELECT userName FROM USER WHERE userId = ?';
        const [result] = await db.query(query, [userId]);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: '사용자 정보를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            message: '사용자 이름 조회 성공',
            userName: result.userName
        });
    } catch (error) {
        console.error('사용자 이름 조회 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: '사용자 이름 조회에 실패했습니다.'
        });
    }
});

// 반려견 이름 조회 API
router.get('/dogname', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // JWT에서 추출된 사용자 ID

        const query = 'SELECT dogName FROM USER WHERE userId = ?';
        const [result] = await db.query(query, [userId]);

        if (!result || !result.dogName) {
            return res.status(404).json({
                success: false,
                message: '반려견 정보를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            message: '반려견 이름 조회 성공',
            dogName: result.dogName
        });
    } catch (error) {
        console.error('반려견 이름 조회 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: '반려견 이름 조회에 실패했습니다.'
        });
    }
});

// 로그아웃은 프론트 단에서 처리(jwt 토큰 삭제하는 방식)

// 회원탈퇴 API
router.delete('/withdraw', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // JWT에서 추출한 사용자 ID를 사용

        const query = 'DELETE FROM USER WHERE userId = ?';
        const result = await db.query(query, [userId]); // 수정된 부분

        console.log('쿼리 실행 중');

        if (!result || result.affectedRows === 0) { // 결과가 없거나 삭제된 행이 없을 때
            console.log('사용자 정보 없음');
            return res.status(404).json({
                success: false,
                message: '사용자 정보를 찾을 수 없습니다.',
                property: 404
            });
        }

        console.log('회원 탈퇴 성공');
        return res.status(200).json({
            success: true,
            message: '회원탈퇴 되었습니다.',
            property: 200
        });
    } catch (error) {
        console.log('회원탈퇴 처리 중 오류:', error);
        return res.status(500).json({ success: false, message: '회원탈퇴 처리에 실패했습니다.' });
    }
});

// 내가 쓴 글 조회 API
router.get('/userpost', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;  // JWT 토큰에서 추출된 사용자 ID 사용
        
        const query = 'SELECT * FROM COMMUNITY WHERE userId = ?';
        
        // async/await 형태로 db.query 실행
        const results = await db.query(query, [userId]);

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: '작성한 게시글이 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            message: '게시글 조회 성공',
            posts: results
        });

    } catch (error) {
        console.error('내가 쓴 글 조회 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: '처리 중 문제가 발생했습니다.'
        });
    }
});

// 내가 쓴 글 삭제 API
router.delete('/userpost_delete/:postId', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;  // JWT 토큰에서 추출된 사용자 ID 사용
        const postId = req.params.postId;

        const query = 'DELETE FROM COMMUNITY WHERE userId = ? AND postId = ?';

        // async/await 형태로 db.query 실행
        const results = await db.query(query, [userId, postId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '삭제할 게시글이 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            message: '게시글이 성공적으로 삭제되었습니다.'
        });

    } catch (error) {
        console.error('내가 쓴 글 삭제 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: '내가 쓴 글 삭제에 실패했습니다.'
        });
    }
});

module.exports = router;