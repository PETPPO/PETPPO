const express = require('express');
const router = express.Router();
const db = require('../db');
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const multer = require('multer');
const path = require('path');

// Multer ?„¤? • (?´ë¯¸ì?? ?—…ë¡œë“œ ?œ„ì¹˜ì?? ?ŒŒ?¼ëª? ?„¤? •)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/t24202/svr/src/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// ê²Œì‹œê¸? ?‘?„± API
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
            return res.status(400).json({ message: '?´ë¯¸ì?? ê²½ë¡œê°? ?˜ëª»ë˜?—ˆ?Šµ?‹ˆ?‹¤.' });
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
            return res.status(500).json({ success: false, message: 'ê²Œì‹œê¸? ?‘?„± ì¤? ë¬¸ì œê°? ë°œìƒ?–ˆ?Šµ?‹ˆ?‹¤.' });
        }

        return res.status(201).json({
            postId: result.insertId.toString(),
            success: true,
            message: 'ê²Œì‹œê¸??´ ?„±ê³µì ?œ¼ë¡? ?‘?„±?˜?—ˆ?Šµ?‹ˆ?‹¤.'
        });
    } catch (error) {
        console.log('ê²Œì‹œê¸? ?‘?„± ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: 'ì²˜ë¦¬ ì¤? ë¬¸ì œê°? ë°œìƒ?–ˆ?Šµ?‹ˆ?‹¤.' });
    }
});

// ê²Œì‹œê¸? ?‚­? œ API
router.delete('/posts/:postId', jwtMiddleware, async (req, res) => {
    const connection = await db.getConnection(); // ?Š¸?œ?­?…˜ ?‹œ?‘?„ ?œ„?•œ DB ?—°ê²?
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // ?˜„?¬ ë¡œê·¸?¸?•œ ?‚¬?š©? ID

        await connection.beginTransaction(); // ?Š¸?œ?­?…˜ ?‹œ?‘

        // ê²Œì‹œê¸? ?‘?„±? ?™•?¸
        const [post] = await connection.query('SELECT userId FROM COMMUNITY WHERE postId = ?', [postId]);
        
        if (!post) {
            await connection.rollback(); // ê²Œì‹œê¸??´ ?—†?Š” ê²½ìš° ë¡¤ë°±
            return res.status(404).json({ success: false, message: 'ê²Œì‹œê¸??„ ì°¾ì„ ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤.' });
        }

        if (post.userId !== userId) {
            await connection.rollback(); // ?‘?„±?ê°? ?•„?‹Œ ê²½ìš° ë¡¤ë°±
            return res.status(403).json({ success: false, message: 'ê²Œì‹œê¸? ?‚­? œ ê¶Œí•œ?´ ?—†?Šµ?‹ˆ?‹¤.' });
        }

        
        await connection.query('DELETE FROM ALARM WHERE postId = ?', [postId]);
        // ê²Œì‹œê¸??— ?‹¬ë¦? ëª¨ë“  ?Œ“ê¸?ê³? ?‹µê¸? ?‚­? œ
        await connection.query('DELETE FROM COMMENT WHERE postId = ? AND parentId IS NOT NULL', [postId]);
        await connection.query('DELETE FROM COMMENT WHERE postId = ?', [postId]);

        // ê²Œì‹œê¸? ?‚­? œ
        const result = await connection.query('DELETE FROM COMMUNITY WHERE postId = ?', [postId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // ?‚­? œ ?‹¤?Œ¨ ?‹œ ë¡¤ë°±
            return res.status(404).json({ success: false, message: 'ê²Œì‹œê¸? ?‚­? œ?— ?‹¤?Œ¨?–ˆ?Šµ?‹ˆ?‹¤.' });
        }

        await connection.commit(); // ?‚­? œ ?„±ê³? ?‹œ ì»¤ë°‹
        console.log('ê²Œì‹œê¸? ë°? ê´?? ¨ ?Œ“ê¸? ?‚­? œ ?™„ë£?:', postId);

        return res.status(200).json({
            success: true,
            message: 'ê²Œì‹œê¸?ê³? ê´?? ¨ ?Œ“ê¸??´ ?„±ê³µì ?œ¼ë¡? ?‚­? œ?˜?—ˆ?Šµ?‹ˆ?‹¤.'
        });
    } catch (error) {
        await connection.rollback(); // ?˜¤ë¥? ë°œìƒ ?‹œ ë¡¤ë°±
        console.log('ê²Œì‹œê¸? ?‚­? œ ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: 'ê²Œì‹œê¸? ?‚­? œ ì¤? ë¬¸ì œê°? ë°œìƒ?–ˆ?Šµ?‹ˆ?‹¤.' });
    } finally {
        connection.release(); // DB ?—°ê²? ?•´? œ
    }
});


// ê²Œì‹œê¸? ëª©ë¡ ì¡°íšŒ API
router.get('/posts', jwtMiddleware, async (req, res) => {
    try {
        //const { postId, diseaseTag } = req.body;
        const { diseaseTag } = req.query;
        console.log('diseaseTag:', diseaseTag);


        // ?ƒœê·? ?„ ?ƒ ?•ˆ?˜?—ˆ?„ ?•Œ ê²Œì‹œê¸? ? „ì²? ëª©ë¡ ì¡°íšŒ
        if (!diseaseTag) {
            const results_noDiseaseTag = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= 1 ORDER BY postId DESC`);
            let rows_noDiseaseTag = results_noDiseaseTag;
            if (!Array.isArray(results_noDiseaseTag)) {
                rows_noDiseaseTag = [results_noDiseaseTag];
            }
            return res.status(201).json({
                success: true,
                message: "?ƒœê·? ?—†?„ ?•Œ ê²Œì‹œê¸? ëª©ë¡?´ ?„±ê³µì ?œ¼ë¡? ì¡°íšŒ?˜?—ˆ?Šµ?‹ˆ?‹¤.",
                posts: rows_noDiseaseTag
            });
        } else {
            const encodedDiseaseTag = decodeURIComponent(diseaseTag);
            console.log('encodedDiseaseTag:', encodedDiseaseTag);
            //const trimmedDiseaseTag = encodedDiseaseTag.trim();

            // '#'ê³? ì¤‘ê°„?˜ ëª¨ë“  ê³µë°± ? œê±? ?›„ ?–‘ìª? ? ê³µë°± ? œê±?
            const cleanedDiseaseTag = encodedDiseaseTag.replace(/^#\s*|\s*$/g, '').replace(/\s+/g, ' ').trim(); 
            console.log('cleanedDiseaseTag:', cleanedDiseaseTag); // ê¹¨ë—?•œ ?ƒœê·? ?™•?¸

            //const results = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= ? AND diseaseTag = ? ORDER BY postId DESC`, [postId, diseaseTag]);
            const results_yesDiseaseTag = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= 1 AND diseaseTag = ? ORDER BY postId DESC`, [cleanedDiseaseTag]);
            console.log('posts_results:', results_yesDiseaseTag)

            if (!results_yesDiseaseTag || results_yesDiseaseTag.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "ê²Œì‹œê¸??„ ì°¾ì„ ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤."
                });
            }
            
            let rows_yesDiseaseTag = results_yesDiseaseTag;
            if (!Array.isArray(results_yesDiseaseTag)) {
                rows_yesDiseaseTag = [results_yesDiseaseTag];
            }

            return res.status(200).json({
                success: true,
                message: "?ƒœê·? ?ˆ?„ ?•Œ ê²Œì‹œê¸? ëª©ë¡?´ ?„±ê³µì ?œ¼ë¡? ì¡°íšŒ?˜?—ˆ?Šµ?‹ˆ?‹¤.",
                posts: rows_yesDiseaseTag
            });
        }
    } catch (error) {
        console.log('ê²Œì‹œê¸? ëª©ë¡ ì¡°íšŒ ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: 'ì²˜ë¦¬ ì¤? ë¬¸ì œê°? ë°œìƒ?–ˆ?Šµ?‹ˆ?‹¤.' });
    }
});

// ?Š¹? • ê²Œì‹œê¸? ì¡°íšŒ API (?Œ“ê¸? ?¬?•¨)
router.get('/posts/:postId', jwtMiddleware, async (req, res) => {
    try {
        const postId = req.params.postId;
        const login_userId = req.user.id; // ?˜„?¬ ë¡œê·¸?¸?•œ ?‚¬?š©? ID
        console.log('login_userId:', login_userId);
        console.log('Requested postId:', postId); // postId ?˜ ?„˜?–´?˜¤?Š”ì§? ë¡œê·¸ 
        
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
                message: 'ê²Œì‹œê¸?ê³? ?Œ“ê¸??´ ?„±ê³µì ?œ¼ë¡? ì¡°íšŒ?˜?—ˆ?Šµ?‹ˆ?‹¤.',
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
                message: 'ê²Œì‹œê¸??„ ì°¾ì„ ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤.'
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

        // ê²Œì‹œê¸? ì¡°íšŒ ?‹œ ì¡°íšŒ?ˆ˜ ì¦ê?? ì½”ë“œ ì¶”ê?? ?˜ˆ? •

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
            parentId: row.parentId  // ?Œ“ê¸?ê³? ?‹µê¸??„ êµ¬ë¶„?•˜ê¸? ?œ„?•´ ì¶”ê??
        }));

        /* [hyunwoo] reply group */
        const groupedComments = [];
        const commentMap = new Map();

        comments.forEach(comment => {
            if (comment.parentId === null) {
                // ë¶?ëª? ?Œ“ê¸??„ ë¨¼ì?? ì¶”ê??
                groupedComments.push(comment);
                commentMap.set(comment.commentId, comment);
            } else {
                // ?‹µê¸??„ ë¶?ëª? ?Œ“ê¸? ?•„?˜?— ì¶”ê??
                const parentComment = commentMap.get(comment.parentId);
                if (parentComment) {
                    // ?‹µê¸???? ë¶?ëª? ?Œ“ê¸??˜ replies ë°°ì—´?— ì¶”ê??
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
                message: 'ê²Œì‹œê¸?ê³? ?Œ“ê¸??´ ?„±ê³µì ?œ¼ë¡? ì¡°íšŒ?˜?—ˆ?Šµ?‹ˆ?‹¤.',
                postDetail: {
                    postId: postDetail.postId,
                    postUserId: postDetail.postUserId, //ê²Œì‹œê¸? ?‘?„±?
                    diseaseTag: postDetail.diseaseTag,
                    title: postDetail.title,
                    content: postDetail.content,
                    createdAt: postDetail.postDate,
                    imagePath: postDetail.imagePath,
                    userName: postDetail.postUserName,
                    commentCount: postDetail.commentCount // ê²Œì‹œê¸??˜ ?Œ“ê¸? ?ˆ˜
                },
                //comments: comments,
                comments: groupedComments,
                login_userId: login_userId //ë¡œê·¸?¸?•œ ?‚¬?š©?
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'ê²Œì‹œê¸??„ ì°¾ì„ ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤.'
            });
        } 

    } catch (error) {
        console.log('ê²Œì‹œê¸? ì¡°íšŒ ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: 'ì²˜ë¦¬ ì¤? ë¬¸ì œê°? ë°œìƒ?–ˆ?Šµ?‹ˆ?‹¤.' });
    }
});

// ?Œ“ê¸? ?‘?„± API
router.post('/posts/:postId/comments', jwtMiddleware, async (req, res) => {
    try {
        const { commentContent } = req.body;
        const userId = req.user.id;
        const postId = req.params.postId;

        const result = await db.query(`
            INSERT INTO COMMENT (postId, userId, commentContent, commentDate)
            VALUES (?, ?, ?, NOW())
        `, [postId, userId, commentContent]);

        //?Œ“ê¸? ?•Œë¦? ?ƒ?„± ë¶?ë¶?
        const postOwner = await db.query(`SELECT userId FROM COMMUNITY WHERE postId = ?`, [postId]);
        if (postOwner[0] && postOwner[0].userId !== userId) {
            /* [before]
            await db.query(`
                INSERT INTO ALARM (postId, commentId, userId, title, commentDate)
                VALUES (?, ?, ?, '?Œ“ê¸? ?•Œë¦?', NOW())
            `, [postId, result.insertId, postOwner[0].userId]);
            */
            // [after] 11/14 remove ALARM title
            await db.query(`
                INSERT INTO ALARM (postId, commentId, userId, commentDate)
                VALUES (?, ?, ?, NOW())
            `, [postId, result.insertId, postOwner[0].userId]);
        }

        // COMMUNITY ?…Œ?´ë¸”ì˜ ?Œ“ê¸? ?ˆ˜(commentContent) ?—…?°?´?Š¸
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount + 1 WHERE postId = ?`, [postId]);

        return res.status(201).json({
            success: true,
            message: "?Œ“ê¸??´ ?„±ê³µì ?œ¼ë¡? ?‘?„±?˜?—ˆ?Šµ?‹ˆ?‹¤.",
            commentId: result.insertId.toString()
        });
    } catch (error) {
        console.log('?Œ“ê¸? ?‘?„± ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: 'ì²˜ë¦¬ ì¤? ë¬¸ì œê°? ë°œìƒ?–ˆ?Šµ?‹ˆ?‹¤.' });
    }
});

// ?Œ“ê¸? ?‚­? œ API(?› ?Œ“ê¸? ?‚­? œ ?‹œ ?•´?‹¹ ?Œ“ê¸?ê³? ë°‘ì— ?‹µê¸?ê¹Œì?? ê°™ì´ ?‚­? œ)
router.delete('/comments/:commentId', jwtMiddleware, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        // ?Œ“ê¸? ?‘?„±???? ?š”ì²??ê°? ê°™ì??ì§? ?™•?¸
        const [comment] = await db.query(`SELECT userId, postId FROM COMMENT WHERE commentId = ?`, [commentId]);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "?Œ“ê¸??„ ì°¾ì„ ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤."
            });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "?Œ“ê¸? ?‚­? œ ê¶Œí•œ?´ ?—†?Šµ?‹ˆ?‹¤."
            });
        }

        const postId = comment.postId;

        // ?•Œë¦? ?…Œ?´ë¸”ì—?„œ ?•´?‹¹ ?Œ“ê¸?ê³? ?‹µê¸??“¤ ê´?? ¨?œ ?•Œë¦? ?‚­? œ
        await db.query(`DELETE FROM ALARM WHERE commentId = ? OR parentId = ?`, [commentId, commentId]);

        // ?‹µê¸? ?‚­? œ
        const replyDeletionResult = await db.query(`DELETE FROM COMMENT WHERE parentId = ?`, [commentId]);

        // ?Œ“ê¸? ?‚­? œ
        const result = await db.query(`DELETE FROM COMMENT WHERE commentId = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "?Œ“ê¸??„ ì°¾ì„ ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤."
            });
        }

        // COMMUNITY ?…Œ?´ë¸”ì˜ ?Œ“ê¸? ?ˆ˜(commentCount) ?—…?°?´?Š¸ (?Œ“ê¸?ê³? ?‹µê¸? ê°œìˆ˜ë§Œí¼ ê°ì†Œ)
        const totalCommentsDeleted = 1 + (replyDeletionResult.affectedRows || 0); // 1??? ë³? ?Œ“ê¸?, ?‚˜ë¨¸ì???Š” ?‹µê¸? ê°œìˆ˜
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount - ? WHERE postId = ?`, [totalCommentsDeleted, postId]);

        console.log("?Œ“ê¸? ë°? ?‹µê¸? ?‚­? œ ?™„ë£?:", commentId);
        
        return res.status(200).json({
            success: true,
            message: "?Œ“ê¸? ë°? ?‹µê¸??´ ?„±ê³µì ?œ¼ë¡? ?‚­? œ?˜?—ˆ?Šµ?‹ˆ?‹¤."
        });
    } catch (error) {
        console.log('?Œ“ê¸? ?‚­? œ ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: '?Œ“ê¸? ?‚­? œ ì¤? ë¬¸ì œê°? ë°œìƒ?–ˆ?Šµ?‹ˆ?‹¤.' });
    }
});


// ?‹µê¸? ?‘?„± API
router.post('/comments/:parentId/reply', jwtMiddleware, async (req, res) => {
    try {
        const parentId = req.params.parentId;
        const { commentContent } = req.body;
        const userId = req.user.id;// JWT?—?„œ ì¶”ì¶œ?œ userIdë¡? ë³?ê²?

        const parentComment = await db.query(`SELECT postId, userId AS commentOwnerId FROM COMMENT WHERE commentId = ?`, [parentId]);

        if (!parentComment || parentComment.length === 0) {
            return res.status(404).json({
                success: false,
                message: "?Œ“ê¸??„ ì°¾ì„ ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤."
            });
        }

        const postId = parentComment[0].postId;
        const commentOwnerId = parentComment[0].commentOwnerId;

        // ?‹µê¸? ?ƒ?„±
        const result = await db.query(`
            INSERT INTO COMMENT (postId, userId, commentContent, parentId, commentDate)
            VALUES (?, ?, ?, ?, NOW())
        `, [postId, userId, commentContent, parentId]);

        console.log("Reply Insert Result:", result); // ?‹µê¸? ?ƒ?„± ?™•?¸ ë¡œê·¸
        //console.log("Comment Owner ID:", commentOwnerId); // ?•Œë¦? ?ˆ˜?‹ ? ?™•?¸ ë¡œê·¸
        //console.log("Result Insert ID:", result.insertId); // ?ƒ?„±?œ ?‹µê¸? ID ?™•?¸

        // ?‹µê¸? ?•Œë¦? ?ƒ?„±: ?‹µê¸? ????ƒ??—ê²? ?•Œë¦?
        if (commentOwnerId !== userId) {  // ë³¸ì¸?´ ?•„?‹Œ ê²½ìš°?—ë§? ?•Œë¦? ?ƒ?„±
            /* before
            await db.query(`
                INSERT INTO ALARM (postId, commentId, parentId, userId, title, commentDate)
                VALUES (?, ?, ?, ?, '?‹µê¸? ?•Œë¦?', NOW())
            `, [postId, result.insertId, parentId, commentOwnerId]);
            console.log("Reply Notification Created for User:", commentOwnerId); // ?•Œë¦? ?ƒ?„± ?™•?¸ ë¡œê·¸
            */
            // after 11/14 remove ALARM title
            await db.query(`
                INSERT INTO ALARM (postId, commentId, parentId, userId, commentDate)
                VALUES (?, ?, ?, ?, NOW())
            `, [postId, result.insertId, parentId, commentOwnerId]);
            console.log("Reply Notification Created for User:", commentOwnerId); // ?•Œë¦? ?ƒ?„± ?™•?¸ ë¡œê·¸
        }

        // COMMUNITY ?…Œ?´ë¸”ì˜ ?‹µê¸? ?ˆ˜(commentContent) ?—…?°?´?Š¸
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount + 1 WHERE postId = ?`, [postId]);

        return res.status(201).json({
            success: true,
            message: "?‹µê¸??´ ?„±ê³µì ?œ¼ë¡? ?‘?„±?˜?—ˆ?Šµ?‹ˆ?‹¤.",
            replyId: result.insertId.toString()
        });
    } catch (error) {
        console.log('?‹µê¸? ?‘?„± ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: 'ì²˜ë¦¬ ì¤? ë¬¸ì œê°? ë°œìƒ?–ˆ?Šµ?‹ˆ?‹¤.' });
    }
});

// ?‹µê¸? ?‚­? œ API
router.delete('/comments/:commentId/reply', jwtMiddleware, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        // ?‹µê¸??¸ì§? ?™•?¸
        const [comment] = await db.query(`SELECT parentId, userId, postId FROM COMMENT WHERE commentId = ?`, [commentId]);
        if (!comment || !comment.parentId) {
            return res.status(400).json({
                success: false,
                message: "?•´?‹¹ ?Œ“ê¸???? ?‹µê¸??´ ?•„?‹ˆê±°ë‚˜ ì¡´ì¬?•˜ì§? ?•Š?Šµ?‹ˆ?‹¤."
            });
        }

        // ?‹µê¸? ?‘?„±???? ?š”ì²??ê°? ê°™ì??ì§? ?™•?¸
        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "?‹µê¸? ?‚­? œ ê¶Œí•œ?´ ?—†?Šµ?‹ˆ?‹¤."
            });
        }

        const postId = comment.postId;

        // ?•Œë¦? ?…Œ?´ë¸”ì—?„œ ?•´?‹¹ ?‹µê¸?ê³? ê´?? ¨?œ ?•Œë¦? ?‚­? œ
        await db.query(`DELETE FROM ALARM WHERE commentId = ?`, [commentId]);

        // ?‹µê¸? ?‚­? œ
        const result = await db.query(`DELETE FROM COMMENT WHERE commentId = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "?‹µê¸??„ ì°¾ì„ ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤."
            });
        }

        // COMMUNITY ?…Œ?´ë¸”ì˜ ?Œ“ê¸? ?ˆ˜(commentContent) ê°ì†Œ
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount - 1 WHERE postId = ?`, [postId]);

        console.log("?‹µê¸? ?‚­? œ ?™„ë£?:", commentId);
        
        return res.status(200).json({
            success: true,
            message: "?‹µê¸??´ ?„±ê³µì ?œ¼ë¡? ?‚­? œ?˜?—ˆ?Šµ?‹ˆ?‹¤."
        });
    } catch (error) {
        console.log('?‹µê¸? ?‚­? œ ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: '?‹µê¸? ?‚­? œ ì¤? ë¬¸ì œê°? ë°œìƒ?–ˆ?Šµ?‹ˆ?‹¤.' });
    }
});



// ?•Œë¦? ì¡°íšŒ API
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
        console.log('?•Œë¦? ì¡°íšŒ ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: '?•Œë¦? ì¡°íšŒ?— ?‹¤?Œ¨?–ˆ?Šµ?‹ˆ?‹¤.' });
    }
});



// ?•Œë¦? ?½?Œ ì²˜ë¦¬ API
router.put('/alarms/:alarmId/read', jwtMiddleware, async (req, res) => {
    try {
        const alarmId = req.params.alarmId;
        const userId = req.user.id;  // JWT?—?„œ ì¶”ì¶œ?•œ ë¡œê·¸?¸?•œ ?‚¬?š©? ID

        // ?•Œë¦¼ì´ ?•´?‹¹ ?‚¬?š©??˜ ê²ƒì¸ì§? ?™•?¸
        const [alarm] = await db.query(`
            SELECT * FROM ALARM WHERE alarmId = ? AND userId = ?
        `, [alarmId, userId]);

        if (!alarm) {
            return res.status(403).json({ success: false, message: '?•´?‹¹ ?•Œë¦¼ì— ????•œ ê¶Œí•œ?´ ?—†?Šµ?‹ˆ?‹¤.' });
        }

        // ?•Œë¦? ?½?Œ ì²˜ë¦¬
        const result = await db.query(`
            UPDATE ALARM SET isRead = 1 WHERE alarmId = ?
        `, [alarmId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '?•Œë¦¼ì„ ì°¾ì„ ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤.' });
        }

        // ?•Œë¦¼ê³¼ ê´?? ¨?œ postId, isRead ë°˜í™˜
        return res.status(200).json({ 
            success: true, 
            message: '?•Œë¦¼ì„ ?½?Œ ì²˜ë¦¬?–ˆ?Šµ?‹ˆ?‹¤.', 
            postId: alarm.postId,
            isRead: 1
        });
    } catch (error) {
        console.log('?•Œë¦? ?½?Œ ì²˜ë¦¬ ì¤? ?˜¤ë¥?:', error);
        return res.status(500).json({ success: false, message: '?•Œë¦? ?½?Œ ì²˜ë¦¬?— ?‹¤?Œ¨?–ˆ?Šµ?‹ˆ?‹¤.' });
    }
});




module.exports = router;
