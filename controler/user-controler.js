const { getDB } = require('../dbconnection');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.secretkey;



const distributorRegistration = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('users');
        const data = req.body;

        if (!data || !data.number || !data.password || !data.name || !data.pin) {
            return res.status(400).json({ message: 'Missing required fields in payload' });
        }

        const isUserExist = await collection.findOne({ number: data.number });
        if (isUserExist) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcryptjs.hash(data.password, 10);
        const hashedPin = await bcryptjs.hash(data.pin, 10);

        delete data.confirmPassword;
        data.password = hashedPassword;
        data.pin = hashedPin;
        data.role = 'distributor';

        const insertResult = await collection.insertOne(data);
        if (!insertResult.acknowledged) {
            return res.status(400).json({ message: 'Something went wrong' });
        }

        const wallets = db.collection('wallets');
        const isWalletExist = await wallets.findOne({ userId: data.number });
        if (!isWalletExist) {
            const walletObj = {
                userId: data.number,
                name: data.name,
                pin: hashedPin,
                amount: 0
            };
            const walletInsertResult = await wallets.insertOne(walletObj);
            if (!walletInsertResult.acknowledged) {
                await collection.deleteOne({ number: data.number });
                return res.status(400).json({ message: 'Please try again' });
            }
        }

        res.status(200).json({ message: 'Distributor registered successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};





const userRegistration = async (req, res) => {
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
            const db = getDB();
            const collection = db.collection('users');
            const data = req.body;

            if (!data || !data.number || !data.password || !data.name || !data.pin) {
                return res.status(400).json({ message: 'Missing required fields in payload' });
            }

            const isUserExist = await collection.findOne({ number: data.number });
            if (isUserExist) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const hashedPassword = await bcryptjs.hash(data.password, 10);
            const hashedPin = await bcryptjs.hash(data.pin, 10);

            delete data.confirmPassword;
            data.password = hashedPassword;
            data.pin = hashedPin;
            data.role = 'user';
            data.referal = decodedToken.number;
            data.referalName = decodedToken.name;

            const insertResult = await collection.insertOne(data);
            if (!insertResult.acknowledged) {
                return res.status(400).json({ message: 'Something went wrong' });
            }

            const wallets = db.collection('wallets');
            const isWalletExist = await wallets.findOne({ userId: data.number });
            if (!isWalletExist) {
                const walletObj = {
                    userId: data.number,
                    name: data.name,
                    pin: hashedPin,
                    amount: 0
                };
                const walletInsertResult = await wallets.insertOne(walletObj);
                if (!walletInsertResult.acknowledged) {
                    await collection.deleteOne({ number: data.number });
                    return res.status(400).json({ message: 'Please try again' });
                }
            }

            res.status(200).json({ message: 'Distributor registered successfully' });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



const getAllDistributor = async (req, res) => {
    try {
        const db = getDB();
        const distributors = await db.collection('users').find({ role: 'distributor' }).toArray();

        res.status(200).json(distributors);
    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

const getUsers = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('users');
        const result = await collection.find({ role: 'user' }).toArray();
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getWalletBalance = async (req, res) => {
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

            const number = decodedToken.number;
            const db = getDB();
            const collection = db.collection('wallets');
            const userWallet = await collection.findOne({ userId: number });
            if (!userWallet) {
                return res.status(400).json({ message: 'user wallet not exit' })
            }
            const amount=userWallet.amount;
        
            res.status(200).json({amount});
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getUserByRole=async(req,res)=>{
    try {
        
    } catch (error) {
        
    }
}


module.exports = { distributorRegistration, userRegistration, getAllDistributor, getUsers ,getWalletBalance}