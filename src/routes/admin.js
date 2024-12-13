const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/login', async (req, res) => {
    try {
        res.json({ message: '관리자 로그인 시도' });
    } catch (error) {
        console.error('濡쒓렇�씤 �슂泥� 泥섎━ 以� �삤瑜�:', error);
        res.status(500).json({ success: false, message: '濡쒓렇�씤 �슂泥� 泥섎━ 以� 臾몄젣媛� 諛쒖깮�뻽�뒿�땲�떎.' });
    }
});

router.post('/login_process', async (req, res) => {
    try {
        const { adminEmail, adminPw } = req.body;
        const query = 'SELECT * FROM ADMIN WHERE adminEmail = ? AND adminPw = ?';

        const results = await db.query(query, [adminEmail, adminPw]);

        if (results.length > 0) {
            req.session.adminEmail = results[0].adminEmail;
            console.log('愿�由ъ옄 濡쒓렇�씤 �꽦怨�!');

            res.status(201).json({
                success: true,
                message: "濡쒓렇�씤�씠 �꽦怨듭쟻�쑝濡� 泥섎━�릺�뿀�뒿�땲�떎.",
                property: 201
            });
        } else {
            console.log('愿�由ъ옄 濡쒓렇�씤 �떎�뙣');

            res.status(401).json({
                success: false,
                message: "愿�由ъ옄 �젙蹂닿�� �젙�솗�븯吏� �븡�뒿�땲�떎. �떎�떆 �떆�룄�빐二쇱꽭�슂!",
                property: 400
            });
        }
    } catch (error) {
        console.error('濡쒓렇�씤 泥섎━ 以� �삤瑜�:', error);
        res.status(500).json({ success: false, message: '濡쒓렇�씤 泥섎━ 以� 臾몄젣媛� 諛쒖깮�뻽�뒿�땲�떎.' });
    }
});

router.get('/logout', async (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('愿�由ъ옄 濡쒓렇�븘�썐 以� �뿉�윭 諛쒖깮:', err);
                return res.status(500).send('愿�由ъ옄 濡쒓렇�븘�썐 �떎�뙣');
            }
            res.status(201).json({
                success: true,
                message: "愿�由ъ옄 濡쒓렇�븘�썐 �꽦怨�",
                property: 200
            });
            console.log('愿�由ъ옄 濡쒓렇�븘�썐 �꽦怨�!');
        });
    } catch (error) {
        console.error('愿�由ъ옄 濡쒓렇�븘�썐 以� �뿉�윭 諛쒖깮:', error);
        res.status(500).json({ success: false, message: '愿�由ъ옄 濡쒓렇�븘�썐 �떎�뙣' });
    }
});

router.get('/users', async (req, res) => {
    try {
        console.log('�궗�슜�옄 �젙蹂� 議고쉶.');

        const results = await db.query('SELECT * FROM USER');
        res.status(200).json({
            success: true,
            message: "�궗�슜�옄 �젙蹂� 議고쉶 �꽦怨�",
            property: 200,
            users: results
        });
    } catch (error) {
        console.error('�궗�슜�옄 �젙蹂� 議고쉶 以� �뿉�윭 諛쒖깮:', error);
        res.status(500).send('�궗�슜�옄 �젙蹂� 議고쉶 �떎�뙣');
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
                message: '�궗�슜�옄 �젙蹂닿�� �뾾�뒿�땲�떎.',
            });
        }
        const badUserEmail = userResult.userEmail;

        await connection.query('INSERT INTO BAD_USER (badUserEmail) VALUES (?)', [badUserEmail]);
        console.log('BAD_USER �뀒�씠釉붿뿉 異붽��:', badUserEmail);

        await connection.query('DELETE FROM ALARM WHERE commentId IN (SELECT commentId FROM COMMENT WHERE userId = ? AND parentId IS NOT NULL)', [userId]);
        console.log('�빐�떦 �궗�슜�옄 �븣由� �궘�젣(�떟湲�)');

        await connection.query('DELETE FROM ALARM WHERE commentId IN (SELECT commentId FROM COMMENT WHERE userId = ?)', [userId]);
        console.log('�빐�떦 �궗�슜�옄 �븣由� �궘�젣(�뙎湲�)');
        
        const commentParentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE userId = ? AND parentId IS NOT NULL', [userId]);
        console.log('�빐�떦 �궗�슜�옄 �떟湲� �궘�젣:', commentParentDeleteResult);
        
        const commentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE userId = ?', [userId]);
        console.log('�빐�떦 �궗�슜�옄 �뙎湲� �궘�젣:', commentDeleteResult);

        const communityDeleteResult = await connection.query('DELETE FROM COMMUNITY WHERE userId = ?', [userId]);
        console.log('�빐�떦 �궗�슜�옄 寃뚯떆湲� �궘�젣:', communityDeleteResult);

        const userDeleteResult = await connection.query('DELETE FROM USER WHERE userId = ?', [userId]);
        console.log('�빐�떦 �궗�슜�옄 �궘�젣:', userDeleteResult);

        if (userDeleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '�궗�슜�옄 �궘�젣 �떎�뙣',
            });
        }

        await connection.commit();
        console.log('�빐�떦 �궗�슜�옄 �궘�젣 �꽦怨�:', userId);

        res.status(200).json({
            success: true,
            message: '�빐�떦 �궗�슜�옄 �꽦怨듭쟻�쑝濡� �궘�젣.',
        });
    } catch (error) {
        await connection.rollback();
        console.error('user delete error: ', error);
        res.status(500).json({
            success: false,
            message: '�빐�떦 �궗�슜�옄 �궘�젣 �떎�뙣',
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
            message: '寃뚯떆湲� �젙蹂� 議고쉶 �꽦怨�',
            property: 200,
            ports: results
        });
        console.log(results)
    } catch (error) {
        console.error('寃뚯떆湲� �젙蹂� 議고쉶 以� �뿉�윭 諛쒖깮:', error);
        res.status(500).send('寃뚯떆湲� �젙蹂� 議고쉶 �떎�뙣');
    }
});

router.delete('/community/post/:postId', async (req, res) => {
    const postId = req.params.postId;
    const connection = await db.getConnection();
    console.log('寃뚯떆湲� ID:', postId);

    try {
        await connection.beginTransaction();

        const alarmDeleteResult = await connection.query('DELETE FROM ALARM WHERE postId = ?', [postId]);
        console.log('�빐�떦 寃뚯떆湲� �븣�엺 �궘�젣:', alarmDeleteResult);

        const commentChildDeleteResult = await connection.query('DELETE FROM COMMENT WHERE postId = ? AND parentId IS NOT NULL', [postId]);
        console.log('�빐�떦 寃뚯떆湲� �떟湲� �궘�젣:', commentChildDeleteResult);

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
