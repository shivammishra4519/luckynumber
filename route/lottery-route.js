const express=require('express');
const lottery=require('../controler/lotery-controler');
const router=express.Router();


router.post('/add',lottery.addLottery)
router.post('/get',lottery.getAllLottery)
router.post('/save/widinfo',lottery.saveWidInfo)
router.post('/find/widinfo',lottery.findWidsForUser)
router.post('/find/lottery/status',lottery.lotteryStatus)
router.post('/find/wids',lottery.findAllwids)
router.post('/find/wids/number',lottery.findWidsOnNumber);
router.post('/find/wids/user',lottery.findWidsForUser1);
router.post('/find/lottery',lottery.findLottery);
router.post('/announce/winner',lottery.announceWinner);
router.post('/list/winner',lottery.winnerList);
module.exports=router