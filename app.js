const express = require('express');
const {connectToDB}=require('./dbconnection')
require('dotenv').config();
const cors=require('cors');
const bodyParser = require('body-parser');
const loginRoute=require('./route/login-route');
const userRoute=require('./route/user-route');
const lotteryRoute=require('./route/lottery-route');
const payment=require('./route/payment-route');
const transection=require('./route/transection-route');
const wallet=require('./route/wallet-route');
const notification=require('./route/notification-route');

connectToDB().then(()=>{
    // const timeSedule=require('./automode/timesedule');
});
const port = process.env.PORT || 3600;
const app = express();

app.use(cors());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api',loginRoute);
app.use('/user',userRoute);
app.use('/lottery',lotteryRoute);
app.use('/api',payment);
app.use('/api',transection);
app.use('/wallet',wallet);
app.use('/notification',notification);



app.get('/', (req, res) => {
    res.send('Welcome home api');
});

app.listen(port, () => {
    console.log('Server is running on port ', port);
});
