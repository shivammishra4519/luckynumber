const { getDB } = require('../dbconnection');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const secretKey = process.env.secretkey;


const transectionHistory = async (req, res) => {
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

            const role = decodedToken.role;
            const userId = decodedToken.number; // Assuming `number` is the user's ID in the token
            const db = getDB();
            const collection = db.collection('transectionHistory');

            let result;
            if (role === 'admin') {
                result = await collection.find().toArray();
            } else {
                result = await collection.find({
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ]
                }).toArray();
            }

            return res.status(200).json(result);
        });
    } catch (error) {
        console.error('Internal server error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports={transectionHistory}