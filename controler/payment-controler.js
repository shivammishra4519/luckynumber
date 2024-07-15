const { getDB } = require('../dbconnection');
const axios = require('axios')
const jwt = require('jsonwebtoken');

require('dotenv').config();
const secretKey = process.env.secretkey;
const frontendUrl = process.env.frontendUrl;



const addMoney = async (req, res) => {
    try {

        const authHeader = req.headers['authorization'];


        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        jwt.verify(token, secretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }
            const data = req.body;
            const db = getDB();
            const number = decodedToken.number;
            const collection = db.collection('users');
            const result = await collection.findOne({ number: number });

            if (!result) {
                return res.status(400).json({ message: 'User not Found' });
            }

            const axios = require('axios');
            const ordId = 'ORD' + Date.now();
            const dataToSend = {
                order_id: ordId,
            };

            const tokenCollection = db.collection('paymentGatwayToken');
            const tokens = await tokenCollection.find().toArray();
            if (tokens.length === 0) {
                return res.status(400).json({ message: 'Somtheing Went Wrong ' })
            }

            // Get a random index
            const randomIndex = Math.floor(Math.random() * tokens.length);

            // Get the token at the random index
            const randomToken = tokens[randomIndex];

            const encodedData = Buffer.from(JSON.stringify(dataToSend)).toString('base64');

            const url = 'https://mobilefinder.store/api/create-order';
            const data1 = {
                customer_mobile: result.number,
                user_token: randomToken.token,
                amount: data.amount,
                order_id: ordId,
                redirect_url: `${frontendUrl}payment-success?data=${encodedData}`,
                remark1: result.name,
                remark2: '',
            };

            const response = await axios.post(url, data1);


            const responseString = response.data;

            const onlinePaymentCollection = db.collection('onlinePayments');
            data1.customerNumber = result.customerNumber;
            data1.customerName = result.customerName
            // Extract JSON part from the response string
            const parts = responseString.split(')'); // Assuming the response ends with a closing parenthesis ')'
            const jsonString = parts[parts.length - 1].trim(); // Get the last part and trim whitespace

            try {
                const jsonResponse = JSON.parse(jsonString);
                const paymentUrl = jsonResponse.result.payment_url;
                const insertDetails = await onlinePaymentCollection.findOne({ order_id: data1.order_id });
                if (insertDetails) {
                    return res.status(400).json({ message: 'Order Id already exit' })
                }
                data1.date = new Date()
                await onlinePaymentCollection.insertOne(data1);
                res.status(200).json({ status: true, paymentUrl });
            } catch (error) {

                res.status(500).json({ status: false, message: 'Failed to parse JSON response' });
            }

        });
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('users');
        const walletCollection = db.collection('wallets');
        const onlinePaymentCollection = db.collection('onlinePayments');
        const data = req.body;
        const order_id = data.order_id;
        const result = await onlinePaymentCollection.findOne({ order_id });
        const user_token = result.user_token;
        if (!result) {
            return res.status(400).json({ message: 'No Payment Request' });
        }

        const response = await checkOrderStatus(order_id, user_token);
        if (response.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Payment not received' });
        }

        const number = result.customer_mobile;
        const wallet = await walletCollection.findOne({ userId: number });
        if (!wallet) {
            return res.status(200).json({ message: 'Wallet does not exist' });
        }

        const newBalance = wallet.amount + parseInt(result.amount, 10);

        const updatedWallet = await walletCollection.findOneAndUpdate(
            { userId: number },
            { $set: { amount: newBalance } },
            { returnOriginal: false }
        );

        const admin = await collection.findOne({ role: 'admin' });
        if (!admin) {
            await walletCollection.findOneAndUpdate(
                { userId: number },
                { $set: { amount: wallet.amount } },
                { returnOriginal: false }
            );
            return res.status(400).json({ message: 'Something went wrong, contact Admin' });
        }

        const adminWallet = await walletCollection.findOne({ userId: admin.number });
        if (!adminWallet) {
            await walletCollection.findOneAndUpdate(
                { userId: number },
                { $set: { amount: wallet.amount } },
                { returnOriginal: false }
            );
            return res.status(400).json({ message: 'Contact Admin' });
        }

        const newAdminBalance = adminWallet.amount - parseInt(result.amount, 10);
        await walletCollection.findOneAndUpdate(
            { userId: admin.number },
            { $set: { amount: newAdminBalance } },
            { returnOriginal: false }
        );

        const transHistory = {
            senderOpening: adminWallet.amount,
            senderClosing: newAdminBalance,
            senderId: admin.number,
            receiverOpening: wallet.amount,
            receiverClosing: newBalance,
            receiverId: number,
            date: new Date(), // Assuming 'date' should be the current date
            transactionId: generateTransactionId(15),
            amount: result.amount,
            type:'upi'
        };

        const traHisCollection = db.collection('transectionHistory');
        await traHisCollection.insertOne(transHistory);

        await onlinePaymentCollection.deleteOne({ order_id });

        res.status(200).json({ message: 'Amount added Successfully' });
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    }
};


// const axios = require('axios');

async function checkOrderStatus(order_id, user_token) {
    const url = 'https://mobilefinder.store/api/check-order-status';
    const data1 = {
        "user_token": user_token,
        "order_id": order_id
    };

    try {
        const response = await axios.post(url, data1);
        const responseString = response.data;
        return responseString
    } catch (error) {
        console.error('Error occurred while making the request:', error);
    }
}

const addToken = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];


        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        jwt.verify(token, secretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }
            const data = req.body;
            const db = getDB();
            const collection = db.collection('paymentGatwayToken');
            const result = await collection.findOne({ token: data.token });
            if (result) {
                return res.status(400).json({ message: 'Token Alreday Added' });
            }
            const date = new Date();
            data.date = date;
            const insert = await collection.insertOne(data);
            if (insert) {
                res.status(200).json({ message: 'Token addedd successfully' });
            } else {
                res.status(400).json({ message: 'Somtheing Went Wrong' })
            }

        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getAllToken = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];


        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        jwt.verify(token, secretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }
            const data = req.body;
            const db = getDB();
            const collection = db.collection('paymentGatwayToken');
            const result = await collection.find().toArray();
            res.status(200).json(result);

        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const deleteToken = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];


        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        jwt.verify(token, secretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }
            const data = req.body;
            const db = getDB();
            const collection = db.collection('paymentGatwayToken');
            const result = await collection.deleteOne({ token: data.token })
            res.status(200).json(result);

        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}


function generateTransactionId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    // Generate the remaining part of the ID
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }

    return result;
}



const onlineRequest = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];


        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        jwt.verify(token, secretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }

            const db = getDB()
            const collection = db.collection('onlinePayments');
            const result = await collection.find().toArray();
            res.status(200).json(result);

        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const checkPaymentStatus = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        jwt.verify(token, secretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }
            const data = req.body;
            console.log(data)
            const db=getDB();
            const collection=db.collection('onlinePayments');
            const result=await collection.findOne({order_id:data.order_id})
            if(!result){
                return res.status(400).json({message:'invalid orderid'})
            }
            const response = await checkOrderStatus(data.order_id,result.user_token);
            if (response.status == 'COMPLETED') {
                return res.status(200).json(response);
            }
            res.status(400).json({ message: 'Payemnt not recevied' })
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'internal server error' })
    }
}


async function checkOrderStatus(order_id,user_token) {
    console.log("data in body",order_id,user_token)
    const url = 'https://mobilefinder.store/api/check-order-status';
    const data1 = {
        "user_token": user_token,
        "order_id": order_id
    };

    try {
        const response = await axios.post(url, data1);
        const responseString = response.data;
        console.log(response)
        return responseString
    } catch (error) {
        console.error('Error occurred while making the request:', error);
    }
}

module.exports = { addMoney, verifyPayment, addToken, getAllToken, deleteToken ,onlineRequest,checkPaymentStatus};