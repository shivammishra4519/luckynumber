const wallet=require('../controler/wallet-controler')
const express = require('express');
const router = express.Router();


router.post('/verifiy',wallet.verifiyNumber);
router.post('/register',wallet.registerRemitter);
router.post('/verifiyOtp',wallet.verifyOtp);
router.post('/getAllBank',wallet.getAllBank);
router.post('/addaccount',wallet.addAccount);
router.post('/getaccount',wallet.getAccounts);
router.post('/withdram',wallet.fundWithdraw);
router.post('/histroy',wallet.allFundTransferHistory);
router.post('/statuscheck',wallet.statusCheck);
router.get('/callback', wallet.callBackApi);






module.exports = router;