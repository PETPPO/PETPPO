const express = require('express');
const router = express.Router();
const db = require('../db');
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const multer = require('multer');
const path = require('path');

// Multer 설정 (이미지 업로드 위치와 파일명 설정)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/t24202/svr/src/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// 게시글 작성 API
router.post('/post', jwtMiddleware, upload.single('imagePath'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, content, diseaseTag } = req.body;
        const imagePath = req.file ? req.file.path : null;

        const [userResult] = await db.query('SELECT userName FROM USER WHERE userId = ?', [userId]);
        const userName = userResult.userName;
        
        let imageUrl;
        if (!imagePath) {
            imageUrl = null;
        } else {
            const normalizedImagePath = imagePath.replace(/\\/g, '/');
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(normalizedImagePath)}`;
        }

        const result = await db.query(`
            INSERT INTO COMMUNITY (userId, userName, title, content, diseaseTag, imagePath, commentCount, postDate)    
            VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`, [userId, userName, title, content, diseaseTag, imageUrl]);

        if (!result || result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: '게시글 작성 중 문제가 발생했습니다.' });
        }

        return res.status(201).json({
            postId: result.insertId.toString(),
            success: true,
            message: '게시글이 성공적으로 작성되었습니다.'
        });
    } catch (error) {
        console.log('게시글 작성 중 오류:', error);
        return res.status(500).json({ success: false, message: '처리 중 문제가 발생했습니다.' });
    }
});

// 게시글 삭제 API
router.delete('/posts/:postId', jwtMiddleware, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // 현재 로그인한 사용자 ID

        await connection.beginTransaction();

        // 게시글 작성자 확인
        const [post] = await connection.query('SELECT userId FROM COMMUNITY WHERE postId = ?', [postId]);
        
        if (!post) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        if (post.userId !== userId) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: '게시글 삭제 권한이 없습니다.' });
        }

        // 게시글에 달린 모든 댓글과 답글, 알림까지 삭제
        await connection.query('DELETE FROM ALARM WHERE postId = ?', [postId]);
        await connection.query('DELETE FROM COMMENT WHERE postId = ? AND parentId IS NOT NULL', [postId]);
        await connection.query('DELETE FROM COMMENT WHERE postId = ?', [postId]);

        // 게시글 삭제
        const result = await connection.query('DELETE FROM COMMUNITY WHERE postId = ?', [postId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: '게시글 삭제에 실패했습니다.' });
        }

        await connection.commit();
        console.log('게시글 및 관련 댓글 삭제 완료:', postId);

        return res.status(200).json({
            success: true,
            message: '게시글과 관련 댓글이 성공적으로 삭제되었습니다.'
        });
    } catch (error) {
        await connection.rollback();
        console.log('게시글 삭제 중 오류:', error);
        return res.status(500).json({ success: false, message: '게시글 삭제 중 문제가 발생했습니다.' });
    } finally {
        connection.release();
    }
});


// 게시글 목록 조회 API
router.get('/posts', jwtMiddleware, async (req, res) => {
    try {
        //const { postId, diseaseTag } = req.body;
        const { diseaseTag } = req.query;
        console.log('diseaseTag:', diseaseTag);


        // 태그 선택 안되었을 때 게시글 전체 목록 조회
        if (!diseaseTag) {
            const results_noDiseaseTag = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= 1 ORDER BY postId DESC`);
            let rows_noDiseaseTag = results_noDiseaseTag;
            if (!Array.isArray(results_noDiseaseTag)) {
                rows_noDiseaseTag = [results_noDiseaseTag];
            }
            return res.status(201).json({
                success: true,
                message: "태그 없을 때 게시글 목록이 성공적으로 조회되었습니다.",
                posts: rows_noDiseaseTag
            });
        } else {
            // 단어 공백 작업
            const encodedDiseaseTag = decodeURIComponent(diseaseTag);
            console.log('encodedDiseaseTag:', encodedDiseaseTag);

            const cleanedDiseaseTag = encodedDiseaseTag.replace(/^#\s*|\s*$/g, '').replace(/\s+/g, ' ').trim(); 
            console.log('cleanedDiseaseTag:', cleanedDiseaseTag);

            const results_yesDiseaseTag = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= 1 AND diseaseTag = ? ORDER BY postId DESC`, [cleanedDiseaseTag]);
            console.log('posts_results:', results_yesDiseaseTag)

            if (!results_yesDiseaseTag || results_yesDiseaseTag.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "게시글을 찾을 수 없습니다."
                });
            }
            
            let rows_yesDiseaseTag = results_yesDiseaseTag;
            if (!Array.isArray(results_yesDiseaseTag)) {
                rows_yesDiseaseTag = [results_yesDiseaseTag];
            }

            return res.status(200).json({
                success: true,
                message: "태그 있을 때 게시글 목록이 성공적으로 조회되었습니다.",
                posts: rows_yesDiseaseTag
            });
        }
    } catch (error) {
        console.log('게시글 목록 조회 중 오류:', error);
        return res.status(500).json({ success: false, message: '처리 중 문제가 발생했습니다.' });
    }
});

// 특정 게시글 조회 API (댓글 포함)
router.get('/posts/:postId', jwtMiddleware, async (req, res) => {
    try {
        const postId = req.params.postId;
        const login_userId = req.user.id; // 현재 로그인한 사용자 ID
        console.log('login_userId:', login_userId);
        console.log('Requested postId:', postId); // postId 잘 넘어오는지 로그

        const results = await db.query(`
            SELECT c.postId, c.userId AS postUserId, c.userName AS postUserName, c.diseaseTag, c.title, c.content, c.postDate, c.imagePath, c.commentCount, u.userName,
                cm.commentId, cm.commentContent, cm.userId AS commentUserId, cm.commentDate, cm.parentId, u.userName AS commentUserName
            FROM COMMUNITY c
            LEFT JOIN COMMENT cm ON c.postId = cm.postId
            LEFT JOIN USER u ON cm.userId = u.userId
            WHERE c.postId = ?
            ORDER BY cm.commentDate ASC
        `, [postId]);

        const comments = results
        .filter(row => row.commentId !== null)
        .map(row => ({
            commentId: row.commentId,
            commentUserId: row.commentUserId,
            commentUserName: row.commentUserName,
            commentContent: row.commentContent,
            createdAt: row.commentDate,
            parentId: row.parentId
        }));

        /* [hyunwoo] 답글이 마지막에 달리는 오류 수정 */
        const groupedComments = [];
        const commentMap = new Map();

        comments.forEach(comment => {
            if (comment.parentId === null) {
                groupedComments.push(comment);
                commentMap.set(comment.commentId, comment);
            } else {
                const parentComment = commentMap.get(comment.parentId);
                if (parentComment) {
                    parentComment.replies = parentComment.replies || [];
                    parentComment.replies.push(comment);
                    console.log('parentComment:', parentComment);
                }
            }
        });
        console.log('groupedComments:', groupedComments);
        /* [hyunwoo] 답글이 마지막에 달리는 오류 수정 */

        const postDetail = results[0];
        //console.log('commentCount:', postDetail.commentCount);

        if (results.length > 0) {
            res.status(200).json({
                success: true,
                message: '게시글과 댓글이 성공적으로 조회되었습니다.',
                postDetail: {
                    postId: postDetail.postId,
                    postUserId: postDetail.postUserId,
                    diseaseTag: postDetail.diseaseTag,
                    title: postDetail.title,
                    content: postDetail.content,
                    createdAt: postDetail.postDate,
                    imagePath: postDetail.imagePath,
                    userName: postDetail.postUserName,
                    commentCount: postDetail.commentCount
                },
                comments: groupedComments,
                login_userId: login_userId
            });
        } else {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        } 

    } catch (error) {
        console.log('게시글 조회 중 오류:', error);
        return res.status(500).json({ success: false, message: '처리 중 문제가 발생했습니다.' });
    }
});

// 댓글 작성 API
router.post('/posts/:postId/comments', jwtMiddleware, async (req, res) => {
    try {
        const { commentContent } = req.body;
        const userId = req.user.id;
        const postId = req.params.postId;

        const result = await db.query(`
            INSERT INTO COMMENT (postId, userId, commentContent, commentDate)
            VALUES (?, ?, ?, NOW())
        `, [postId, userId, commentContent]);

        //댓글 알림 생성 부분
        const postOwner = await db.query(`SELECT userId FROM COMMUNITY WHERE postId = ?`, [postId]);
        if (postOwner[0] && postOwner[0].userId !== userId) {
            await db.query(`
                INSERT INTO ALARM (postId, commentId, userId, commentDate)
                VALUES (?, ?, ?, NOW())
            `, [postId, result.insertId, postOwner[0].userId]);
        }

        // COMMUNITY 테이블의 댓글 수(commentContent) 업데이트
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount + 1 WHERE postId = ?`, [postId]);

        return res.status(201).json({
            success: true,
            message: "댓글이 성공적으로 작성되었습니다.",
            commentId: result.insertId.toString()
        });
    } catch (error) {
        console.log('댓글 작성 중 오류:', error);
        return res.status(500).json({ success: false, message: '처리 중 문제가 발생했습니다.' });
    }
});

// 댓글 삭제 API(원 댓글 삭제 시 해당 댓글과 밑에 답글까지 같이 삭제)
router.delete('/comments/:commentId', jwtMiddleware, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        // 댓글 작성자와 요청자가 같은지 확인
        const [comment] = await db.query(`SELECT userId, postId FROM COMMENT WHERE commentId = ?`, [commentId]);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "댓글을 찾을 수 없습니다."
            });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "댓글 삭제 권한이 없습니다."
            });
        }

        const postId = comment.postId;

        // 알림 테이블에서 해당 댓글과 답글들 관련된 알림 삭제
        await db.query(`DELETE FROM ALARM WHERE commentId = ? OR parentId = ?`, [commentId, commentId]);

        // 답글 삭제
        const replyDeletionResult = await db.query(`DELETE FROM COMMENT WHERE parentId = ?`, [commentId]);

        // 댓글 삭제
        const result = await db.query(`DELETE FROM COMMENT WHERE commentId = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "댓글을 찾을 수 없습니다."
            });
        }

        // COMMUNITY 테이블의 댓글 수(commentCount) 업데이트 (댓글과 답글 개수만큼 감소)
        const totalCommentsDeleted = 1 + (replyDeletionResult.affectedRows || 0); // 1은 본 댓글, 나머지는 답글 개수
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount - ? WHERE postId = ?`, [totalCommentsDeleted, postId]);

        console.log("댓글 및 답글 삭제 완료:", commentId);
        
        return res.status(200).json({
            success: true,
            message: "댓글 및 답글이 성공적으로 삭제되었습니다."
        });
    } catch (error) {
        console.log('댓글 삭제 중 오류:', error);
        return res.status(500).json({ success: false, message: '댓글 삭제 중 문제가 발생했습니다.' });
    }
});


// 답글 작성 API
router.post('/comments/:parentId/reply', jwtMiddleware, async (req, res) => {
    try {
        const parentId = req.params.parentId;
        const { commentContent } = req.body;
        const userId = req.user.id;

        const parentComment = await db.query(`SELECT postId, userId AS commentOwnerId FROM COMMENT WHERE commentId = ?`, [parentId]);

        if (!parentComment || parentComment.length === 0) {
            return res.status(404).json({
                success: false,
                message: "댓글을 찾을 수 없습니다."
            });
        }

        const postId = parentComment[0].postId;
        const commentOwnerId = parentComment[0].commentOwnerId;

        // 답글 생성
        const result = await db.query(`
            INSERT INTO COMMENT (postId, userId, commentContent, parentId, commentDate)
            VALUES (?, ?, ?, ?, NOW())
        `, [postId, userId, commentContent, parentId]);

        console.log("Reply Insert Result:", result); // 답글 생성 확인 로그

        // 답글 알림 생성: 답글 대상자에게 알림
        if (commentOwnerId !== userId) {  // 본인이 아닌 경우에만 알림 생성
            await db.query(`
                INSERT INTO ALARM (postId, commentId, parentId, userId, commentDate)
                VALUES (?, ?, ?, ?, NOW())
            `, [postId, result.insertId, parentId, commentOwnerId]);
            console.log("Reply Notification Created for User:", commentOwnerId); // ?ëŚ? ??ą ??¸ ëĄęˇ¸
        }

        // COMMUNITY 테이블의 답글 수(commentContent) 업데이트
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount + 1 WHERE postId = ?`, [postId]);

        return res.status(201).json({
            success: true,
            message: "답글이 성공적으로 작성되었습니다.",
            replyId: result.insertId.toString()
        });
    } catch (error) {
        console.log('답글 작성 중 오류:', error);
        return res.status(500).json({ success: false, message: '처리 중 문제가 발생했습니다.' });
    }
});

// 답글 삭제 API
router.delete('/comments/:commentId/reply', jwtMiddleware, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        // 답글인지 확인
        const [comment] = await db.query(`SELECT parentId, userId, postId FROM COMMENT WHERE commentId = ?`, [commentId]);
        if (!comment || !comment.parentId) {
            return res.status(400).json({
                success: false,
                message: "해당 댓글은 답글이 아니거나 존재하지 않습니다."
            });
        }

        // 답글 작성자와 요청자가 같은지 확인
        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "답글 삭제 권한이 없습니다."
            });
        }

        const postId = comment.postId;

        // 알림 테이블에서 해당 답글과 관련된 알림 삭제
        await db.query(`DELETE FROM ALARM WHERE commentId = ?`, [commentId]);

        // 답글 삭제
        const result = await db.query(`DELETE FROM COMMENT WHERE commentId = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "답글을 찾을 수 없습니다."
            });
        }

        // COMMUNITY 테이블의 댓글 수(commentContent) 감소
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount - 1 WHERE postId = ?`, [postId]);

        console.log("답글 삭제 완료:", commentId);
        
        return res.status(200).json({
            success: true,
            message: "답글이 성공적으로 삭제되었습니다."
        });
    } catch (error) {
        console.log('답글 삭제 중 오류:', error);
        return res.status(500).json({ success: false, message: '답글 삭제 중 문제가 발생했습니다.' });
    }
});

// 알림 조회 API
router.get('/alarms', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const alarms = await db.query(`
            SELECT a.alarmId, a.postId, a.commentId, a.parentId, c.title, a.commentDate
            FROM ALARM a
            LEFT JOIN COMMUNITY c ON a.postId = c.postId
            WHERE a.userId = ?
            ORDER BY a.commentDate DESC
        `, [userId]);

        return res.status(200).json({
            success: true,
            alarms
        });
    } catch (error) {
        console.log('알림 조회 중 오류:', error);
        return res.status(500).json({ success: false, message: '알림 조회에 실패했습니다.' });
    }
});



// 알림 읽음 처리 API
router.put('/alarms/:alarmId/read', jwtMiddleware, async (req, res) => {
    try {
        const alarmId = req.params.alarmId;
        const userId = req.user.id;  // JWT에서 추출한 로그인한 사용자 ID

        // 알림이 해당 사용자의 것인지 확인
        const [alarm] = await db.query(`
            SELECT * FROM ALARM WHERE alarmId = ? AND userId = ?
        `, [alarmId, userId]);

        if (!alarm) {
            return res.status(403).json({ success: false, message: '?´?š ?ëŚźě ???? ęśí?´ ??ľ??¤.' });
        }

        // 알림 읽음 처리
        const result = await db.query(`
            UPDATE ALARM SET isRead = 1 WHERE alarmId = ?
        `, [alarmId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '?ëŚźě ě°žě ? ??ľ??¤.' });
        }

        // 알림과 관련된 postId, isRead 반환
        return res.status(200).json({ 
            success: true, 
            message: '알림을 읽음 처리했습니다.', 
            postId: alarm.postId,
            isRead: 1
        });
    } catch (error) {
        console.log('알림 읽음 처리 중 오류:', error);
        return res.status(500).json({ success: false, message: '알림 읽음 처리에 실패했습니다.' });
    }
});

module.exports = router;
