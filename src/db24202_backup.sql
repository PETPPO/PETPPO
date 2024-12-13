-- MariaDB dump 10.19  Distrib 10.11.6-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: db24202
-- ------------------------------------------------------
-- Server version	10.11.6-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ADMIN`
--

DROP TABLE IF EXISTS `ADMIN`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ADMIN` (
  `adminId` int(11) NOT NULL,
  `adminEmail` varchar(50) NOT NULL,
  `adminName` varchar(10) NOT NULL,
  `adminPw` varchar(50) NOT NULL,
  PRIMARY KEY (`adminId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ADMIN`
--

LOCK TABLES `ADMIN` WRITE;
/*!40000 ALTER TABLE `ADMIN` DISABLE KEYS */;
INSERT INTO `ADMIN` VALUES
(1,'kimh0425@gachon.ac.kr','김현우','12345678');
/*!40000 ALTER TABLE `ADMIN` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ALARM`
--

DROP TABLE IF EXISTS `ALARM`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ALARM` (
  `alarmId` int(11) NOT NULL AUTO_INCREMENT,
  `postId` int(11) NOT NULL,
  `commentId` int(11) NOT NULL,
  `parentId` int(11) DEFAULT NULL,
  `userId` int(11) NOT NULL,
  `commentDate` datetime DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`alarmId`),
  KEY `postId` (`postId`),
  KEY `commentId` (`commentId`),
  KEY `userId` (`userId`),
  KEY `parentId` (`parentId`),
  CONSTRAINT `ALARM_ibfk_1` FOREIGN KEY (`postId`) REFERENCES `COMMUNITY` (`postId`),
  CONSTRAINT `ALARM_ibfk_2` FOREIGN KEY (`commentId`) REFERENCES `COMMENT` (`commentId`),
  CONSTRAINT `ALARM_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `USER` (`userId`),
  CONSTRAINT `ALARM_ibfk_4` FOREIGN KEY (`parentId`) REFERENCES `COMMENT` (`commentId`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ALARM`
--

LOCK TABLES `ALARM` WRITE;
/*!40000 ALTER TABLE `ALARM` DISABLE KEYS */;
INSERT INTO `ALARM` VALUES
(15,3,117,NULL,1,'2024-11-08 15:19:16',1),
(16,3,119,NULL,1,'2024-11-08 15:19:38',1),
(17,3,120,NULL,1,'2024-11-08 15:22:41',1),
(18,14,123,NULL,1,'2024-11-09 17:13:50',1),
(21,14,129,NULL,1,'2024-11-09 17:20:55',0),
(24,11,171,NULL,19,'2024-11-10 16:53:37',0),
(25,11,172,NULL,19,'2024-11-10 16:53:51',0),
(28,17,221,NULL,1,'2024-11-11 13:58:39',0),
(33,35,325,NULL,13,'2024-11-14 00:55:45',1),
(34,3,326,117,13,'2024-11-14 00:56:22',1),
(35,11,327,NULL,19,'2024-11-14 00:57:22',0),
(37,35,329,NULL,13,'2024-11-14 01:00:00',1),
(41,35,333,325,1,'2024-11-14 01:07:32',0),
(42,41,348,NULL,13,'2024-11-20 17:27:58',1),
(43,41,349,NULL,13,'2024-11-20 17:29:31',1),
(46,41,352,348,1,'2024-11-20 17:33:46',0);
/*!40000 ALTER TABLE `ALARM` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `BAD_USER`
--

DROP TABLE IF EXISTS `BAD_USER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `BAD_USER` (
  `badUserId` int(11) NOT NULL AUTO_INCREMENT,
  `badUserEmail` varchar(50) NOT NULL,
  PRIMARY KEY (`badUserId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BAD_USER`
--

LOCK TABLES `BAD_USER` WRITE;
/*!40000 ALTER TABLE `BAD_USER` DISABLE KEYS */;
INSERT INTO `BAD_USER` VALUES
(1,'wjdgmldus@gmail.com'),
(5,'hee@gmail.com');
/*!40000 ALTER TABLE `BAD_USER` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `COMMENT`
--

DROP TABLE IF EXISTS `COMMENT`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `COMMENT` (
  `commentId` int(11) NOT NULL AUTO_INCREMENT,
  `parentId` int(11) DEFAULT NULL,
  `postId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `commentContent` varchar(255) DEFAULT NULL,
  `commentDate` datetime NOT NULL,
  PRIMARY KEY (`commentId`),
  KEY `parentId` (`parentId`),
  KEY `postId` (`postId`),
  KEY `userId` (`userId`),
  CONSTRAINT `COMMENT_ibfk_1` FOREIGN KEY (`parentId`) REFERENCES `COMMENT` (`commentId`),
  CONSTRAINT `COMMENT_ibfk_2` FOREIGN KEY (`postId`) REFERENCES `COMMUNITY` (`postId`),
  CONSTRAINT `COMMENT_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `USER` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=368 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `COMMENT`
--

LOCK TABLES `COMMENT` WRITE;
/*!40000 ALTER TABLE `COMMENT` DISABLE KEYS */;
INSERT INTO `COMMENT` VALUES
(28,NULL,5,13,'좋은 정보네요! 감사합니다!','2024-11-06 11:10:12'),
(29,28,5,13,'답변 감사합니다!','2024-11-06 11:23:25'),
(31,28,5,13,'이건 답글입니다~~~','2024-11-06 11:26:41'),
(32,28,5,13,'이건 답글입니다~~~','2024-11-06 11:26:58'),
(104,32,5,13,'ㅠㅠ제발 왜이래','2024-11-08 13:50:45'),
(117,NULL,3,13,'여드름도 보습과 관련이 있군요!!','2024-11-08 15:19:16'),
(118,117,3,13,'알려주셔서 감사합니다~','2024-11-08 15:19:24'),
(119,NULL,3,13,'이거는 댓글이용','2024-11-08 15:19:38'),
(120,NULL,3,13,'이거는 3번 댓글이용','2024-11-08 15:22:41'),
(121,119,3,13,'답글 2!','2024-11-08 15:22:51'),
(122,119,3,13,'답글 3!','2024-11-08 15:50:40'),
(123,NULL,14,13,'1','2024-11-09 17:13:50'),
(129,NULL,14,13,'ㅇㅇ','2024-11-09 17:20:55'),
(144,NULL,15,1,NULL,'2024-11-10 14:54:00'),
(145,NULL,15,1,NULL,'2024-11-10 14:56:58'),
(147,NULL,17,1,NULL,'2024-11-10 15:22:32'),
(148,NULL,17,1,NULL,'2024-11-10 15:22:32'),
(155,NULL,17,1,NULL,'2024-11-10 15:40:19'),
(156,NULL,17,1,'댓글~~!!,댓글~~!!댓글~~!!댓글~~!!댓글~~!!댓글~~!!댓글~~!!','2024-11-10 15:42:08'),
(168,NULL,21,13,'댓글 1','2024-11-10 16:52:36'),
(170,168,21,13,'답글 1','2024-11-10 16:52:43'),
(171,NULL,11,13,'댓글 1','2024-11-10 16:53:37'),
(172,NULL,11,13,'댓글 2','2024-11-10 16:53:51'),
(221,NULL,17,19,'댓글~~!!,댓글~~!!댓글~~!!댓글~~!!댓글~~!!댓글~~!!댓글~~!!','2024-11-11 13:58:39'),
(307,172,11,17,'답글 2','2024-11-14 00:11:40'),
(325,NULL,35,1,'음!! 저도 요즘 이 문제로 고민이었는데.. 아시는 분 댓글 달아주세요!','2024-11-14 00:55:45'),
(326,117,3,1,'우왕~ 알려주셔서 감사해요ㅎㅎ','2024-11-14 00:56:22'),
(327,NULL,11,1,'지금 환절기라 그럴수도 있어요! 샤워 후에 로션 발라주시나요??','2024-11-14 00:57:22'),
(328,NULL,5,1,'헉 감사합니다ㅎㅎ','2024-11-14 00:57:33'),
(329,NULL,35,2,'맞아요@ 저도 얼마전에 이 일로 동물 병원에 다녀왔어요! 바디워시를 바꾸시거나 심하면 동물병원 내원 추천드려요!','2024-11-14 01:00:00'),
(330,NULL,5,2,'우와~ 좋은데요','2024-11-14 01:00:46'),
(333,325,35,13,'답변 감사합니다~','2024-11-14 01:07:32'),
(335,NULL,35,13,'모두에게 도움이 되는 게시글이면 좋겠네요!!','2024-11-14 01:08:22'),
(336,NULL,35,13,'댓글입니다~','2024-11-14 01:08:41'),
(337,336,35,13,'답글입니다~','2024-11-14 01:08:47'),
(348,NULL,41,1,'음! 이 앱이 확실히 도움이 되는군요!!','2024-11-20 17:27:58'),
(349,NULL,41,1,'저도 이 앱 덕분에 여드름 조기 발견해서 자가 치료한 경험이 있어요ㅎㅎ','2024-11-20 17:29:31'),
(352,348,41,13,'네! 저는 진짜 자주 사용해요 특히 바빠서 병원 바로 못갈 때나 병원 문 닫은 늦은 밤이요ㅠㅠ','2024-11-20 17:33:46'),
(353,NULL,41,13,'이 어플 진짜 유용해요! 모두 많이 사용하시면 큰 도움이 될 것 같아요','2024-11-20 17:34:29');
/*!40000 ALTER TABLE `COMMENT` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `COMMUNITY`
--

DROP TABLE IF EXISTS `COMMUNITY`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `COMMUNITY` (
  `postId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `postDate` datetime NOT NULL,
  `commentCount` int(11) DEFAULT NULL,
  `userName` varchar(255) NOT NULL,
  `diseaseTag` varchar(255) DEFAULT NULL,
  `imagePath` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`postId`),
  KEY `userId` (`userId`),
  CONSTRAINT `COMMUNITY_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `USER` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `COMMUNITY`
--

LOCK TABLES `COMMUNITY` WRITE;
/*!40000 ALTER TABLE `COMMUNITY` DISABLE KEYS */;
INSERT INTO `COMMUNITY` VALUES
(3,1,'여드름 심했던 루피 치료과정','피부 건조함에 취약하니 항시 보습 유지해줘야 합니다!','2024-11-06 20:25:54',4,'최옹환','농포/여드름',NULL),
(5,13,'각질 관리 공유용!!','반려견 피부에 각질이 생겨본 적 있으신가요? 저는 습도를 낮추고 비타민A가 풍부한 당근을 주니 괜찮아진 적 있어서 공유해드려요!','2024-11-07 00:07:01',8,'정희연','비듬/각질/상피성잔고리',NULL),
(8,13,'너무 걱정돼요 ㅠㅡㅠ','진단 받아오니 종양 같은거래요.. 너무 걱정되는데 이런 경험 있으신 분 계신가요??ㅠㅠ\n','2024-11-07 00:20:48',0,'정희연','결정/중괴','http://ceprj.gachon.ac.kr:60017/uploads/1730906448596_upload_image.jpg'),
(11,19,'오늘 갑자기 여드름이 생겼어요..ㅠㅠ','갑자기 피부 질환이 생기기도 하나요? 강아지용 연고라도 발라줘야하나.. 다들 어떻게 관리하시나요??','2024-11-07 00:46:30',4,'희연','기타','http://ceprj.gachon.ac.kr:60017/uploads/1730907990436_upload_image.jpg'),
(14,1,'우리집 강아지 여드름 원인!!','강아지가 드라이기 바람을 너무 싫어해서 항상 털이 덜 말렸는데 목욕 후에는 반드시 털을 완벽하게 말려주셔야 한다고 하네요ㅠㅠ 사람도 머리를 감고 난 후 제대로 말리지 않으면 두피에 트러블이 발생하듯이 강아지도 마찬가지로 뽀송하게 다 말려주셔야 한다고 합니다! 저희집 강아지도 증상이 많이 호전되었어요ㅎㅎ!','2024-11-07 22:32:27',4,'최옹환','농포/여드름',NULL),
(15,1,'테스트 게시글 입니다.테스트 게시글 입니다.테스트 게시글 입니다.','피부 건조함에 취약하니 항시 보습 유지해줘야 합니다!','2024-11-10 14:52:34',2,'최옹환','농포/여드름',NULL),
(17,1,'레전드 테스트 게시글','피부 건조 유지','2024-11-10 15:22:06',5,'최옹환','농포/여드름',NULL),
(21,13,'레전드 테스트 게시글','피부 건조 유지','2024-11-10 16:51:11',2,'정희연','농포/여드름',NULL),
(35,13,'혼자 질환 찾아보기 어려워요..ㅠㅠ','진단 받아보니 세정제때문일 수 도 있다네요.. 이런 피부 보신 적 있으신가요? 저희 가루 바디워시를 새로 사봤는데 그거때문일까요... ㅠ','2024-11-14 00:46:48',8,'정희연','미란/계양','http://ceprj.gachon.ac.kr:60017/uploads/1731512808076_upload_image.jpg'),
(41,13,'우리집 강아지 피부 관리 5일차!!','앱에서 궤양 진단 받고 알려준 자가 치료 방법 최대한 따라서 관리중입니다! 진단 전보다 훨씬 좋아진 것 같아요ㅎㅎ ','2024-11-20 17:21:02',6,'정희연','미란/궤양','http://ceprj.gachon.ac.kr:60017/uploads/1732090862482_upload_image.jpg'),
(51,13,'레전드 테스트 게시글','피부 건조 유지','2024-12-12 13:19:59',0,'정희연','농포/여드름',NULL),
(52,13,'강아지 피부 색소침착, 다들 이런 적 있나요?','다들 강아지 피부 색소침착 때문에 고민해본 적 있나요? 우리 집 강아지가 요즘 피부가 갈색으로 변해가고 있어요. 병원에서 \"태선화의 초기일 수도 있다\"는 말을 듣고 예방하려고 이것저것 알아보는 중이에요!\n혹시 비슷한 경험이 있으신 분들은 어떤 방법으로 관리하셨는지 알려주세요. 좋은 정보는 공유하고, 힘든 마음은 함께 나눠봐요!!','2024-12-12 13:21:16',0,'정희연','태선화/과다색소침착',NULL),
(53,13,'강아지 태선화? 우리 집 멍멍이의 피부 이야기','안녕하세요, 우리 멍멍이 피부에 검은색 반점 같은 게 생겨서 걱정했는데, 병원에서는 색소침착이라고 하더라고요. 아직 심한 건 아니지만 더 진행되면 어쩌나 걱정이에요 ..\n평소 피부를 어떻게 관리해주면 좋을까요? 그리고 스트레스가 원인이 될 수도 있다고 하던데, 마음을 편하게 해주는 팁이 있다면 공유해주시면 감사하겠습니다!','2024-12-12 13:21:46',0,'정희연','태선화/과다색소침착',NULL),
(54,13,'알레르기 관련 고민..ㅠㅠ','두부가 알레르기가 불편해하는 것 같아요.... 혹시 알레르기 때문에 고민해보신 견주 분 있으신가요?','2024-12-12 13:22:23',0,'정희연','구진/플라크',NULL),
(55,13,'사료도 피부와 관련이 있을까용??','저희 강아지는 기름진 사료를 먹인 이후로 각질이 덜 생기는 것 같아요. 혹시 비슷한 경험 있으신가요?','2024-12-12 13:23:30',0,'정희연','비듬/각질/상피성잔고리',NULL),
(56,13,'구진 질환 겪어본 견주분 계실까요..ㅠㅠ','구진이 자꾸 커지는 것 같아서 걱정이에요. 혹시 자연치유가 가능한 사례가 있을까요?','2024-12-12 13:24:11',0,'정희연','구진/플라크',NULL),
(57,13,'플라크가 맞는 걸까요??','반려견 등 쪽에 둥근 반점 같은 게 생겼는데 이게 플라크 맞나요? 병원에 가야 할지 고민이에요ㅠ','2024-12-12 13:25:03',0,'정희연','구진/플라크',NULL),
(58,13,'산책 후 구진이 생기는 경우','산책 갔다 오면 피부에 뭔가 두드러기처럼 올라오는데... 저랑 같은 고민 있으신 분들 조언 부탁드려요!','2024-12-12 13:25:25',0,'정희연','구진/플라크',NULL),
(59,13,'플라크 치료 생활 습관이 궁금해요!','알레르기 때문에 플라크가 생긴 거라고 하네요. 혹시 플라크 치료에 도움 되는 생활 습관이 있을까요?','2024-12-12 13:25:49',0,'정희연','구진/플라크',NULL),
(60,13,'털갈이 시즌, 비듬 관리 팁이 있을까요?','털갈이 시즌이라 그런지 비듬이 심해요ㅠㅠ 목욕 주기를 조정해보라는 조언이 있던데 효과 있나요?','2024-12-12 13:26:31',0,'정희연','비듬/각질/상피성잔고리',NULL),
(61,13,'건조증으로 인한 각질, 추가 팁 있나요?','각질이 심해서 병원에 갔더니 건조증이라고 하네요. 혹시 추가로 해보면 좋은 방법 있을까요?','2024-12-12 13:26:46',0,'정희연','비듬/각질/상피성잔고리',NULL),
(62,13,'상피성 잔고리, 처음이라 조언 부탁드려요!','상피성 잔고리라는 진단을 받았는데... 이런 경우는 처음이라 조언 구하고 싶습니다.','2024-12-12 13:27:07',0,'정희연','비듬/각질/상피성잔고리',NULL),
(63,13,'스트레스성 색소침착, 해결 방법이 궁금해요!','색소침착이 심한데 병원에서는 스트레스 때문일 수도 있다고 하네요. 이럴 땐 어떻게 하면 좋을까요?','2024-12-12 13:27:31',0,'정희연','태선화/과다색소침착',NULL),
(64,13,'태선화 관리, 온찜질 효과 있을까요?','태선화로 인해 피부가 딱딱해졌는데, 온찜질이 효과 있을까요? 비슷한 경험이 있으신 분 조언 부탁드려요!','2024-12-12 13:27:48',0,'정희연','태선화/과다색소침착',NULL),
(65,13,'과다 색소침착 치료 방법 공유 부탁드립니다.','과다 색소침착 때문에 피부가 검게 변했는데, 병원 치료 외에 할 수 있는 방법이 있을까요?','2024-12-12 13:28:05',0,'정희연','태선화/과다색소침착',NULL),
(66,13,'두꺼워진 피부, 좋은 치료 방법 없을까요?','피부가 두꺼워지고 검어지는 게 심해져서 걱정이에요. 혹시 좋은 치료 방법 아시는 분 댓글 부탁드립니다!','2024-12-12 13:28:22',0,'정희연','태선화/과다색소침착',NULL),
(67,13,'미란 관리 팁 있으신가요?','저희 강아지 피부에 미란이 생겨서 약을 발라줬는데요. 혹시 추가로 관리할 방법 추천 부탁드려요!','2024-12-12 13:28:45',0,'정희연','미란/궤양',NULL),
(68,13,'궤양 부위를 긁는 강아지...ㅠ 방지 팁 있나요?','궤양이 생긴 이후로 자꾸 긁어서 피가 나요ㅠㅠ 긁지 않도록 방지할 수 있는 팁 있나요?','2024-12-12 13:28:59',0,'정희연','미란/궤양',NULL),
(69,13,'미란 부위 씻길 때 자극을 덜 주는 방법?','미란 부위를 씻길 때 자극을 덜 줄 수 있는 방법이 궁금해요. 혹시 제품 추천해주실 수 있을까요?','2024-12-12 13:29:17',0,'정희연','미란/궤양',NULL),
(70,13,'궤양이 심해지는 경우, 산책 제한해야 할까요?','산책 후에 궤양이 심해진 것 같아요. 혹시 외부 활동을 제한해야 할까요?','2024-12-12 13:29:35',0,'정희연','미란/궤양',NULL),
(71,13,'미란 부위 보호, 방수 붕대 사용 괜찮을까요?','미란이 있는 피부 부위를 보호하기 위해 저렴한 방수 붕대를 사용하고 있는데, 이 방법 괜찮을까요?','2024-12-12 13:29:48',0,'정희연','미란/궤양',NULL),
(72,13,'피부 결절, 어플 진단 추천드릴까요?','피부에 조그마한 결절 같은 게 생겼어요. 병원에 가기 전에 어플로 진단 받아보는 게 좋을까요?','2024-12-12 13:30:31',0,'정희연','결정/종괴',NULL),
(73,13,'종괴 검사, 어떤 걸 받으면 좋을까요?','종괴처럼 보이는 혹이 생겼는데, 양성인지 악성인지 확인하려면 어떤 검사를 받아야 하나요?','2024-12-12 13:30:46',0,'정희연','결정/종괴',NULL),
(74,13,'종괴 조직검사 전 주의사항 있나요?','종괴 때문에 병원에서 조직검사를 권유받았는데요. 혹시 검사 전 주의해야 할 점이 있을까요?','2024-12-12 13:31:05',0,'정희연','결정/종괴',NULL),
(75,13,'결절 부위 홈케어 팁 추천 부탁드립니다!','결절 부위를 만지면 아파하는 것 같은데, 추가로 해볼 수 있는 홈케어 방법이 있을까요?','2024-12-12 13:31:22',0,'정희연','결정/종괴',NULL);
/*!40000 ALTER TABLE `COMMUNITY` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DIAGNOSIS`
--

DROP TABLE IF EXISTS `DIAGNOSIS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DIAGNOSIS` (
  `diagnosisId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `diagnosisResult` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `health` text NOT NULL,
  `imagePath` varchar(255) NOT NULL,
  `record` text NOT NULL,
  `diagnosisDate` datetime DEFAULT NULL,
  PRIMARY KEY (`diagnosisId`),
  KEY `userId` (`userId`),
  CONSTRAINT `DIAGNOSIS_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `USER` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DIAGNOSIS`
--

LOCK TABLES `DIAGNOSIS` WRITE;
/*!40000 ALTER TABLE `DIAGNOSIS` DISABLE KEYS */;
INSERT INTO `DIAGNOSIS` VALUES
(1,13,'무증상','피부에 우려할 만한 증상은 보이지 않아요. 앞으로도 꾸준히 신경 써주세요!','TEST_health7','http://ceprj.gachon.ac.kr:60017/uploads/1730891467081_diagnosis_image.jpg','피부가 계속 붉어진다ㅠㅠ','2024-11-06 20:12:13'),
(2,13,'무증상','피부에 우려할 만한 증상은 보이지 않아요. 앞으로도 꾸준히 신경 써주세요!','TEST_health7','http://ceprj.gachon.ac.kr:60017/uploads/1730901656281_diagnosis_image.jpg','우리집 강아지 피부가 왜이럴까..ㅠㅠ','2024-11-06 23:01:11'),
(3,13,'무증상','피부에 우려할 만한 증상은 보이지 않아요. 앞으로도 꾸준히 신경 써주세요!','TEST_health7','http://ceprj.gachon.ac.kr:60017/uploads/1730901746797_diagnosis_image.jpg','쿠키 피부 검진ㅎㅎ\n','2024-11-06 23:02:40'),
(4,13,'무증상','피부에 우려할 만한 증상은 보이지 않아요. 앞으로도 꾸준히 신경 써주세요!','TEST_health7','http://ceprj.gachon.ac.kr:60017/uploads/1730904602450_diagnosis_image.jpg','관리 1일차!\n','2024-11-06 23:50:09'),
(5,13,'무증상','피부에 우려할 만한 증상은 보이지 않아요. 앞으로도 꾸준히 신경 써주세요!','TEST_health7','http://ceprj.gachon.ac.kr:60017/uploads/1730906861582_diagnosis_image.jpg','피부 상태 기록 1일차!!','2024-11-07 00:27:47'),
(6,13,'무증상','피부에 우려할 만한 증상은 보이지 않아요. 앞으로도 꾸준히 신경 써주세요!','TEST_health7','http://ceprj.gachon.ac.kr:60017/uploads/1730907093639_diagnosis_image.jpg','피부가 너무 붉은 것 같다..ㅠㅠ 왜이럴까','2024-11-07 00:31:39'),
(7,19,'무증상','피부에 우려할 만한 증상은 보이지 않아요. 앞으로도 꾸준히 신경 써주세요!','TEST_health7','http://ceprj.gachon.ac.kr:60017/uploads/1730907904997_diagnosis_image.jpg','피부 관리 1일차ㅠㅠ 피부가 너무 붉다 왜그러지..','2024-11-07 00:45:12'),
(8,13,'태선화/과다색소침착','피부병이 오래 지속되면서 생기는 현상으로, 표피와 진피의 일부가 가죽처럼 변해 딱딱해지며 윤기가 없어지고 주름져 보임. 피부병이 있던 자리를 지속적인 문지름, 긁는 등의 행동이 원인','지속적인 치료와 약용샴푸로 목욕을 병행하기 위해 최대한 빨리 내원','http://ceprj.gachon.ac.kr:60017/uploads/1730950127891_diagnosis_image.jpg','~~','2024-11-07 12:29:13'),
(9,13,'태선화/과다색소침착','피부병이 오래 지속되면서 생기는 현상으로, 표피와 진피의 일부가 가죽처럼 변해 딱딱해지며 윤기가 없어지고 주름져 보임. 피부병이 있던 자리를 지속적인 문지름, 긁는 등의 행동이 원인','지속적인 치료와 약용샴푸로 목욕을 병행하기 위해 최대한 빨리 내원','http://ceprj.gachon.ac.kr:60017/uploads/1730952402216_diagnosis_image.jpg','1일차 관리!! 귀가 붉어보임ㅠㅠ','2024-11-07 13:07:44'),
(10,13,'비듬/각질/상피성잔고리','지루증이라고도 하며, 건성 지루증은 건조한 각질이 피부에 다발하는 것으로 단모종이 주로 걸림. 유성 지루증은 피부에 염증이 생기는 피부염. 마굿간 냄새를 풍김(지루증은 주로 유성 지루증임)','습도를 30~40%로 유지. 비타민 A가 풍부한 당근을 껍질과 씨앗을 제거하여, 삶거나 으깨서 적정량 급여(반려견의 체중과 연령에 따라 다르기 때문에, 적정량만 제공)','http://ceprj.gachon.ac.kr:60017/uploads/1731907774349_diagnosis_image.jpg','ㅠㅠ','2024-11-18 14:29:45'),
(11,13,'비듬/각질/상피성잔고리','지루증이라고도 하며, 건성 지루증은 건조한 각질이 피부에 다발하는 것으로 단모종이 주로 걸림. 유성 지루증은 피부에 염증이 생기는 피부염. 마굿간 냄새를 풍김(지루증은 주로 유성 지루증임)','습도를 30~40%로 유지. 비타민 A가 풍부한 당근을 껍질과 씨앗을 제거하여, 삶거나 으깨서 적정량 급여(반려견의 체중과 연령에 따라 다르기 때문에, 적정량만 제공)','http://ceprj.gachon.ac.kr:60017/uploads/1732095850099_diagnosis_image.jpg','강아지 귀가 붉게 변했다ㅠㅠ','2024-11-20 18:44:20'),
(12,13,'비듬/각질/상피성잔고리','지루증이라고도 하며, 건성 지루증은 건조한 각질이 피부에 다발하는 것으로 단모종이 주로 걸림. 유성 지루증은 피부에 염증이 생기는 피부염. 마굿간 냄새를 풍김(지루증은 주로 유성 지루증임)','습도를 30~40%로 유지. 비타민 A가 풍부한 당근을 껍질과 씨앗을 제거하여, 삶거나 으깨서 적정량 급여(반려견의 체중과 연령에 따라 다르기 때문에, 적정량만 제공)','http://ceprj.gachon.ac.kr:60017/uploads/1732096176935_diagnosis_image.jpg','우리집 강아지 귀가 붉게 변했다ㅠㅠ','2024-11-20 18:49:47'),
(13,13,'비듬/각질/상피성잔고리','지루증이라고도 하며, 건성 지루증은 건조한 각질이 피부에 다발하는 것으로 단모종이 주로 걸림. 유성 지루증은 피부에 염증이 생기는 피부염. 마굿간 냄새를 풍김(지루증은 주로 유성 지루증임)','습도를 30~40%로 유지. 비타민 A가 풍부한 당근을 껍질과 씨앗을 제거하여, 삶거나 으깨서 적정량 급여(반려견의 체중과 연령에 따라 다르기 때문에, 적정량만 제공)','http://ceprj.gachon.ac.kr:60017/uploads/1732096408465_diagnosis_image.jpg','우리집 강아지 피부가 붉게 변했다ㅠㅠ','2024-11-20 18:53:41'),
(14,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1732113409732_diagnosis_image.jpg','피부가 붉어보인다ㅠㅠ 왜그러지??','2024-11-20 23:36:57'),
(15,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733306249300_diagnosis_image.jpg','ㅠㅠ','2024-12-04 18:57:57'),
(16,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733306473873_diagnosis_image.jpg','12/4 기록!!','2024-12-04 19:01:22'),
(17,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733309326872_diagnosis_image.jpg','이번달 첫 진단!','2024-12-04 19:48:55'),
(18,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733309937851_diagnosis_image.jpg','!!','2024-12-04 19:59:04'),
(19,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310152872_diagnosis_image.jpg','…','2024-12-04 20:02:38'),
(20,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310177694_diagnosis_image.jpg','~~','2024-12-04 20:03:05'),
(21,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310282825_diagnosis_image.jpg','~~','2024-12-04 20:04:48'),
(22,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310329418_diagnosis_image.jpg','…','2024-12-04 20:05:35'),
(23,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310422303_diagnosis_image.jpg','우리 강아지 열심히 치료해보자..','2024-12-04 20:07:08'),
(24,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310448165_diagnosis_image.jpg','ㅜㅜ','2024-12-04 20:07:36'),
(25,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310467153_diagnosis_image.jpg','ㅜㅜㅜ','2024-12-04 20:07:52'),
(26,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310661931_diagnosis_image.jpg','ㅡㅡ','2024-12-04 20:11:07'),
(27,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310682354_diagnosis_image.jpg','ㅡㅡ','2024-12-04 20:11:27'),
(28,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310844228_diagnosis_image.jpg','첫번째 진단입니당','2024-12-04 20:14:11'),
(29,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733310872245_diagnosis_image.jpg','두번째 진단입니당','2024-12-04 20:14:37'),
(30,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733311344796_diagnosis_image.jpg','세번째 진단입니당','2024-12-04 20:22:30'),
(31,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733311368692_diagnosis_image.jpg','네번째 진단입니당','2024-12-04 20:22:57'),
(32,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733311417590_diagnosis_image.jpg','다섯번째 진단입니당','2024-12-04 20:23:43'),
(33,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733311769983_diagnosis_image.jpg','여섯번째 진단입니당','2024-12-04 20:29:37'),
(34,13,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','http://ceprj.gachon.ac.kr:60017/uploads/1733311790727_diagnosis_image.jpg','읽곱번째 진단입니당','2024-12-04 20:29:56');
/*!40000 ALTER TABLE `DIAGNOSIS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DISEASE`
--

DROP TABLE IF EXISTS `DISEASE`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DISEASE` (
  `diseaseId` int(11) NOT NULL,
  `diseaseName` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `health` text DEFAULT NULL,
  `diseaseClass` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`diseaseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DISEASE`
--

LOCK TABLES `DISEASE` WRITE;
/*!40000 ALTER TABLE `DISEASE` DISABLE KEYS */;
INSERT INTO `DISEASE` VALUES
(1,'구진/플라크','염증 물질이 침습되고 표피가 과증식 되면서 볼록해지는 형태를 띔. 감염성: 세균 감염에 의한 것, 비감염성: 아토피, 음식 알레르기, 접촉성 알레르기','점점 커지는 일이 많고, 발생 위치에 따라 반려견 생활에 불편을 주기도 함. 세균 감염일 수 있으니 내원하여 진단','A1'),
(2,'비듬/각질/상피성잔고리','지루증이라고도 하며, 건성 지루증은 건조한 각질이 피부에 다발하는 것으로 단모종이 주로 걸림. 유성 지루증은 피부에 염증이 생기는 피부염. 마굿간 냄새를 풍김(지루증은 주로 유성 지루증임)','습도를 30~40%로 유지. 비타민 A가 풍부한 당근을 껍질과 씨앗을 제거하여, 삶거나 으깨서 적정량 급여(반려견의 체중과 연령에 따라 다르기 때문에, 적정량만 제공)','A2'),
(3,'태선화/과다색소침착','피부병이 오래 지속되면서 생기는 현상으로, 표피와 진피의 일부가 가죽처럼 변해 딱딱해지며 윤기가 없어지고 주름져 보임. 피부병이 있던 자리를 지속적인 문지름, 긁는 등의 행동이 원인','지속적인 치료와 약용샴푸로 목욕을 병행하기 위해 최대한 빨리 내원','A3'),
(4,'농포/여드름','포도상구균이 가장 큰 원인. 피부에 작은 돌기와 고름이 찬 물집 형성','저알러지성 식이, 고급 균형 사료(고단백질은 피함). 농피증이 발생한 부위에 대한 압박을 줄이기 위해 패드가 들어간 침구 사용. 증상이 오래 진행되면 항생제 투여를 위해 내원','A4'),
(5,'미란/궤양','일광, 산, 알칼리, 살충제, 세정제등의 자극에 의해 나타난 단순 피부염일 수도 있지만, 세균, 바이러스, 진균 등에 의한 감염일 수 있음','자극을 일으킬 수 있는 일광, 산, 알칼리, 살충제, 세정제 등이 있었는지 확인해보고, 없었다면 내원하는 걸 추천','A5'),
(6,'결절/종괴','피부 염증이나 외상에 의한 것일 수 있지만, 악성/양성 종양일 수 있기 때문에 최대한 빠르게 동물병원에 내원하여 진단을 받는 것이 좋음','발견 즉시부터 내원할 때까지 1~2일마다 촬영해두는 것이 좋음. 병원에 내원했을 때 수의사가 건강 상태와 경과를 파악하는데 도움이 됨','A6'),
(7,'무증상','피부에 우려할 만한 증상은 보이지 않아요. 앞으로도 꾸준히 신경 써주세요!','무증상','A7');
/*!40000 ALTER TABLE `DISEASE` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `USER`
--

DROP TABLE IF EXISTS `USER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `USER` (
  `userId` int(11) NOT NULL AUTO_INCREMENT,
  `userEmail` varchar(50) NOT NULL,
  `userPw` varchar(50) NOT NULL,
  `userName` varchar(10) NOT NULL,
  `dogName` varchar(10) NOT NULL,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `USER`
--

LOCK TABLES `USER` WRITE;
/*!40000 ALTER TABLE `USER` DISABLE KEYS */;
INSERT INTO `USER` VALUES
(1,'cyhh07199@naver.com','19990719','최옹환','루피루피'),
(2,'TEST_userEmail2','Test_userPw2','김현우2','초코'),
(12,'yonghwan0000@daum.net','990719','최옹환','loopy'),
(13,'heeyeon@gmail.com','20020228','정희연','쿠키'),
(14,'cyhh07199@gmail.com','cyh07199','최옹환','loopy'),
(15,'cyhh07199@gmail.cm','cyh07199','최옹환','loopy'),
(17,'joy@naver.cpm','2002','희연','송이'),
(18,'heeyeon@naver.com','2002','희연','초코'),
(19,'wjdgmldus28@gmail.com','20020228','희연','쿠키');
/*!40000 ALTER TABLE `USER` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `VERIFICATION_TOKENS`
--

DROP TABLE IF EXISTS `VERIFICATION_TOKENS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `VERIFICATION_TOKENS` (
  `token` varchar(255) NOT NULL,
  `userEmail` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VERIFICATION_TOKENS`
--

LOCK TABLES `VERIFICATION_TOKENS` WRITE;
/*!40000 ALTER TABLE `VERIFICATION_TOKENS` DISABLE KEYS */;
INSERT INTO `VERIFICATION_TOKENS` VALUES
('0da10d3c-7220-4d87-8b71-9bab9b806b44','F','2024-11-20 14:22:59'),
('2cce0587-3ade-4526-817a-70d2c226bc70','wjdgmldus28@gachon@ac.kr','2024-11-20 09:41:56'),
('4069391b-c3f3-48c5-aa37-a631286df7ef','wjdgmldus28@naver.com','2024-11-20 15:32:12'),
('5b5c81f7-aa5d-4ac0-bb56-c1b3ad558302','wjdgmldus28@naver.com','2024-11-20 14:38:45'),
('6ea2f5fe-df28-4c1a-8a20-c9d760bfc09c','wjdgmldus28@nver.com','2024-11-20 15:29:50'),
('7b35c17c-3f83-4f16-ba77-0b21686cdd8b','wjdmgldus28@naver.com','2024-11-20 09:41:16'),
('7bf9c377-0437-44bf-97e2-70dcfb6e2713','huiyeonjeong4@gmail.com','2024-11-20 15:14:49'),
('c5661a5e-d974-472b-a6b3-19c9cd8077b2','wjdgmldus28@naver.comm','2024-11-20 15:21:40'),
('c7d2ae31-53ce-498e-aa80-e92ac958a5d9','huiyeonjeong4@gmail.com','2024-11-20 15:17:37'),
('da2f0c38-9314-47e4-9b9b-0783e7a1d2f2','wjdgmldus28@naver.com','2024-11-20 15:13:59'),
('e5d36864-2945-449a-8625-cc4b9d53b071','huiyeonjeong4@gmail.com','2024-11-20 15:19:37'),
('f08469a9-a5d8-47e9-b187-5cbf45cfea26','Dsd','2024-11-20 09:42:09');
/*!40000 ALTER TABLE `VERIFICATION_TOKENS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `VERIFIED_EMAILS`
--

DROP TABLE IF EXISTS `VERIFIED_EMAILS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `VERIFIED_EMAILS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userEmail` varchar(255) NOT NULL,
  `verifiedAt` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `userEmail` (`userEmail`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VERIFIED_EMAILS`
--

LOCK TABLES `VERIFIED_EMAILS` WRITE;
/*!40000 ALTER TABLE `VERIFIED_EMAILS` DISABLE KEYS */;
INSERT INTO `VERIFIED_EMAILS` VALUES
(6,'kkimh0425@gmail.com','2024-11-16 08:00:49'),
(27,'jymm3672@naver.com','2024-11-16 10:09:28');
/*!40000 ALTER TABLE `VERIFIED_EMAILS` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-13 14:07:43
