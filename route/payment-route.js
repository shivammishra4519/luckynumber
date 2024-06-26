const paymentControler=require('../controler/payment-controler')
const express = require('express');
const router = express.Router();


router.post('/payment',paymentControler.addMoney);
router.post('/verfiy',paymentControler.verifyPayment);
router.post('/token/add',paymentControler.addToken);
router.post('/token/get',paymentControler.getAllToken);
router.post('/token/delete',paymentControler.deleteToken);
router.post('/request/payment',paymentControler.onlineRequest);
router.post('/status/payment',paymentControler.checkPaymentStatus);




module.exports = router;