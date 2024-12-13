const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/login', async (req, res) => {
    try {
        res.json({ message: '관리자 로그인 시도' });
    } catch (error) {
        console.error('관리자 로그인 실패:', error);
        res.status(500).json({ success: false, message: '관리자 로그인 실패.' });
    }
});

router.post('/login_process', async (req, res) => {
    try {
        const { adminEmail, adminPw } = req.body;
        const query = 'SELECT * FROM ADMIN WHERE adminEmail = ? AND adminPw = ?';

        const results = await db.query(query, [adminEmail, adminPw]);

        if (results.length > 0) {
            req.session.adminEmail = results[0].adminEmail;
            console.log('관리자 로그인 성공!');

            res.status(201).json({
                success: true,
                message: "관리자 로그인 성공",
                property: 201
            });
        } else {
            console.log('관리자 로그인 실패');

            res.status(401).json({
                success: false,
                message: "관리자 로그인 실패",
                property: 400
            });
        }
    } catch (error) {
        console.error('관리자 로그인 중 에러 발생:', error);
        res.status(500).json({ success: false, message: '관리자 로그인 실패.' });
    }
});

router.get('/logout', async (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('관리자 로그아웃 중 에러 발생:', err);
                return res.status(500).send('관리자 로그아웃 실패');
            }
            res.status(201).json({
                success: true,
                message: "관리자 로그아웃 성공",
                property: 200
            });
            console.log('관리자 로그아웃 성공');
        });
    } catch (error) {
        console.error('관리자 로그아웃 중 에러 발생:', error);
        res.status(500).json({ success: false, message: '관리자 로그아웃 실패' });
    }
});

router.get('/users', async (req, res) => {
    try {
        console.log('사용자 정보 조회.');

        const results = await db.query('SELECT * FROM USER');
        res.status(200).json({
            success: true,
            message: "사용자 정보 조회 성공",
            property: 200,
            users: results
        });
    } catch (error) {
        console.error('사용자 정보 조회 중 에러 발생:', error);
        res.status(500).send('사용자 정보 조회 실패');
    }
});

router.delete('/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [userResult] = await connection.query('SELECT userEmail FROM USER WHERE userId = ?', [userId]);
        console.log('userResult:', userResult)
        if (!userResult) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '사용자 삭제 중 에러 발생',
            });
        }
        const badUserEmail = userResult.userEmail;

        await connection.query('INSERT INTO BAD_USER (badUserEmail) VALUES (?)', [badUserEmail]);
        console.log('BAD_USER 테이블에 해당 사용자 추가:', badUserEmail);

        await connection.query('DELETE FROM ALARM WHERE commentId IN (SELECT commentId FROM COMMENT WHERE userId = ? AND parentId IS NOT NULL)', [userId]);
        console.log('해당 사용자 알림 삭제(답글)');

        await connection.query('DELETE FROM ALARM WHERE commentId IN (SELECT commentId FROM COMMENT WHERE userId = ?)', [userId]);
        console.log('해당 사용자 알림 삭제(댓글)');
        
        const commentParentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE userId = ? AND parentId IS NOT NULL', [userId]);
        console.log('해당 사용자 답글 삭제:', commentParentDeleteResult);
        
        const commentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE userId = ?', [userId]);
        console.log('해당 사용자 댓글 삭제:', commentDeleteResult);

        const communityDeleteResult = await connection.query('DELETE FROM COMMUNITY WHERE userId = ?', [userId]);
        console.log('해당 사용자 게시글 삭제:', communityDeleteResult);

        const userDeleteResult = await connection.query('DELETE FROM USER WHERE userId = ?', [userId]);
        console.log('해당 사용자 삭제:', userDeleteResult);

        if (userDeleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '사용자 삭제 중 에러 발생',
            });
        }

        await connection.commit();
        console.log('해당 사용자 삭제:', userId);

        res.status(200).json({
            success: true,
            message: '사용자 삭제 성공',
        });
    } catch (error) {
        await connection.rollback();
        console.error('user delete error: ', error);
        res.status(500).json({
            success: false,
            message: '사용자 삭제 실패',
        });
    } finally {
        connection.release();
    }
});

router.get('/community/posts', async (req, res) => {
    try {
        const results = await db.query('SELECT * FROM COMMUNITY');
        res.status(200).json({
            success: true,
            message: '게시글 정보 조회 성공',
            property: 200,
            ports: results
        });
        console.log(results)
    } catch (error) {
        console.error('게시글 정보 조회 중 에러 발생:', error);
        res.status(500).send('게시글 정보 조회 실패');
    }
});

router.delete('/community/post/:postId', async (req, res) => {
    const postId = req.params.postId;
    const connection = await db.getConnection();
    console.log('게시글 ID:', postId);

    try {
        await connection.beginTransaction();

        const alarmDeleteResult = await connection.query('DELETE FROM ALARM WHERE postId = ?', [postId]);
        console.log('해당 게시글 알림 삭제:', alarmDeleteResult);

        const commentChildDeleteResult = await connection.query('DELETE FROM COMMENT WHERE postId = ? AND parentId IS NOT NULL', [postId]);
        console.log('해당 게시글 :', commentChildDeleteResult);

        const commentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE postId = ?', [postId]);
        console.log('�빐�떦 寃뚯떆湲� �뙎湲� �궘�젣:', commentDeleteResult);

        const result = await connection.query('DELETE FROM COMMUNITY WHERE postId = ?', [postId]);
        console.log('�빐�떦 寃뚯떆湲� �궘�젣:', result);

        if (result.affectedRows === 0) {
            await connection.rollback();
            console.log('寃뚯떆湲� �궘�젣 以� �뿉�윭 諛쒖깮.');
            return res.status(404).json({
                success: false,
                message: '寃뚯떆湲� �궘�젣 �떎�뙣',
            });
        }

        await connection.commit();
        console.log('�빐�떦 寃뚯떆湲� �궘�젣:', postId);

        return res.status(200).json({
            success: true,
            message: '寃뚯떆湲� �궘�젣 �꽦怨�.',
        });
    } catch (error) {
        await connection.rollback();
        console.error('寃뚯떆湲� �궘�젣 以� �뿉�윭 諛쒖깮:', error);
        return res.status(500).json({
            success: false,
            message: '寃뚯떆湲� �궘�젣 �떎�뙣.',
        });
    } finally {
        connection.release();
    }
});

router.get('/diseases', async (req, res) => {
    try {
        console.log('吏덊솚 �젙蹂� 議고쉶');
        const results = await db.query('SELECT * FROM DISEASE');

        if (results.length === 0) {
            return res.status(200).json({
                success: false,
                message: "吏덊솚 �젙蹂� 議고쉶媛� �뾾�쓬",
                property: 500
            });
        }

        res.status(200).json({
            success: true,
            message: "吏덊솚 �젙蹂� 議고쉶 �꽦怨�",
            property: 200,
            diseases: results
        });
    } catch (error) {
        console.error('吏덊솚 �젙蹂� 議고쉶 以� �뿉�윭 諛쒖깮:', error);
        res.status(500).json({ success: false, message: '吏덊솚 �젙蹂� 議고쉶 �떎�뙣' });
    }
});

router.get('/diseases/:diseaseId', async (req, res) => {
    const diseaseId = req.params.diseaseId;

    try {
        const results = await db.query('SELECT * FROM DISEASE WHERE diseaseId = ?', [diseaseId]);

        if (results.length > 0) {
            res.status(200).json({
                success: true,
                message: '吏덊솚 �젙蹂� 議고쉶 �꽦怨�',
                property: 200,
                disease: results
            });
        } else {
            res.status(404).json({
                success: false,
                message: '吏덊솚 �젙蹂� 議고쉶 �떎�뙣',
                property: 404
            });
        }
    } catch (error) {
        console.error('吏덊솚 �젙蹂� 議고쉶 以� �뿉�윭 諛쒖깮:', error);
        res.status(500).json({ success: false, message: '吏덊솚 �젙蹂� 議고쉶 �떎�뙣' });
    }
});

router.get('/dashboard', async (req, res) => {
    try {
        console.log('����떆蹂대뱶 議고쉶');
        const adminQuery = `
            SELECT adminEmail, adminName, (SELECT COUNT(*) FROM ADMIN) AS admin_count 
            FROM ADMIN
        `;
        const userCountQuery = 'SELECT COUNT(*) AS user_count FROM USER';
        const diagnosisImageCountQuery = 'SELECT COUNT(*) AS diagnosis_count FROM DIAGNOSIS';
        const postTagsQuery = `
            SELECT diseaseTag, COUNT(*) AS count 
            FROM COMMUNITY 
            GROUP BY diseaseTag
        `;

        const adminResult = await db.query(adminQuery);
        const userResult = await db.query(userCountQuery);
        const diagnosisResult = await db.query(diagnosisImageCountQuery);
        const tagsResult = await db.query(postTagsQuery);

        const response = {
            success: true,
            admin: adminResult.map(admin => ({
                email: admin.adminEmail,
                name: admin.adminName
            })),
            admin_count: Number(adminResult[0].admin_count),
            diagnosis_image_count: Number(diagnosisResult[0].diagnosis_count),
            user_count: Number(userResult[0].user_count),
            post_tags: tagsResult.map(tag => ({
                diseaseTag: tag.diseaseTag,
                count: Number(tag.count)
            }))
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('����떆蹂대뱶 議고쉶 以� �뿉�윭 諛쒖깮:', error);
        res.status(500).json({ success: false, message: '����떆蹂대뱶 議고쉶 �떎�뙣' });
    }
});

module.exports = router;
