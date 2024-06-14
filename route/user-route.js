const userControler=require('../controler/user-controler')
const express = require('express');
const router = express.Router();


router.post('/distributor/register',userControler.distributorRegistration);
router.post('/user/register',userControler.userRegistration);
router.post('/get/distributor',userControler.getAllDistributor);
router.post('/get/user',userControler.getUsers);
router.post('/get/wallet',userControler.getWalletBalance);
router.post('/get/users/role',userControler.getUserByRole);
router.post('/set/commession',userControler.setCommession);
router.post('/view/commession',userControler.getAllCommession);

 


module.exports = router;