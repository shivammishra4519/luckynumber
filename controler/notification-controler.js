const { getDB } = require('../dbconnection');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const secretKey = process.env.secretkey;

const addNotfication = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        // Verify JWT token
        jwt.verify(token, secretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }
            const data = req.body;
            if (!data.message) {
                return res.status(200).json({ message: 'Message can not be Null' })
            }
            const db = getDB();
            const collection = db.collection('notifications');
            data.date = new Date();
            data.status = false;
            let type = data.type.trim().toUpperCase();
            data.type = type;
            const result = await collection.findOne({ type: type });
            if (result) {
                return res.status(400).json({ message: 'For type this ALready Exit!' });
            }
            const insert = await collection.insertOne(data);
            if (!insert) {
                return res.status(400).json({ message: 'Somtheing Went Wrong Please Try Again' });
            }
            res.status(200).json({ message: "message Saved Successfully" })
        });

    } catch (error) {
        console.error('Error updating lottery status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const getAllNotification = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        // Verify JWT token
        jwt.verify(token, secretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }

            const db = getDB();
            const collection = db.collection('notifications');
            const result = await collection.find().toArray();

            res.status(200).json(result);

        });
    } catch (error) {
        console.error('Error updating lottery status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const updateStatus = async (req, res) => {
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
            const collection = db.collection('notifications');
            const data = req.body;

            // Check if _id is present in request body
            if (!data._id) {
                return res.status(400).json({ message: 'Document ID is required' });
            }

            // Check if status is present in request body
            if (typeof data.status === 'undefined') {
                return res.status(400).json({ message: 'Status is required' });
            }

            // Update status for the given _id
            const filter = { _id: new ObjectId(data._id) };
            const updateDoc = {
                $set: {
                    status: data.status
                }
            };

            const result = await collection.updateOne(filter, updateDoc);

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: 'Document ID not found' });
            }

            return res.status(200).json({ message: 'Document status updated successfully' });
        });

    } catch (error) {
        console.error('Error updating document status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const getAllActiveNotification = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }

        // Verify JWT token
        jwt.verify(token, secretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }

            const db = getDB();
            const collection = db.collection('notifications');
            const result = await collection.find({status:true}).toArray();

            res.status(200).json(result);

        });
    } catch (error) {
        console.error('Error updating lottery status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}



module.exports = { addNotfication ,getAllNotification,updateStatus,getAllActiveNotification}