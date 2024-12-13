const express = require('express');
const router = express.Router();
const db = require('../db'); 
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');

// Multer 설정 (이미지 업로드 위치와 파일명 설정)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/t24202/svr/src/uploads'); // 업로드 경로 설정
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`); // 파일명 설정
    }
});

const upload = multer({ storage: storage });

// 진단 결과 목록 조회 API
router.get('/list', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query('SELECT * FROM DIAGNOSIS WHERE userId = ?', [userId]);

        let rows = result;
        if (!Array.isArray(result)) {
            rows = [result];
        }
        console.log('list rows: ', rows);

        return res.status(200).json({
            message: '진단 결과 목록 조회 성공',
            diagnosisHistory: rows
        });
    } catch (error) {
        console.error('DB 쿼리 실패:', error);
        return res.status(500).json({ message: '서버에서 오류가 발생했습니다.', error });
    }
});

// 진단 결과 상세 조회 API
router.get('/detail/:diagnosis_id', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const diagnosisId = req.params.diagnosis_id;

        const [diagnosisResult] = await db.query('SELECT * FROM DIAGNOSIS WHERE diagnosisId = ? AND userId = ?', [diagnosisId, userId]);
        const [userResult] = await db.query('SELECT dogName FROM USER WHERE userId = ?', [userId]);

        if (!diagnosisResult || diagnosisResult.length === 0) {
            return res.status(404).json({ message: '해당 진단 데이터를 찾을 수 없습니다.' });
        }

        const diagnosisDetail = diagnosisResult;
        const dogName = userResult.dogName;

        return res.status(200).json({
            message: `반려견 ${dogName}의 진단 데이터를 보여드립니다.`,
            diagnosisDetail: {
                diagnosisResult: diagnosisDetail.diagnosisResult,
                description: diagnosisDetail.description,
                health: diagnosisDetail.health,
                imagePath: diagnosisDetail.imagePath,
                record: diagnosisDetail.record
            }
        });
    } catch (error) {
        console.error('DB 쿼리 실패:', error);
        return res.status(500).json({ message: '서버에서 오류가 발생했습니다.', error });
    }
});

// AI 진단 요청 API
router.post('/diagnosis-request', jwtMiddleware, upload.single('imagePath'), async (req, res) => {
    try {
        const userId = req.user.id;
        const record = req.body.record;
        const imagePath = req.file ? req.file.path : null;

        if (!imagePath) {
            return res.status(400).json({ message: '이미지가 업로드되지 않았습니다.' });
        }

        const result = spawn('python', ['/home/t24202/svr/src/image_test_one_fasterrcnn.py', imagePath]);
        let responseSent = false;

        result.stdout.on('data', async (data) => {
            if (!responseSent) {
                const predictedClass = data.toString().trim();
                console.log(`Predicted Class: ${predictedClass}`);

                if (predictedClass === '알수없음') {
                    res.status(200).json({
                        message: 'AI 진단 결과를 알 수 없습니다. 추가 진단을 진행하거나 커뮤니티로 이동해 주세요.',
                        options: {
                            retryDiagnosis: true,
                            goToCommunity: true
                        }
                    });
                    responseSent = true;
                    return;
                }

                const [diseaseInfo] = await db.query('SELECT diseaseName, description, health FROM DISEASE WHERE diseaseClass = ?', [predictedClass]);

                if (!diseaseInfo) {
                    res.status(404).json({ message: '해당 진단 데이터를 찾을 수 없습니다.' });
                    responseSent = true;
                    return;
                }

                const normalizedImagePath = imagePath.replace(/\\/g, '/');
                const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(normalizedImagePath)}`;

                res.status(200).json({
                    message: '진단 결과가 성공적으로 처리되었습니다.',
                    diagnosisDetail: {
                        diagnosisResult: diseaseInfo.diseaseName,
                        description: diseaseInfo.description,
                        health: diseaseInfo.health,
                        imagePath: imageUrl,
                        record
                    }
                });

                responseSent = true;
            }
        });

        result.stderr.on('data', (data) => {
            console.error(`Error: ${data}`);
            if (!responseSent) {
                res.status(500).json({ message: 'AI 실행 실패', error: data.toString() });
                responseSent = true;
            }
        });
    } catch (error) {
        console.error('AI 진단 요청 실패:', error);
        res.status(500).json({ message: '서버에서 오류가 발생했습니다.', error });
    }
});

// 진단 결과 저장 API
router.post('/save-from-diagnosis', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { diagnosisResult, description, health, imagePath, record } = req.body;

        await db.query(
            'INSERT INTO DIAGNOSIS (userId, diagnosisResult, description, health, imagePath, record, diagnosisDate) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [userId, diagnosisResult, description, health, imagePath, record]
        );
        console.log('save-from-diagnosis:', record);

        return res.status(201).json({ message: '진단 결과가 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('DB 쿼리 실패:', error);
        return res.status(500).json({ message: '서버에서 오류가 발생했습니다.', error });
    }
});

module.exports = router;
