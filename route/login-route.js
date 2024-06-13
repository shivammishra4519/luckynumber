const loginControler=require('../controler/login')
const express = require('express');
const router = express.Router();


router.post('/login',loginControler.login);
router.post('/register',loginControler.registraion);



module.exports = router;