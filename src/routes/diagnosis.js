const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 모듈 불러?���??
const jwtMiddleware = require('../middlewares/jwtMiddleware'); // JWT 미들?��?��
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');

// ?��미�?? ?��로드 ?��?��
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/t24202/svr/src/uploads'); // ?��로드 경로 ?��?��
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`); // ?��?���?? ?��?��
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
            message: '진단 결과 목록 조회 ?���??',
            diagnosisHistory: rows
        });
    } catch (error) {
        console.error('DB 쿼리 ?���??:', error);
        return res.status(500).json({ message: '?��류�?? 발생?��?��?��?��', error });
    }
});

// 진단 결과 ?��?�� 조회 API
router.get('/detail/:diagnosis_id', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const diagnosisId = req.params.diagnosis_id;
        console.log('userId:', userId);
        console.log('req.user.id:', req.user.id);
        console.log('diagnosisId:', diagnosisId);
        console.log('req.params.diagnosis_id:', req.params.diagnosis_id);

        const [diagnosisResult] = await db.query('SELECT * FROM DIAGNOSIS WHERE diagnosisId = ? AND userId = ?', [diagnosisId, userId]);
        const [userResult] = await db.query('SELECT dogName FROM USER WHERE userId = ?', [userId]);

        console.log('diagnosisResult:', diagnosisResult);
        console.log('userResult:', userResult);

        if (!diagnosisResult || diagnosisResult.length === 0) {
            return res.status(404).json({ message: '?��?�� 진단 기록?�� 찾을 ?�� ?��?��?��?��.' });
        }

        const diagnosisDetail = diagnosisResult;
        const dogName = userResult.dogName;

        return res.status(200).json({
            message: `과거 ${dogName}?�� 진단 기록?�� 보여줍니?��.`,
            diagnosisDetail: {
                diagnosisResult: diagnosisDetail.diagnosisResult,
                description: diagnosisDetail.description,
                health: diagnosisDetail.health,
                imagePath: diagnosisDetail.imagePath,
                record: diagnosisDetail.record
            }
        });
    } catch (error) {
        console.error('DB 쿼리 ?���??:', error);
        return res.status(500).json({ message: '?��류�?? 발생?��?��?��?��', error });
    }
});

// AI 진단 ?���?? API
router.post('/diagnosis-request', jwtMiddleware, upload.single('imagePath'), async (req, res) => {
    try {
        const userId = req.user.id;
        const record = req.body.record;
        const imagePath = req.file ? req.file.path : null;

        if (!imagePath) {
            return res.status(400).json({ message: '?��미�??�?? ?��로드?���?? ?��?��?��?��?��.' });
        }

        const result = spawn('python', ['/home/t24202/svr/src/image_test_one_fasterrcnn.py', imagePath]);
        let responseSent = false;

        result.stdout.on('data', async (data) => {
            if (!responseSent) {
                const predictedClass = data.toString().trim();
                console.log(`Predicted Class: ${predictedClass}`);

                if (predictedClass === '불명?��') {
                    res.status(200).json({
                        message: 'AI 진단 결과�?? 불명?��?��?��?��. 추�?? 진단?�� ?��?��?��거나 커�?�니?��?��?�� 질문?�� ?��보세?��.',
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
                    res.status(404).json({ message: '?��?�� 질병 ?��보�?? 찾을 ?�� ?��?��?��?��.' });
                    responseSent = true;
                    return;
                }

                const normalizedImagePath = imagePath.replace(/\\/g, '/');
                const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(normalizedImagePath)}`;

                res.status(200).json({
                    message: '진단 결과�?? ?��공적?���?? ?��료되?��?��?��?��.',
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
                res.status(500).json({ message: 'AI 분석 ?���??', error: data.toString() });
                responseSent = true;
            }
        });
    } catch (error) {
        console.error('AI 진단 ?���?? ?���??:', error);
        res.status(500).json({ message: '?��류�?? 발생?��?��?��?��', error });
    }
});

// 진단 결과 ????�� API
router.post('/save-from-diagnosis', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { diagnosisResult, description, health, imagePath, record } = req.body;

        await db.query(
            'INSERT INTO DIAGNOSIS (userId, diagnosisResult, description, health, imagePath, record, diagnosisDate) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [userId, diagnosisResult, description, health, imagePath, record]
        );
        console.log('save-from-diagnosis:', record);

        return res.status(201).json({ message: '진단 결과�?? ?��공적?���?? ????��?��?��?��?��?��.' });
    } catch (error) {
        console.error('DB 쿼리 ?���??:', error);
        return res.status(500).json({ message: '?��류�?? 발생?��?��?��?��', error });
    }
});

module.exports = router;
