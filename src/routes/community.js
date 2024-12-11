const express = require('express');
const router = express.Router();
const db = require('../db');
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const multer = require('multer');
const path = require('path');

// Multer ?��?�� (?��미�?? ?��로드 ?��치�?? ?��?���? ?��?��)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/t24202/svr/src/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// 게시�? ?��?�� API
router.post('/post', jwtMiddleware, upload.single('imagePath'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, content, diseaseTag } = req.body;
        const imagePath = req.file ? req.file.path : null;

        const [userResult] = await db.query('SELECT userName FROM USER WHERE userId = ?', [userId]);
        const userName = userResult.userName;
        
        /* before */
        /*
        if (!imagePath) {
            return res.status(400).json({ message: '?��미�?? 경로�? ?��못되?��?��?��?��.' });
        }

        const normalizedImagePath = imagePath.replace(/\\/g, '/');
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(normalizedImagePath)}`;
        */
        /* before */

        /* after */
        let imageUrl;
        if (!imagePath) {
            imageUrl = null;
        } else {
            const normalizedImagePath = imagePath.replace(/\\/g, '/');
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(normalizedImagePath)}`;
        }
        /* after */

        const result = await db.query(`
            INSERT INTO COMMUNITY (userId, userName, title, content, diseaseTag, imagePath, commentCount, postDate)    
            VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`, [userId, userName, title, content, diseaseTag, imageUrl]);

        if (!result || result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: '게시�? ?��?�� �? 문제�? 발생?��?��?��?��.' });
        }

        return res.status(201).json({
            postId: result.insertId.toString(),
            success: true,
            message: '게시�??�� ?��공적?���? ?��?��?��?��?��?��?��.'
        });
    } catch (error) {
        console.log('게시�? ?��?�� �? ?���?:', error);
        return res.status(500).json({ success: false, message: '처리 �? 문제�? 발생?��?��?��?��.' });
    }
});

// 게시�? ?��?�� API
router.delete('/posts/:postId', jwtMiddleware, async (req, res) => {
    const connection = await db.getConnection(); // ?��?��?��?�� ?��?��?�� ?��?�� DB ?���?
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // ?��?�� 로그?��?�� ?��?��?�� ID

        await connection.beginTransaction(); // ?��?��?��?�� ?��?��

        // 게시�? ?��?��?�� ?��?��
        const [post] = await connection.query('SELECT userId FROM COMMUNITY WHERE postId = ?', [postId]);
        
        if (!post) {
            await connection.rollback(); // 게시�??�� ?��?�� 경우 롤백
            return res.status(404).json({ success: false, message: '게시�??�� 찾을 ?�� ?��?��?��?��.' });
        }

        if (post.userId !== userId) {
            await connection.rollback(); // ?��?��?���? ?��?�� 경우 롤백
            return res.status(403).json({ success: false, message: '게시�? ?��?�� 권한?�� ?��?��?��?��.' });
        }

        
        await connection.query('DELETE FROM ALARM WHERE postId = ?', [postId]);
        // 게시�??�� ?���? 모든 ?���?�? ?���? ?��?��
        await connection.query('DELETE FROM COMMENT WHERE postId = ? AND parentId IS NOT NULL', [postId]);
        await connection.query('DELETE FROM COMMENT WHERE postId = ?', [postId]);

        // 게시�? ?��?��
        const result = await connection.query('DELETE FROM COMMUNITY WHERE postId = ?', [postId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // ?��?�� ?��?�� ?�� 롤백
            return res.status(404).json({ success: false, message: '게시�? ?��?��?�� ?��?��?��?��?��?��.' });
        }

        await connection.commit(); // ?��?�� ?���? ?�� 커밋
        console.log('게시�? �? �??�� ?���? ?��?�� ?���?:', postId);

        return res.status(200).json({
            success: true,
            message: '게시�?�? �??�� ?���??�� ?��공적?���? ?��?��?��?��?��?��?��.'
        });
    } catch (error) {
        await connection.rollback(); // ?���? 발생 ?�� 롤백
        console.log('게시�? ?��?�� �? ?���?:', error);
        return res.status(500).json({ success: false, message: '게시�? ?��?�� �? 문제�? 발생?��?��?��?��.' });
    } finally {
        connection.release(); // DB ?���? ?��?��
    }
});


// 게시�? 목록 조회 API
router.get('/posts', jwtMiddleware, async (req, res) => {
    try {
        //const { postId, diseaseTag } = req.body;
        const { diseaseTag } = req.query;
        console.log('diseaseTag:', diseaseTag);


        // ?���? ?��?�� ?��?��?��?�� ?�� 게시�? ?���? 목록 조회
        if (!diseaseTag) {
            const results_noDiseaseTag = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= 1 ORDER BY postId DESC`);
            let rows_noDiseaseTag = results_noDiseaseTag;
            if (!Array.isArray(results_noDiseaseTag)) {
                rows_noDiseaseTag = [results_noDiseaseTag];
            }
            return res.status(201).json({
                success: true,
                message: "?���? ?��?�� ?�� 게시�? 목록?�� ?��공적?���? 조회?��?��?��?��?��.",
                posts: rows_noDiseaseTag
            });
        } else {
            const encodedDiseaseTag = decodeURIComponent(diseaseTag);
            console.log('encodedDiseaseTag:', encodedDiseaseTag);
            //const trimmedDiseaseTag = encodedDiseaseTag.trim();

            // '#'�? 중간?�� 모든 공백 ?���? ?�� ?���? ?�� 공백 ?���?
            const cleanedDiseaseTag = encodedDiseaseTag.replace(/^#\s*|\s*$/g, '').replace(/\s+/g, ' ').trim(); 
            console.log('cleanedDiseaseTag:', cleanedDiseaseTag); // 깨끗?�� ?���? ?��?��

            //const results = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= ? AND diseaseTag = ? ORDER BY postId DESC`, [postId, diseaseTag]);
            const results_yesDiseaseTag = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= 1 AND diseaseTag = ? ORDER BY postId DESC`, [cleanedDiseaseTag]);
            console.log('posts_results:', results_yesDiseaseTag)

            if (!results_yesDiseaseTag || results_yesDiseaseTag.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "게시�??�� 찾을 ?�� ?��?��?��?��."
                });
            }
            
            let rows_yesDiseaseTag = results_yesDiseaseTag;
            if (!Array.isArray(results_yesDiseaseTag)) {
                rows_yesDiseaseTag = [results_yesDiseaseTag];
            }

            return res.status(200).json({
                success: true,
                message: "?���? ?��?�� ?�� 게시�? 목록?�� ?��공적?���? 조회?��?��?��?��?��.",
                posts: rows_yesDiseaseTag
            });
        }
    } catch (error) {
        console.log('게시�? 목록 조회 �? ?���?:', error);
        return res.status(500).json({ success: false, message: '처리 �? 문제�? 발생?��?��?��?��.' });
    }
});

// ?��?�� 게시�? 조회 API (?���? ?��?��)
router.get('/posts/:postId', jwtMiddleware, async (req, res) => {
    try {
        const postId = req.params.postId;
        const login_userId = req.user.id; // ?��?�� 로그?��?�� ?��?��?�� ID
        console.log('login_userId:', login_userId);
        console.log('Requested postId:', postId); // postId ?�� ?��?��?��?���? 로그 
        
        /* [eunji] start */
        /*
        const results = await db.query(`
        SELECT c.postId, c.userName, c.title, c.content, c.postDate, c.imagePath,
               cm.commentId, cm.commentContent, cm.userId, cm.commentDate
        FROM COMMUNITY c
        LEFT JOIN COMMENT cm ON c.postId = cm.postId
        WHERE c.postId = ?
        ORDER BY cm.commentDate ASC`, [postId]);

        const commentsUsername = await db.query(`SELECT userName FROM USER WHERE userId = ?`, [results.commentId])

        const comments = results
            .filter(row => row.commentId !== null)
            .map(row => ({
                commentId: row.commentId,
                userId: row.userId,
                commentContent: row.commentContent,
                createdAt: row.commentDate
            }));

        if (results.length > 0) {
            res.status(200).json({
                success: true,
                message: '게시�?�? ?���??�� ?��공적?���? 조회?��?��?��?��?��.',
                posts: {
                    postId: results[0].postId,
                    userId: results[0].userId,
                    title: results[0].title,
                    content: results[0].content,
                    createdAt: results[0].postDate,
                    imagePath: results[0].imagePath
                },
                comments: comments
            });
        } else {
            return res.status(404).json({
                success: false,
                message: '게시�??�� 찾을 ?�� ?��?��?��?��.'
            });
        } 
        */
        /* [eunji] end */

        /* [hyunwoo] start */
        /* before use jwt at login_userId */
        /*
        const results = await db.query(`
            SELECT c.postId, c.userName AS postUserName, c.diseaseTag, c.title, c.content, c.postDate, c.imagePath, u.userName,
                cm.commentId, cm.commentContent, cm.userId, cm.commentDate, cm.parentId, u.userName AS commentUserName
            FROM COMMUNITY c
            LEFT JOIN COMMENT cm ON c.postId = cm.postId
            LEFT JOIN USER u ON cm.userId = u.userId
            WHERE c.postId = ?
            ORDER BY cm.commentDate ASC`, [postId]);
        */
        /* before use jwt at login_userId */
        /* after use jwt at login_userId 11/01 14:35 */

        // 게시�? 조회 ?�� 조회?�� 증�?? 코드 추�?? ?��?��

        const results = await db.query(`
            SELECT c.postId, c.userId AS postUserId, c.userName AS postUserName, c.diseaseTag, c.title, c.content, c.postDate, c.imagePath, c.commentCount, u.userName,
                cm.commentId, cm.commentContent, cm.userId AS commentUserId, cm.commentDate, cm.parentId, u.userName AS commentUserName
            FROM COMMUNITY c
            LEFT JOIN COMMENT cm ON c.postId = cm.postId
            LEFT JOIN USER u ON cm.userId = u.userId
            WHERE c.postId = ?
            ORDER BY cm.commentDate ASC
        `, [postId]);
        /* after use jwt at login_userId 11/01 14:35 */

        console.log('post detail query:', results)

        const comments = results
        .filter(row => row.commentId !== null)
        .map(row => ({
            commentId: row.commentId,
            commentUserId: row.commentUserId,
            commentUserName: row.commentUserName,
            commentContent: row.commentContent,
            createdAt: row.commentDate,
            parentId: row.parentId  // ?���?�? ?���??�� 구분?���? ?��?�� 추�??
        }));

        /* [hyunwoo] reply group */
        const groupedComments = [];
        const commentMap = new Map();

        comments.forEach(comment => {
            if (comment.parentId === null) {
                // �?�? ?���??�� 먼�?? 추�??
                groupedComments.push(comment);
                commentMap.set(comment.commentId, comment);
            } else {
                // ?���??�� �?�? ?���? ?��?��?�� 추�??
                const parentComment = commentMap.get(comment.parentId);
                if (parentComment) {
                    // ?���???? �?�? ?���??�� replies 배열?�� 추�??
                    parentComment.replies = parentComment.replies || [];
                    parentComment.replies.push(comment);
                    console.log('parentComment:', parentComment);
                }
            }
        });
        console.log('groupedComments:', groupedComments);
        /* [hyunwoo] reply group */

        const postDetail = results[0];
        //console.log('postDetail:', postDetail);
        console.log('commentCount:', postDetail.commentCount);

        if (results.length > 0) {
            res.status(200).json({
                success: true,
                message: '게시�?�? ?���??�� ?��공적?���? 조회?��?��?��?��?��.',
                postDetail: {
                    postId: postDetail.postId,
                    postUserId: postDetail.postUserId, //게시�? ?��?��?��
                    diseaseTag: postDetail.diseaseTag,
                    title: postDetail.title,
                    content: postDetail.content,
                    createdAt: postDetail.postDate,
                    imagePath: postDetail.imagePath,
                    userName: postDetail.postUserName,
                    commentCount: postDetail.commentCount // 게시�??�� ?���? ?��
                },
                //comments: comments,
                comments: groupedComments,
                login_userId: login_userId //로그?��?�� ?��?��?��
            });
        } else {
            return res.status(404).json({
                success: false,
                message: '게시�??�� 찾을 ?�� ?��?��?��?��.'
            });
        } 

    } catch (error) {
        console.log('게시�? 조회 �? ?���?:', error);
        return res.status(500).json({ success: false, message: '처리 �? 문제�? 발생?��?��?��?��.' });
    }
});

// ?���? ?��?�� API
router.post('/posts/:postId/comments', jwtMiddleware, async (req, res) => {
    try {
        const { commentContent } = req.body;
        const userId = req.user.id;
        const postId = req.params.postId;

        const result = await db.query(`
            INSERT INTO COMMENT (postId, userId, commentContent, commentDate)
            VALUES (?, ?, ?, NOW())
        `, [postId, userId, commentContent]);

        //?���? ?���? ?��?�� �?�?
        const postOwner = await db.query(`SELECT userId FROM COMMUNITY WHERE postId = ?`, [postId]);
        if (postOwner[0] && postOwner[0].userId !== userId) {
            /* [before]
            await db.query(`
                INSERT INTO ALARM (postId, commentId, userId, title, commentDate)
                VALUES (?, ?, ?, '?���? ?���?', NOW())
            `, [postId, result.insertId, postOwner[0].userId]);
            */
            // [after] 11/14 remove ALARM title
            await db.query(`
                INSERT INTO ALARM (postId, commentId, userId, commentDate)
                VALUES (?, ?, ?, NOW())
            `, [postId, result.insertId, postOwner[0].userId]);
        }

        // COMMUNITY ?��?��블의 ?���? ?��(commentContent) ?��?��?��?��
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount + 1 WHERE postId = ?`, [postId]);

        return res.status(201).json({
            success: true,
            message: "?���??�� ?��공적?���? ?��?��?��?��?��?��?��.",
            commentId: result.insertId.toString()
        });
    } catch (error) {
        console.log('?���? ?��?�� �? ?���?:', error);
        return res.status(500).json({ success: false, message: '처리 �? 문제�? 발생?��?��?��?��.' });
    }
});

// ?���? ?��?�� API(?�� ?���? ?��?�� ?�� ?��?�� ?���?�? 밑에 ?���?까�?? 같이 ?��?��)
router.delete('/comments/:commentId', jwtMiddleware, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        // ?���? ?��?��?��??? ?���??���? 같�??�? ?��?��
        const [comment] = await db.query(`SELECT userId, postId FROM COMMENT WHERE commentId = ?`, [commentId]);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "?���??�� 찾을 ?�� ?��?��?��?��."
            });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "?���? ?��?�� 권한?�� ?��?��?��?��."
            });
        }

        const postId = comment.postId;

        // ?���? ?��?��블에?�� ?��?�� ?���?�? ?���??�� �??��?�� ?���? ?��?��
        await db.query(`DELETE FROM ALARM WHERE commentId = ? OR parentId = ?`, [commentId, commentId]);

        // ?���? ?��?��
        const replyDeletionResult = await db.query(`DELETE FROM COMMENT WHERE parentId = ?`, [commentId]);

        // ?���? ?��?��
        const result = await db.query(`DELETE FROM COMMENT WHERE commentId = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "?���??�� 찾을 ?�� ?��?��?��?��."
            });
        }

        // COMMUNITY ?��?��블의 ?���? ?��(commentCount) ?��?��?��?�� (?���?�? ?���? 개수만큼 감소)
        const totalCommentsDeleted = 1 + (replyDeletionResult.affectedRows || 0); // 1??? �? ?���?, ?��머�???�� ?���? 개수
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount - ? WHERE postId = ?`, [totalCommentsDeleted, postId]);

        console.log("?���? �? ?���? ?��?�� ?���?:", commentId);
        
        return res.status(200).json({
            success: true,
            message: "?���? �? ?���??�� ?��공적?���? ?��?��?��?��?��?��?��."
        });
    } catch (error) {
        console.log('?���? ?��?�� �? ?���?:', error);
        return res.status(500).json({ success: false, message: '?���? ?��?�� �? 문제�? 발생?��?��?��?��.' });
    }
});


// ?���? ?��?�� API
router.post('/comments/:parentId/reply', jwtMiddleware, async (req, res) => {
    try {
        const parentId = req.params.parentId;
        const { commentContent } = req.body;
        const userId = req.user.id;// JWT?��?�� 추출?�� userId�? �?�?

        const parentComment = await db.query(`SELECT postId, userId AS commentOwnerId FROM COMMENT WHERE commentId = ?`, [parentId]);

        if (!parentComment || parentComment.length === 0) {
            return res.status(404).json({
                success: false,
                message: "?���??�� 찾을 ?�� ?��?��?��?��."
            });
        }

        const postId = parentComment[0].postId;
        const commentOwnerId = parentComment[0].commentOwnerId;

        // ?���? ?��?��
        const result = await db.query(`
            INSERT INTO COMMENT (postId, userId, commentContent, parentId, commentDate)
            VALUES (?, ?, ?, ?, NOW())
        `, [postId, userId, commentContent, parentId]);

        console.log("Reply Insert Result:", result); // ?���? ?��?�� ?��?�� 로그
        //console.log("Comment Owner ID:", commentOwnerId); // ?���? ?��?��?�� ?��?�� 로그
        //console.log("Result Insert ID:", result.insertId); // ?��?��?�� ?���? ID ?��?��

        // ?���? ?���? ?��?��: ?���? ????��?��?���? ?���?
        if (commentOwnerId !== userId) {  // 본인?�� ?��?�� 경우?���? ?���? ?��?��
            /* before
            await db.query(`
                INSERT INTO ALARM (postId, commentId, parentId, userId, title, commentDate)
                VALUES (?, ?, ?, ?, '?���? ?���?', NOW())
            `, [postId, result.insertId, parentId, commentOwnerId]);
            console.log("Reply Notification Created for User:", commentOwnerId); // ?���? ?��?�� ?��?�� 로그
            */
            // after 11/14 remove ALARM title
            await db.query(`
                INSERT INTO ALARM (postId, commentId, parentId, userId, commentDate)
                VALUES (?, ?, ?, ?, NOW())
            `, [postId, result.insertId, parentId, commentOwnerId]);
            console.log("Reply Notification Created for User:", commentOwnerId); // ?���? ?��?�� ?��?�� 로그
        }

        // COMMUNITY ?��?��블의 ?���? ?��(commentContent) ?��?��?��?��
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount + 1 WHERE postId = ?`, [postId]);

        return res.status(201).json({
            success: true,
            message: "?���??�� ?��공적?���? ?��?��?��?��?��?��?��.",
            replyId: result.insertId.toString()
        });
    } catch (error) {
        console.log('?���? ?��?�� �? ?���?:', error);
        return res.status(500).json({ success: false, message: '처리 �? 문제�? 발생?��?��?��?��.' });
    }
});

// ?���? ?��?�� API
router.delete('/comments/:commentId/reply', jwtMiddleware, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        // ?���??���? ?��?��
        const [comment] = await db.query(`SELECT parentId, userId, postId FROM COMMENT WHERE commentId = ?`, [commentId]);
        if (!comment || !comment.parentId) {
            return res.status(400).json({
                success: false,
                message: "?��?�� ?���???? ?���??�� ?��?��거나 존재?���? ?��?��?��?��."
            });
        }

        // ?���? ?��?��?��??? ?���??���? 같�??�? ?��?��
        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "?���? ?��?�� 권한?�� ?��?��?��?��."
            });
        }

        const postId = comment.postId;

        // ?���? ?��?��블에?�� ?��?�� ?���?�? �??��?�� ?���? ?��?��
        await db.query(`DELETE FROM ALARM WHERE commentId = ?`, [commentId]);

        // ?���? ?��?��
        const result = await db.query(`DELETE FROM COMMENT WHERE commentId = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "?���??�� 찾을 ?�� ?��?��?��?��."
            });
        }

        // COMMUNITY ?��?��블의 ?���? ?��(commentContent) 감소
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount - 1 WHERE postId = ?`, [postId]);

        console.log("?���? ?��?�� ?���?:", commentId);
        
        return res.status(200).json({
            success: true,
            message: "?���??�� ?��공적?���? ?��?��?��?��?��?��?��."
        });
    } catch (error) {
        console.log('?���? ?��?�� �? ?���?:', error);
        return res.status(500).json({ success: false, message: '?���? ?��?�� �? 문제�? 발생?��?��?��?��.' });
    }
});



// ?���? 조회 API
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
        console.log('?���? 조회 �? ?���?:', error);
        return res.status(500).json({ success: false, message: '?���? 조회?�� ?��?��?��?��?��?��.' });
    }
});



// ?���? ?��?�� 처리 API
router.put('/alarms/:alarmId/read', jwtMiddleware, async (req, res) => {
    try {
        const alarmId = req.params.alarmId;
        const userId = req.user.id;  // JWT?��?�� 추출?�� 로그?��?�� ?��?��?�� ID

        // ?��림이 ?��?�� ?��?��?��?�� 것인�? ?��?��
        const [alarm] = await db.query(`
            SELECT * FROM ALARM WHERE alarmId = ? AND userId = ?
        `, [alarmId, userId]);

        if (!alarm) {
            return res.status(403).json({ success: false, message: '?��?�� ?��림에 ????�� 권한?�� ?��?��?��?��.' });
        }

        // ?���? ?��?�� 처리
        const result = await db.query(`
            UPDATE ALARM SET isRead = 1 WHERE alarmId = ?
        `, [alarmId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '?��림을 찾을 ?�� ?��?��?��?��.' });
        }

        // ?��림과 �??��?�� postId, isRead 반환
        return res.status(200).json({ 
            success: true, 
            message: '?��림을 ?��?�� 처리?��?��?��?��.', 
            postId: alarm.postId,
            isRead: 1
        });
    } catch (error) {
        console.log('?���? ?��?�� 처리 �? ?���?:', error);
        return res.status(500).json({ success: false, message: '?���? ?��?�� 처리?�� ?��?��?��?��?��?��.' });
    }
});




module.exports = router;
