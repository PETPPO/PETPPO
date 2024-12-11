const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/login', async (req, res) => {
    try {
        console.log('로그?�� ?���? ?��?��');
        res.json({ message: '로그?�� ?���?' });
    } catch (error) {
        console.error('로그?�� 처리 ?���?:', error);
        res.status(500).json({ success: false, message: '로그?�� 처리 �? ?���? 발생' });
    }
});

router.post('/login_process', async (req, res) => {
    try {
        console.log('로그?�� 기능 ?��?��');
        const { adminEmail, adminPw } = req.body;
        const query = 'SELECT * FROM ADMIN WHERE adminEmail = ? AND adminPw = ?';

        const results = await db.query(query, [adminEmail, adminPw]);
        console.log('쿼리 ?��?�� ?���?');

        if (results.length > 0) {
            console.log('로그?�� 결과:', results);
            req.session.adminEmail = results[0].adminEmail;
            console.log('�?리자 로그?�� ?���?!');

            res.status(201).json({
                success: true,
                message: "로그?��?�� ?��공적?���? ?��료되?��?��?��?��.",
                property: 201
            });
        } else {
            console.log('�?리자 로그?�� ?��?��');

            res.status(401).json({
                success: false,
                message: "�?리자 ?��보�?? ?��치하�? ?��?��?��?��. ?��?�� ?��?��?��주세?��!",
                property: 400
            });
        }
    } catch (error) {
        console.error('로그?�� 처리 ?���?:', error);
        res.status(500).json({ success: false, message: '로그?�� 처리 �? ?���? 발생' });
    }
});

router.get('/logout', async (req, res) => {
    try {
        console.log('로그?��?�� 기능 ?��?��');
        req.session.destroy(err => {
            if (err) {
                console.error('로그?��?�� ?���? 발생:', err);
                return res.status(500).send('�?리자 로그?��?�� ?��?��');
            }
            res.status(201).json({
                success: true,
                message: "로그?��?��?�� ?��공적?���? ?��료되?��?��?��?��.",
                property: 200
            });
            console.log('로그?��?�� ?���?!');
        });
    } catch (error) {
        console.error('로그?��?�� 처리 ?���?:', error);
        res.status(500).json({ success: false, message: '로그?��?�� 처리 �? ?��류�?? 발생?��?��?��?��.' });
    }
});

router.get('/users', async (req, res) => {
    try {
        console.log('?��?��?�� 목록 조회 ?���? ?��?�� 중입?��?��.');

        const results = await db.query('SELECT * FROM USER');
        res.status(200).json({
            success: true,
            message: "?��?��?�� 목록?�� ?��공적?���? 조회?��?��?��?��?��.",
            property: 200,
            users: results
        });
    } catch (error) {
        console.error('?��?��?�� 조회 ?���? 발생:', error);
        res.status(500).send('?��?��?�� 목록 조회 ?��?��');
    }
});

// router.delete('/users/:userId', async (req, res) => {
//     const userId = req.params.userId;
//     console.log('?��?��?�� ?��?��?�� ID:', userId);

//     try {
//         const [user] = await db.query('SELECT userEmail FROM USER WHERE userId = ?', [userId]);
//         const badUserEmail = user.userEmail;
//         console.log
//         await db.query('INSERT INTO BAD_USER (badUserEmail) VALUES (?)', [badUserEmail]);

//         const results = await db.query('DELETE FROM USER WHERE userId = ?', [userId]);

//         if (results.affectedRows === 0) {
//             console.log('?��?��?�� ?��?���? ?��?��?��?��?��?��.');
//             return res.status(404).json({
//                 success: false,
//                 message: '?��?��?�� ?��?�� �? ?��류�?? 발생?��?��?��?��. ?��?��?���? 존재?���? ?��거나 ?���? ?��?��?��?��?��?��?��.',
//                 property: 404
//             });
//         }

//         console.log('?��?��?�� ?��?�� ?���?');
//         res.status(200).json({
//             success: true,
//             message: '?��?��?���? ?��공적?���? ?��?��?��?��?��?��?��.',
//             property: 200
//         });
//     } catch (error) {
//         console.error('?��?��?�� ?��?�� ?���?:', error);
//         res.status(500).json({ success: false, message: '?��?��?�� ?��?�� �? ?���? 발생' });
//     }
// });

// router.delete('/users/:userId', async (req, res) => {
//     const userId = req.params.userId;
//     const connection = await db.getConnection(); // DB 연결 가져오기
//     console.log('삭제 요청 사용자 ID:', userId);

//     try {
//         await connection.beginTransaction(); // 트랜잭션 시작

//         // 사용자 이메일 가져오기
//         const [userResult] = await connection.query('SELECT userEmail FROM USER WHERE userId = ?', [userId]);
//         console.log('userResult:', userResult)
//         if (!userResult) {
//             await connection.rollback(); // 사용자 없으면 롤백
//             return res.status(404).json({
//                 success: false,
//                 message: '해당 사용자를 찾을 수 없습니다. 유효한 사용자 ID를 제공해주세요.',
//             });
//         }
//         const badUserEmail = userResult.userEmail;
//         console.log('hkhkhk')

//         // BAD_USER 테이블에 추가
//         await connection.query('INSERT INTO BAD_USER (badUserEmail) VALUES (?)', [badUserEmail]);
//         console.log('BAD_USER에 이메일 추가 완료:', badUserEmail);

//         // ALARM 테이블에서 관련 알람 삭제
//         const alarmDeleteResult = await connection.query('DELETE FROM ALARM WHERE userId = ?', [userId]);
//         console.log('ALARM 삭제 결과:', alarmDeleteResult);

//         // COMMENT 테이블에서 관련 댓글 삭제
//         const commentParentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE userId = ? AND parentId IS NOT NULL', [userId]);
//         console.log('Parent COMMENT 삭제 결과:', commentParentDeleteResult);


//         const commentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE userId = ?', [userId]);
//         console.log('COMMENT 삭제 결과:', commentDeleteResult);

//         // COMMUNITY 테이블에서 관련 게시글 삭제
//         const communityDeleteResult = await connection.query('DELETE FROM COMMUNITY WHERE userId = ?', [userId]);
//         console.log('COMMUNITY 삭제 결과:', communityDeleteResult);

//         // USER 테이블에서 사용자 삭제
//         const userDeleteResult = await connection.query('DELETE FROM USER WHERE userId = ?', [userId]);
//         console.log('USER 삭제 결과:', userDeleteResult);

//         if (userDeleteResult.affectedRows === 0) {
//             await connection.rollback(); // 사용자 삭제 실패 시 롤백
//             return res.status(404).json({
//                 success: false,
//                 message: '사용자를 삭제할 수 없습니다. 이미 삭제된 사용자일 수 있습니다.',
//             });
//         }

//         await connection.commit(); // 모든 작업 성공 시 커밋
//         console.log('사용자 삭제 완료:', userId);

//         res.status(200).json({
//             success: true,
//             message: '사용자가 성공적으로 삭제되었습니다.',
//         });
//     } catch (error) {
//         await connection.rollback(); // 에러 발생 시 롤백
//         console.error('사용자 삭제 중 오류:', error);
//         res.status(500).json({
//             success: false,
//             message: '사용자 삭제 중 문제가 발생했습니다.',
//         });
//     } finally {
//         connection.release(); // DB 연결 반환
//     }
// });

router.delete('/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    const connection = await db.getConnection(); // DB 연결 가져오기
    console.log('삭제 요청 사용자 ID:', userId);

    try {
        await connection.beginTransaction(); // 트랜잭션 시작

        // 사용자 이메일 가져오기
        const [userResult] = await connection.query('SELECT userEmail FROM USER WHERE userId = ?', [userId]);
        console.log('userResult:', userResult)
        if (!userResult) {
            await connection.rollback(); // 사용자 없으면 롤백
            return res.status(404).json({
                success: false,
                message: '해당 사용자를 찾을 수 없습니다. 유효한 사용자 ID를 제공해주세요.',
            });
        }
        const badUserEmail = userResult.userEmail;
        //console.log('hkhkhk')

        // BAD_USER 테이블에 추가
        await connection.query('INSERT INTO BAD_USER (badUserEmail) VALUES (?)', [badUserEmail]);
        console.log('BAD_USER에 이메일 추가 완료:', badUserEmail);

        // ALARM 테이블에서 관련 알람 삭제
        await connection.query('DELETE FROM ALARM WHERE commentId IN (SELECT commentId FROM COMMENT WHERE userId = ? AND parentId IS NOT NULL)', [userId]);
        console.log('ALARM에서 commentId 참조 삭제 완료');

        await connection.query('DELETE FROM ALARM WHERE commentId IN (SELECT commentId FROM COMMENT WHERE userId = ?)', [userId]);
        console.log('ALARM에서 commentId 참조 삭제 완료2');
        
        // 먼저 COMMENT 테이블에서 관련 댓글 삭제
        const commentParentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE userId = ? AND parentId IS NOT NULL', [userId]);
        console.log('Parent COMMENT 삭제 결과:', commentParentDeleteResult);
        
        // COMMENT 테이블에서 관련 댓글 삭제
        const commentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE userId = ?', [userId]);
        console.log('COMMENT 삭제 결과:', commentDeleteResult);

        // COMMUNITY 테이블에서 관련 게시글 삭제
        const communityDeleteResult = await connection.query('DELETE FROM COMMUNITY WHERE userId = ?', [userId]);
        console.log('COMMUNITY 삭제 결과:', communityDeleteResult);

        // USER 테이블에서 사용자 삭제
        const userDeleteResult = await connection.query('DELETE FROM USER WHERE userId = ?', [userId]);
        console.log('USER 삭제 결과:', userDeleteResult);

        if (userDeleteResult.affectedRows === 0) {
            await connection.rollback(); // 사용자 삭제 실패 시 롤백
            return res.status(404).json({
                success: false,
                message: '사용자를 삭제할 수 없습니다. 이미 삭제된 사용자일 수 있습니다.',
            });
        }

        await connection.commit(); // 모든 작업 성공 시 커밋
        console.log('사용자 삭제 완료:', userId);

        res.status(200).json({
            success: true,
            message: '사용자가 성공적으로 삭제되었습니다.',
        });
    } catch (error) {
        await connection.rollback(); // 에러 발생 시 롤백
        console.error('사용자 삭제 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 삭제 중 문제가 발생했습니다.',
        });
    } finally {
        connection.release(); // DB 연결 반환
    }
});

router.get('/community/posts', async (req, res) => {
    try {
        console.log('커�?�니?�� 게시�? 목록 조회 ?���? ?��?�� 중입?��?��.');
        const results = await db.query('SELECT * FROM COMMUNITY');
        res.status(200).json({
            success: true,
            message: '게시�? 목록?�� ?��공적?���? 조회?��?��?��?��?��.',
            property: 200,
            ports: results
        });
        console.log(results)
    } catch (error) {
        console.error('게시�? 조회 ?���? 발생:', error);
        res.status(500).send('게시�? 목록 조회 ?��?��');
    }
});

router.delete('/community/post/:postId', async (req, res) => {
    const postId = req.params.postId;
    const connection = await db.getConnection(); // DB 연결 가져오기
    console.log('삭제 요청 게시글 ID:', postId);

    try {
        await connection.beginTransaction(); // 트랜잭션 시작

        // ALARM 테이블에서 관련 알림 삭제
        const alarmDeleteResult = await connection.query('DELETE FROM ALARM WHERE postId = ?', [postId]);
        console.log('ALARM 삭제 결과:', alarmDeleteResult);

        // COMMENT 테이블에서 관련 댓글 삭제
        const commentChildDeleteResult = await connection.query('DELETE FROM COMMENT WHERE postId = ? AND parentId IS NOT NULL', [postId]);
        console.log('COMMENT 자식 댓글 삭제 결과:', commentChildDeleteResult);

        const commentDeleteResult = await connection.query('DELETE FROM COMMENT WHERE postId = ?', [postId]);
        console.log('COMMENT 삭제 결과:', commentDeleteResult);

        // COMMUNITY 테이블에서 게시글 삭제
        const result = await connection.query('DELETE FROM COMMUNITY WHERE postId = ?', [postId]);
        console.log('COMMUNITY 삭제 결과:', result);

        if (result.affectedRows === 0) {
            await connection.rollback(); // 게시글이 없는 경우 롤백
            console.log('해당 게시글을 찾을 수 없습니다.');
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다. 유효한 게시글 ID를 제공해주세요.',
            });
        }

        await connection.commit(); // 모든 삭제 작업 커밋
        console.log('게시글 삭제 완료:', postId);

        return res.status(200).json({
            success: true,
            message: '게시글이 성공적으로 삭제되었습니다.',
        });
    } catch (error) {
        await connection.rollback(); // 에러 발생 시 롤백
        console.error('게시글 삭제 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: '게시글 삭제 중 문제가 발생했습니다.',
        });
    } finally {
        connection.release(); // DB 연결 반환
    }
});

router.get('/diseases', async (req, res) => {
    try {
        console.log('질환 목록 조회 ?���? ?��?�� ?���?!');
        const results = await db.query('SELECT * FROM DISEASE');

        if (results.length === 0) {
            return res.status(200).json({
                success: false,
                message: "질환 목록?�� 조회?���? ?��?��?��?��?��.",
                property: 500
            });
        }

        res.status(200).json({
            success: true,
            message: "질환 목록?�� ?��공적?���? 조회?��?��?��?��?��.",
            property: 200,
            diseases: results
        });
    } catch (error) {
        console.error('질환 조회 ?���? 발생:', error);
        res.status(500).json({ success: false, message: '질환 목록 조회 �? ?���? 발생' });
    }
});

router.get('/diseases/:diseaseId', async (req, res) => {
    const diseaseId = req.params.diseaseId;
    console.log('질환 ?��?�� 조회 ?���? ?��?�� ?���?!');
    console.log('조회?�� 질환 ID:', diseaseId);

    try {
        const results = await db.query('SELECT * FROM DISEASE WHERE diseaseId = ?', [diseaseId]);

        if (results.length > 0) {
            res.status(200).json({
                success: true,
                message: '?��?�� 질환 ?��보�?? ?��공적?���? 조회?��?��?��?��?��.',
                property: 200,
                disease: results
            });
        } else {
            res.status(404).json({
                success: false,
                message: '?��?�� 질환?�� 찾을 ?�� ?��?��?��?��.',
                property: 404
            });
        }
    } catch (error) {
        console.error('질환 ?��?�� 조회 ?���? 발생:', error);
        res.status(500).json({ success: false, message: '질환 ?��?�� 조회 �? ?���? 발생' });
    }
});

router.get('/dashboard', async (req, res) => {
    try {
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
                count: Number(tag.count) // BigInt 변환
            }))
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('????��보드 조회 ?���? 발생:', error);
        res.status(500).json({ success: false, message: '????��보드 조회 �? ?���? 발생' });
    }
});

module.exports = router;
