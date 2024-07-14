const notifications=require('../controler/notification-controler')
const express = require('express');
const router = express.Router();


router.post('/save',notifications.addNotfication);
router.post('/getallnotification',notifications.getAllNotification);
router.post('/updatestatus',notifications.updateStatus);
router.post('/active',notifications.getAllActiveNotification);




module.exports = router;