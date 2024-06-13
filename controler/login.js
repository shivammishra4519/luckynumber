const { getDB } = require('../dbconnection');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const secretKey = process.env.secretkey;
const registraion = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('users');
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: 'invalid request data not found in payload' })
        }
        const password = data.password;
        const query = {
            "$or": [
                { "number": data.number },
                { "email": data.email },
            ]
        }

        const isUserExit = await collection.findOne(query);
        if (isUserExit) {
            return res.status(400).json({ message: 'user already exit' });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        delete data.confirmPassword;
        const pin = data.pin;
        const hashedpin = await bcryptjs.hash(pin, 10);
        data.password = hashedPassword;
        data.pin = hashedpin;
        data.role = 'admin'
        const insert = await collection.insertOne(data);
        if (!insert) {
            return res.status(400).json({ message: 'somthieng went wrong' });
        }
        const wallets = db.collection('wallets');
        const isWalletExit = await wallets.findOne({ userId: data.number });
        if (!isWalletExit) {
            const obj = {
                userId: data.number,
                name: data.name,
                pin: hashedpin,
                amount: 0
            }
            const walletInsert = await wallets.insertOne(obj);
            if (!walletInsert) {
                await collection.deleteOne({ number: data.number });
                return res.status(400).json({ message: 'Please tra again' })
            }
        }

        res.status(200).json({ message: 'User Registred successfully' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// const isValidPassword = await bcryptjs.compare(plainPassword, hashedPassword);


const login = async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: 'userid or password missing' });
        }

        const db = getDB();
        const collection = db.collection('users');
        const checkUser = await collection.findOne({ number: data.number });
        if (!checkUser) {
            return res.status(400).json({ message: 'invalid user id' });
        }
        const password = data.password;
        const dbPassword = checkUser.password;
        const isValidPassword = await bcryptjs.compare(password, dbPassword);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'incorrect password' });
        }
        const payload = {
            name: checkUser.name,
            number: checkUser.number,
            role: checkUser.role
        };
        const token = jwt.sign(payload, secretKey, { expiresIn: '12h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error:', error); // Change `err` to `error`
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = { registraion, login };