const express = require('express');
const router = express.Router();
const db = require('../db');
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const multer = require('multer');
const path = require('path');

// Multer ?€?  (?΄λ―Έμ?? ?λ‘λ ?μΉμ?? ??Όλͺ? ?€? )
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/t24202/svr/src/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// κ²μκΈ? ??± API
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
            return res.status(400).json({ message: '?΄λ―Έμ?? κ²½λ‘κ°? ?λͺ»λ??΅??€.' });
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
            return res.status(500).json({ success: false, message: 'κ²μκΈ? ??± μ€? λ¬Έμ κ°? λ°μ??΅??€.' });
        }

        return res.status(201).json({
            postId: result.insertId.toString(),
            success: true,
            message: 'κ²μκΈ??΄ ?±κ³΅μ ?Όλ‘? ??±???΅??€.'
        });
    } catch (error) {
        console.log('κ²μκΈ? ??± μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: 'μ²λ¦¬ μ€? λ¬Έμ κ°? λ°μ??΅??€.' });
    }
});

// κ²μκΈ? ?­?  API
router.delete('/posts/:postId', jwtMiddleware, async (req, res) => {
    const connection = await db.getConnection(); // ?Έ??­? ??? ?? DB ?°κ²?
    try {
        const postId = req.params.postId;
        const userId = req.user.id; // ??¬ λ‘κ·Έ?Έ? ?¬?©? ID

        await connection.beginTransaction(); // ?Έ??­? ??

        // κ²μκΈ? ??±? ??Έ
        const [post] = await connection.query('SELECT userId FROM COMMUNITY WHERE postId = ?', [postId]);
        
        if (!post) {
            await connection.rollback(); // κ²μκΈ??΄ ?? κ²½μ° λ‘€λ°±
            return res.status(404).json({ success: false, message: 'κ²μκΈ?? μ°Ύμ ? ??΅??€.' });
        }

        if (post.userId !== userId) {
            await connection.rollback(); // ??±?κ°? ?? κ²½μ° λ‘€λ°±
            return res.status(403).json({ success: false, message: 'κ²μκΈ? ?­?  κΆν?΄ ??΅??€.' });
        }

        
        await connection.query('DELETE FROM ALARM WHERE postId = ?', [postId]);
        // κ²μκΈ?? ?¬λ¦? λͺ¨λ  ?κΈ?κ³? ?΅κΈ? ?­? 
        await connection.query('DELETE FROM COMMENT WHERE postId = ? AND parentId IS NOT NULL', [postId]);
        await connection.query('DELETE FROM COMMENT WHERE postId = ?', [postId]);

        // κ²μκΈ? ?­? 
        const result = await connection.query('DELETE FROM COMMUNITY WHERE postId = ?', [postId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // ?­?  ?€?¨ ? λ‘€λ°±
            return res.status(404).json({ success: false, message: 'κ²μκΈ? ?­? ? ?€?¨??΅??€.' });
        }

        await connection.commit(); // ?­?  ?±κ³? ? μ»€λ°
        console.log('κ²μκΈ? λ°? κ΄?? ¨ ?κΈ? ?­?  ?λ£?:', postId);

        return res.status(200).json({
            success: true,
            message: 'κ²μκΈ?κ³? κ΄?? ¨ ?κΈ??΄ ?±κ³΅μ ?Όλ‘? ?­? ???΅??€.'
        });
    } catch (error) {
        await connection.rollback(); // ?€λ₯? λ°μ ? λ‘€λ°±
        console.log('κ²μκΈ? ?­?  μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: 'κ²μκΈ? ?­?  μ€? λ¬Έμ κ°? λ°μ??΅??€.' });
    } finally {
        connection.release(); // DB ?°κ²? ?΄? 
    }
});


// κ²μκΈ? λͺ©λ‘ μ‘°ν API
router.get('/posts', jwtMiddleware, async (req, res) => {
    try {
        //const { postId, diseaseTag } = req.body;
        const { diseaseTag } = req.query;
        console.log('diseaseTag:', diseaseTag);


        // ?κ·? ? ? ???? ? κ²μκΈ? ? μ²? λͺ©λ‘ μ‘°ν
        if (!diseaseTag) {
            const results_noDiseaseTag = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= 1 ORDER BY postId DESC`);
            let rows_noDiseaseTag = results_noDiseaseTag;
            if (!Array.isArray(results_noDiseaseTag)) {
                rows_noDiseaseTag = [results_noDiseaseTag];
            }
            return res.status(201).json({
                success: true,
                message: "?κ·? ?? ? κ²μκΈ? λͺ©λ‘?΄ ?±κ³΅μ ?Όλ‘? μ‘°ν???΅??€.",
                posts: rows_noDiseaseTag
            });
        } else {
            const encodedDiseaseTag = decodeURIComponent(diseaseTag);
            console.log('encodedDiseaseTag:', encodedDiseaseTag);
            //const trimmedDiseaseTag = encodedDiseaseTag.trim();

            // '#'κ³? μ€κ°? λͺ¨λ  κ³΅λ°± ? κ±? ? ?μͺ? ? κ³΅λ°± ? κ±?
            const cleanedDiseaseTag = encodedDiseaseTag.replace(/^#\s*|\s*$/g, '').replace(/\s+/g, ' ').trim(); 
            console.log('cleanedDiseaseTag:', cleanedDiseaseTag); // κΉ¨λ? ?κ·? ??Έ

            //const results = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= ? AND diseaseTag = ? ORDER BY postId DESC`, [postId, diseaseTag]);
            const results_yesDiseaseTag = await db.query(`SELECT * FROM COMMUNITY WHERE postId >= 1 AND diseaseTag = ? ORDER BY postId DESC`, [cleanedDiseaseTag]);
            console.log('posts_results:', results_yesDiseaseTag)

            if (!results_yesDiseaseTag || results_yesDiseaseTag.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "κ²μκΈ?? μ°Ύμ ? ??΅??€."
                });
            }
            
            let rows_yesDiseaseTag = results_yesDiseaseTag;
            if (!Array.isArray(results_yesDiseaseTag)) {
                rows_yesDiseaseTag = [results_yesDiseaseTag];
            }

            return res.status(200).json({
                success: true,
                message: "?κ·? ?? ? κ²μκΈ? λͺ©λ‘?΄ ?±κ³΅μ ?Όλ‘? μ‘°ν???΅??€.",
                posts: rows_yesDiseaseTag
            });
        }
    } catch (error) {
        console.log('κ²μκΈ? λͺ©λ‘ μ‘°ν μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: 'μ²λ¦¬ μ€? λ¬Έμ κ°? λ°μ??΅??€.' });
    }
});

// ?Ή?  κ²μκΈ? μ‘°ν API (?κΈ? ?¬?¨)
router.get('/posts/:postId', jwtMiddleware, async (req, res) => {
    try {
        const postId = req.params.postId;
        const login_userId = req.user.id; // ??¬ λ‘κ·Έ?Έ? ?¬?©? ID
        console.log('login_userId:', login_userId);
        console.log('Requested postId:', postId); // postId ? ??΄?€?μ§? λ‘κ·Έ 
        
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
                message: 'κ²μκΈ?κ³? ?κΈ??΄ ?±κ³΅μ ?Όλ‘? μ‘°ν???΅??€.',
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
                message: 'κ²μκΈ?? μ°Ύμ ? ??΅??€.'
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

        // κ²μκΈ? μ‘°ν ? μ‘°ν? μ¦κ?? μ½λ μΆκ?? ?? 

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
            parentId: row.parentId  // ?κΈ?κ³? ?΅κΈ?? κ΅¬λΆ?κΈ? ??΄ μΆκ??
        }));

        /* [hyunwoo] reply group */
        const groupedComments = [];
        const commentMap = new Map();

        comments.forEach(comment => {
            if (comment.parentId === null) {
                // λΆ?λͺ? ?κΈ?? λ¨Όμ?? μΆκ??
                groupedComments.push(comment);
                commentMap.set(comment.commentId, comment);
            } else {
                // ?΅κΈ?? λΆ?λͺ? ?κΈ? ??? μΆκ??
                const parentComment = commentMap.get(comment.parentId);
                if (parentComment) {
                    // ?΅κΈ???? λΆ?λͺ? ?κΈ?? replies λ°°μ΄? μΆκ??
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
                message: 'κ²μκΈ?κ³? ?κΈ??΄ ?±κ³΅μ ?Όλ‘? μ‘°ν???΅??€.',
                postDetail: {
                    postId: postDetail.postId,
                    postUserId: postDetail.postUserId, //κ²μκΈ? ??±?
                    diseaseTag: postDetail.diseaseTag,
                    title: postDetail.title,
                    content: postDetail.content,
                    createdAt: postDetail.postDate,
                    imagePath: postDetail.imagePath,
                    userName: postDetail.postUserName,
                    commentCount: postDetail.commentCount // κ²μκΈ?? ?κΈ? ?
                },
                //comments: comments,
                comments: groupedComments,
                login_userId: login_userId //λ‘κ·Έ?Έ? ?¬?©?
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'κ²μκΈ?? μ°Ύμ ? ??΅??€.'
            });
        } 

    } catch (error) {
        console.log('κ²μκΈ? μ‘°ν μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: 'μ²λ¦¬ μ€? λ¬Έμ κ°? λ°μ??΅??€.' });
    }
});

// ?κΈ? ??± API
router.post('/posts/:postId/comments', jwtMiddleware, async (req, res) => {
    try {
        const { commentContent } = req.body;
        const userId = req.user.id;
        const postId = req.params.postId;

        const result = await db.query(`
            INSERT INTO COMMENT (postId, userId, commentContent, commentDate)
            VALUES (?, ?, ?, NOW())
        `, [postId, userId, commentContent]);

        //?κΈ? ?λ¦? ??± λΆ?λΆ?
        const postOwner = await db.query(`SELECT userId FROM COMMUNITY WHERE postId = ?`, [postId]);
        if (postOwner[0] && postOwner[0].userId !== userId) {
            /* [before]
            await db.query(`
                INSERT INTO ALARM (postId, commentId, userId, title, commentDate)
                VALUES (?, ?, ?, '?κΈ? ?λ¦?', NOW())
            `, [postId, result.insertId, postOwner[0].userId]);
            */
            // [after] 11/14 remove ALARM title
            await db.query(`
                INSERT INTO ALARM (postId, commentId, userId, commentDate)
                VALUES (?, ?, ?, NOW())
            `, [postId, result.insertId, postOwner[0].userId]);
        }

        // COMMUNITY ??΄λΈμ ?κΈ? ?(commentContent) ??°?΄?Έ
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount + 1 WHERE postId = ?`, [postId]);

        return res.status(201).json({
            success: true,
            message: "?κΈ??΄ ?±κ³΅μ ?Όλ‘? ??±???΅??€.",
            commentId: result.insertId.toString()
        });
    } catch (error) {
        console.log('?κΈ? ??± μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: 'μ²λ¦¬ μ€? λ¬Έμ κ°? λ°μ??΅??€.' });
    }
});

// ?κΈ? ?­?  API(? ?κΈ? ?­?  ? ?΄?Ή ?κΈ?κ³? λ°μ ?΅κΈ?κΉμ?? κ°μ΄ ?­? )
router.delete('/comments/:commentId', jwtMiddleware, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        // ?κΈ? ??±???? ?μ²??κ°? κ°μ??μ§? ??Έ
        const [comment] = await db.query(`SELECT userId, postId FROM COMMENT WHERE commentId = ?`, [commentId]);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "?κΈ?? μ°Ύμ ? ??΅??€."
            });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "?κΈ? ?­?  κΆν?΄ ??΅??€."
            });
        }

        const postId = comment.postId;

        // ?λ¦? ??΄λΈμ? ?΄?Ή ?κΈ?κ³? ?΅κΈ??€ κ΄?? ¨? ?λ¦? ?­? 
        await db.query(`DELETE FROM ALARM WHERE commentId = ? OR parentId = ?`, [commentId, commentId]);

        // ?΅κΈ? ?­? 
        const replyDeletionResult = await db.query(`DELETE FROM COMMENT WHERE parentId = ?`, [commentId]);

        // ?κΈ? ?­? 
        const result = await db.query(`DELETE FROM COMMENT WHERE commentId = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "?κΈ?? μ°Ύμ ? ??΅??€."
            });
        }

        // COMMUNITY ??΄λΈμ ?κΈ? ?(commentCount) ??°?΄?Έ (?κΈ?κ³? ?΅κΈ? κ°μλ§νΌ κ°μ)
        const totalCommentsDeleted = 1 + (replyDeletionResult.affectedRows || 0); // 1??? λ³? ?κΈ?, ?λ¨Έμ??? ?΅κΈ? κ°μ
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount - ? WHERE postId = ?`, [totalCommentsDeleted, postId]);

        console.log("?κΈ? λ°? ?΅κΈ? ?­?  ?λ£?:", commentId);
        
        return res.status(200).json({
            success: true,
            message: "?κΈ? λ°? ?΅κΈ??΄ ?±κ³΅μ ?Όλ‘? ?­? ???΅??€."
        });
    } catch (error) {
        console.log('?κΈ? ?­?  μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: '?κΈ? ?­?  μ€? λ¬Έμ κ°? λ°μ??΅??€.' });
    }
});


// ?΅κΈ? ??± API
router.post('/comments/:parentId/reply', jwtMiddleware, async (req, res) => {
    try {
        const parentId = req.params.parentId;
        const { commentContent } = req.body;
        const userId = req.user.id;// JWT?? μΆμΆ? userIdλ‘? λ³?κ²?

        const parentComment = await db.query(`SELECT postId, userId AS commentOwnerId FROM COMMENT WHERE commentId = ?`, [parentId]);

        if (!parentComment || parentComment.length === 0) {
            return res.status(404).json({
                success: false,
                message: "?κΈ?? μ°Ύμ ? ??΅??€."
            });
        }

        const postId = parentComment[0].postId;
        const commentOwnerId = parentComment[0].commentOwnerId;

        // ?΅κΈ? ??±
        const result = await db.query(`
            INSERT INTO COMMENT (postId, userId, commentContent, parentId, commentDate)
            VALUES (?, ?, ?, ?, NOW())
        `, [postId, userId, commentContent, parentId]);

        console.log("Reply Insert Result:", result); // ?΅κΈ? ??± ??Έ λ‘κ·Έ
        //console.log("Comment Owner ID:", commentOwnerId); // ?λ¦? ?? ? ??Έ λ‘κ·Έ
        //console.log("Result Insert ID:", result.insertId); // ??±? ?΅κΈ? ID ??Έ

        // ?΅κΈ? ?λ¦? ??±: ?΅κΈ? ??????κ²? ?λ¦?
        if (commentOwnerId !== userId) {  // λ³ΈμΈ?΄ ?? κ²½μ°?λ§? ?λ¦? ??±
            /* before
            await db.query(`
                INSERT INTO ALARM (postId, commentId, parentId, userId, title, commentDate)
                VALUES (?, ?, ?, ?, '?΅κΈ? ?λ¦?', NOW())
            `, [postId, result.insertId, parentId, commentOwnerId]);
            console.log("Reply Notification Created for User:", commentOwnerId); // ?λ¦? ??± ??Έ λ‘κ·Έ
            */
            // after 11/14 remove ALARM title
            await db.query(`
                INSERT INTO ALARM (postId, commentId, parentId, userId, commentDate)
                VALUES (?, ?, ?, ?, NOW())
            `, [postId, result.insertId, parentId, commentOwnerId]);
            console.log("Reply Notification Created for User:", commentOwnerId); // ?λ¦? ??± ??Έ λ‘κ·Έ
        }

        // COMMUNITY ??΄λΈμ ?΅κΈ? ?(commentContent) ??°?΄?Έ
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount + 1 WHERE postId = ?`, [postId]);

        return res.status(201).json({
            success: true,
            message: "?΅κΈ??΄ ?±κ³΅μ ?Όλ‘? ??±???΅??€.",
            replyId: result.insertId.toString()
        });
    } catch (error) {
        console.log('?΅κΈ? ??± μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: 'μ²λ¦¬ μ€? λ¬Έμ κ°? λ°μ??΅??€.' });
    }
});

// ?΅κΈ? ?­?  API
router.delete('/comments/:commentId/reply', jwtMiddleware, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        // ?΅κΈ??Έμ§? ??Έ
        const [comment] = await db.query(`SELECT parentId, userId, postId FROM COMMENT WHERE commentId = ?`, [commentId]);
        if (!comment || !comment.parentId) {
            return res.status(400).json({
                success: false,
                message: "?΄?Ή ?κΈ???? ?΅κΈ??΄ ??κ±°λ μ‘΄μ¬?μ§? ??΅??€."
            });
        }

        // ?΅κΈ? ??±???? ?μ²??κ°? κ°μ??μ§? ??Έ
        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "?΅κΈ? ?­?  κΆν?΄ ??΅??€."
            });
        }

        const postId = comment.postId;

        // ?λ¦? ??΄λΈμ? ?΄?Ή ?΅κΈ?κ³? κ΄?? ¨? ?λ¦? ?­? 
        await db.query(`DELETE FROM ALARM WHERE commentId = ?`, [commentId]);

        // ?΅κΈ? ?­? 
        const result = await db.query(`DELETE FROM COMMENT WHERE commentId = ?`, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "?΅κΈ?? μ°Ύμ ? ??΅??€."
            });
        }

        // COMMUNITY ??΄λΈμ ?κΈ? ?(commentContent) κ°μ
        await db.query(`UPDATE COMMUNITY SET commentCount = commentCount - 1 WHERE postId = ?`, [postId]);

        console.log("?΅κΈ? ?­?  ?λ£?:", commentId);
        
        return res.status(200).json({
            success: true,
            message: "?΅κΈ??΄ ?±κ³΅μ ?Όλ‘? ?­? ???΅??€."
        });
    } catch (error) {
        console.log('?΅κΈ? ?­?  μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: '?΅κΈ? ?­?  μ€? λ¬Έμ κ°? λ°μ??΅??€.' });
    }
});



// ?λ¦? μ‘°ν API
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
        console.log('?λ¦? μ‘°ν μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: '?λ¦? μ‘°ν? ?€?¨??΅??€.' });
    }
});



// ?λ¦? ?½? μ²λ¦¬ API
router.put('/alarms/:alarmId/read', jwtMiddleware, async (req, res) => {
    try {
        const alarmId = req.params.alarmId;
        const userId = req.user.id;  // JWT?? μΆμΆ? λ‘κ·Έ?Έ? ?¬?©? ID

        // ?λ¦Όμ΄ ?΄?Ή ?¬?©?? κ²μΈμ§? ??Έ
        const [alarm] = await db.query(`
            SELECT * FROM ALARM WHERE alarmId = ? AND userId = ?
        `, [alarmId, userId]);

        if (!alarm) {
            return res.status(403).json({ success: false, message: '?΄?Ή ?λ¦Όμ ???? κΆν?΄ ??΅??€.' });
        }

        // ?λ¦? ?½? μ²λ¦¬
        const result = await db.query(`
            UPDATE ALARM SET isRead = 1 WHERE alarmId = ?
        `, [alarmId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '?λ¦Όμ μ°Ύμ ? ??΅??€.' });
        }

        // ?λ¦Όκ³Ό κ΄?? ¨? postId, isRead λ°ν
        return res.status(200).json({ 
            success: true, 
            message: '?λ¦Όμ ?½? μ²λ¦¬??΅??€.', 
            postId: alarm.postId,
            isRead: 1
        });
    } catch (error) {
        console.log('?λ¦? ?½? μ²λ¦¬ μ€? ?€λ₯?:', error);
        return res.status(500).json({ success: false, message: '?λ¦? ?½? μ²λ¦¬? ?€?¨??΅??€.' });
    }
});




module.exports = router;
