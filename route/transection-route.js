const transection=require('../controler/transection-controler')
const express = require('express');
const router = express.Router();


router.post('/transectio/history',transection.transectionHistory);




module.exports = router;