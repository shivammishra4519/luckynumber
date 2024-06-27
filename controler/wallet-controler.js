const axios = require('axios');
const { getDB } = require('../dbconnection');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const secretKey = process.env.secretkey;


const addAccount = async (req, res) => {
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

            const userId = process.env.USERID;
            const tokenid = process.env.TOKENID;
            const urlEndPoint = process.env.URL;
            const url = `${urlEndPoint}DMT/Beneficiary_Registration`;
            const number = decodedToken.number;
            const name = decodedToken.name;
            const db = getDB();
            const collection = db.collection('Beneficiary');
            const collection1 = db.collection('bankAccounts');
            const data = req.body;
            const obj = {
                Userid: userId,
                Tokenid: tokenid,
                Senderno: number,
                benname: data.accountHolderName,
                ifsccode: data.ifscCode,
                accountno: data.accountNumber,
                originalifsccode: data.originalifsccode
            };
            const result = await collection1.findOne({})
            try {
                const response = await axios.post(url, obj);
                const result = response.data;


                if (result.status === 'Success' && result.response.statuscode === 'TXN') {
                    const remitter = result.response.data;
                    remitter.Senderno = number;
                    // Insert into the database
                    await collection.insertOne(remitter);
                    data.number = number;
                    await collection1.insertOne(data)
                    return res.status(200).json({ message: 'Remitter registered successfully', data: remitter });
                } else {
                    return res.status(400).json({ error: result.response.status });
                }
            } catch (error) {
                console.error('Error making API request:', error);
                return res.status(500).json({ error: 'Internal server error: Failed to register remitter' });
            }
        })
    } catch (error) {
        console.error('Error updating lottery status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const verifiyNumber = async (req, res) => {
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
            const collection = db.collection('bankDetails');
            const result = await collection.findOne({ Senderno: number });
            console.log(result)
            if (result.status) {
                return res.status(200).json(null)
            }
            return res.status(200).json(result);

        })
    } catch (error) {
        console.error('Error updating lottery status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const registerRemitter = async (req, res) => {
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

            const userId = process.env.USERID;
            const tokenid = process.env.TOKENID;
            const urlEndPoint = process.env.URL;
            const url = `${urlEndPoint}DMT/Remitter_Registration`;
            const number = decodedToken.number;
            // const number = 9198113388;
            const name = decodedToken.name;
            const db = getDB();
            const collection = db.collection('bankDetails');

            const obj = {
                Userid: userId,
                Tokenid: tokenid,
                Senderno: number,
                SenderName: name
            };

            try {
                const response = await axios.post(url, obj);
                const result = response.data;
                console.log(result);

                if (result.status === 'Success' && result.response.statuscode === 'TXN') {
                    const remitter = result.response.data.remitter;
                    remitter.Senderno = number;

                    // Insert into the database
                    await collection.insertOne(remitter);
                    return res.status(200).json({ message: 'Remitter registered successfully', data: remitter });
                } else {
                    return res.status(400).json({ error: result.response.status });
                }
            } catch (error) {
                console.error('Error making API request:', error);
                return res.status(500).json({ error: 'Internal server error: Failed to register remitter' });
            }
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const verifyOtp = async (req, res) => {
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

            const userId = process.env.USERID;
            const tokenid = process.env.TOKENID;
            const urlEndPoint = process.env.URL;
            const url = `${urlEndPoint}DMT/Remitter_Otp_Verify`;
            const number = decodedToken.number;

            const name = decodedToken.name;
            const db = getDB();
            const collection = db.collection('bankDetails');
            const result = await collection.findOne({ Senderno: number })
            if (!result) {
                return res.status(400).json({ message: 'Please Try Again' })
            }
            const data = req.body;
            const obj = {
                Userid: userId,
                Tokenid: tokenid,
                Senderno: number,
                otp: data.otp,
                benid: result.id
            };

            try {
                const response = await axios.post(url, obj);
                const result = response.data;

                if (result.status === 'Success' && result.response.statuscode === 'TXN') {
                    const remitter = result.response.data.remitter;
                    remitter.Senderno = number;
                    await collection.deleteOne({ Senderno: number });
                    remitter.status = true;
                    collection.insertOne(re)
                    // Insert into the database
                    await collection.insertOne(remitter);
                    return res.status(200).json({ message: 'Remitter registered successfully', data: remitter });
                } else {
                    return res.status(400).json({ error: result.response.status });
                }
            } catch (error) {
                console.error('Error making API request:', error);
                return res.status(500).json({ error: 'Internal server error: Failed to register remitter' });
            }
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const getAllBank = async (req, res) => {
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

            const userId = process.env.USERID;
            const tokenid = process.env.TOKENID;
            const urlEndPoint = process.env.URL;

            const url = `${urlEndPoint}DMT/Bank_name`;
            
            const obj = {
                Userid: userId,
                Tokenid: tokenid,
            };

            try {
                const response = await axios.post(url, obj);
               
                const result = response.data;


                if (result.status === 'Success' && result.response.statuscode === 'TXN') {
                    const banks = result.response.data;
                    return res.status(200).json(banks);
                } else {
                    return res.status(400).json({ error: result.response.status });
                }
            } catch (error) {
                console.error('Error making API request:', error);
                return res.status(500).json({ error: 'Internal server error: Failed to fetch bank details' });
            }
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getAccounts = async (req, res) => {
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
            const collection = db.collection('bankAccounts');
            const result = await collection.find({ number: decodedToken.number }).toArray();
            res.status(200).json(result)
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


const fundWithdraw = async (req, res) => {
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
            const walletsCollection = db.collection('wallets');
            const fundRequestCollection = db.collection('fundrequests');
            const fundHistoryCollection = db.collection('fundhistory');
            const transactionHistoryCollection = db.collection('transectionHistory');

            const userId = decodedToken.number;
            const wallet = await walletsCollection.findOne({ userId });

            if (!wallet) {
                return res.status(400).json({ message: 'Contact to admin' });
            }

            const { amount, accountNumber } = req.body;

            if (wallet.amount < amount + 5) {
                return res.status(400).json({ message: 'Insufficient Balance' });
            }

            const account = await db.collection('bankAccounts').findOne({ accountNumber });

            if (!account) {
                return res.status(400).json({ message: 'No Bank Account Exists' });
            }

            const userIdEnv = process.env.USERID;
            const tokenid = process.env.TOKENID;
            const urlEndPoint = process.env.URL;
            const url = `${urlEndPoint}DMT/Fund_transfer`;

            const obj = {
                Userid: userIdEnv,
                Tokenid: tokenid,
                Senderno: userId,
                amount: amount,
                Mode: "IMPS",
                BankName: account.bankName,
                ifsccode: account.ifscCode,
                accountno: account.accountNumber,
                Transid: generateTransactionId(16)
            };

            await fundRequestCollection.insertOne(obj);

            try {
                const response = await axios.post(url, obj);

                const result = response.data;

                const fundHistoryEntry = {
                    ...obj,
                    apiOrderId: result.ApiOrderId,
                    rrn: result.rrn,
                    remainingBalance: result.Remainbal,
                    message: result.Message,
                    status: result.Status,
                    date: new Date()
                };

                await fundHistoryCollection.insertOne(fundHistoryEntry);

                const newBalance = wallet.amount - (parseInt(amount) + 5);
                await walletsCollection.updateOne(
                    { userId },
                    { $set: { amount: newBalance } }
                );

                const admin = await db.collection('users').findOne({ role: 'admin' });
                if (!admin) {
                    await walletsCollection.updateOne(
                        { userId },
                        { $set: { amount: wallet.amount } }
                    );
                    return res.status(400).json({ message: 'Something went wrong, contact Admin' });
                }

                const adminWallet = await walletsCollection.findOne({ userId: admin.number });
                if (!adminWallet) {
                    await walletsCollection.updateOne(
                        { userId },
                        { $set: { amount: wallet.amount } }
                    );
                    return res.status(400).json({ message: 'Contact Admin' });
                }

                const newAdminBalance = adminWallet.amount + parseInt(amount) + 5;
                await walletsCollection.updateOne(
                    { userId: admin.number },
                    { $set: { amount: newAdminBalance } }
                );

                const transactionHistory = {
                    senderOpening: adminWallet.amount,
                    senderClosing: newAdminBalance,
                    senderId: admin.number,
                    receiverOpening: wallet.amount,
                    receiverClosing: newBalance,
                    receiverId: userId,
                    date: new Date(),
                    transactionId: generateTransactionId(15),
                    amount: parseInt(amount) + 5,
                    type: 'withdraw'
                };

                await transactionHistoryCollection.insertOne(transactionHistory);

                if (result.Status === 'Success') {
                    return res.status(200).json({
                        orderId: result.orderId,
                        apiOrderId: result.ApiOrderId,
                        amount: result.Amount,
                        rrn: result.rrn,
                        message: result.Message,
                        remainingBalance: result.Remainbal
                    });
                } else if (result.Status === 'Pending') {
                    return res.status(202).json({
                        message: 'Transaction is pending, please check back later.',
                        orderId: result.orderId,
                        apiOrderId: result.ApiOrderId
                    });
                } else if (result.Status === 'Failed') {
                    return res.status(400).json({
                        error: 'Transaction failed',
                        message: result.Message,
                        orderId: result.orderId,
                        apiOrderId: result.ApiOrderId
                    });
                } else {
                    return res.status(400).json({ error: 'Unknown status' });
                }
            } catch (error) {
                console.error('Error making API request:', error);
                return res.status(500).json({ error: 'Internal server error: Failed to fetch bank details' });
            }
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



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


const allFundTransferHistory = async (req, res) => {
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
            const fundHistoryCollection = db.collection('fundhistory');

            const role = decodedToken.role;
            if (!role == 'admin') {
                const result = await fundHistoryCollection.find({ Senderno: decodedToken.number }).toArray();
                return res.status(200).json(result)
            }
            const result = await fundHistoryCollection.find().toArray();
            res.status(200).json(result)
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


const statusCheck = async (req, res) => {
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
            const collection = db.collection('fundhistory'); // Specify the collection name
            const walletsCollection = db.collection('wallets');
            const userId = process.env.USERID;
            const tokenid = process.env.TOKENID;
            const urlEndPoint = process.env.URL;
            const url = `${urlEndPoint}DMT/statuscheck`;

            const obj = {
                Userid: userId,
                Tokenid: tokenid,
                Transid: req.body.Transid // Ensure Transid is provided in the request body
            };

            const existingTransaction = await collection.findOne({ Transid: obj.Transid });
            if (!existingTransaction) {
                return res.status(400).json({ message: 'Invalid Transaction Id' });
            }

            try {
                const response = await axios.post(url, obj);
                const result = response.data;

                if (result.statuscode === 'TXN') {
                    if (result.data.Status === 'SUCCESS') {
                        await collection.updateOne(
                            { Transid: obj.Transid },
                            { $set: { status: 'Success', message: 'Transaction Successful' } }
                        );
                        return res.status(200).json({
                            status: 'Success',
                            data: result.data
                        });
                    } else if (result.data.Status === 'FAILED') {
                        const amount = existingTransaction.amount;
                        const wallet = await walletsCollection.findOne({ userId: decodedToken.number });

                        if (!wallet) {
                            return res.status(400).json({ message: 'User wallet not found' });
                        }

                        const newBalance = wallet.amount + parseInt(amount) + 5;
                        await walletsCollection.updateOne(
                            { userId: decodedToken.number  },
                            { $set: { amount: newBalance } }
                        );

                        const admin = await db.collection('users').findOne({ role: 'admin' });
                        if (!admin) {
                            await walletsCollection.updateOne(
                                { userId: decodedToken.number  },
                                { $set: { amount: wallet.amount } }
                            );
                            return res.status(400).json({ message: 'Something went wrong, contact Admin' });
                        }

                        const adminWallet = await walletsCollection.findOne({ userId: admin.number });
                        if (!adminWallet) {
                            await walletsCollection.updateOne(
                                { userId: decodedToken.number  },
                                { $set: { amount: wallet.amount } }
                            );
                            return res.status(400).json({ message: 'Contact Admin' });
                        }

                        const newAdminBalance = adminWallet.amount - parseInt(amount) + 5;
                        await walletsCollection.updateOne(
                            { userId: admin.number },
                            { $set: { amount: newAdminBalance } }
                        );

                        const transactionHistory = {
                            senderOpening: adminWallet.amount,
                            senderClosing: newAdminBalance,
                            senderId: admin.number,
                            receiverOpening: wallet.amount,
                            receiverClosing: newBalance,
                            receiverId: userId,
                            date: new Date(),
                            transactionId: generateTransactionId(15),
                            amount: parseInt(amount) + 5,
                            type: 'withdraw'
                        };

                        await db.collection('transactionHistory').insertOne(transactionHistory);

                        await collection.updateOne(
                            { Transid: obj.Transid },
                            { $set: { status: 'Failed', message: 'Transaction Failed' } }
                        );
                        return res.status(200).json({
                            status: 'Failed',
                            data: result.data
                        });
                    } else {
                        return res.status(400).json({ error: 'Unknown transaction status' });
                    }
                } else if (result.statuscode === 'TUP') {
                    await collection.updateOne(
                        { Transid: obj.Transid },
                        { $set: { status: 'Not Found', message: 'Transaction ID not found' } }
                    );
                    return res.status(400).json({ error: 'Transaction ID not found' });
                } else {
                    return res.status(400).json({ error: 'Unexpected status code' });
                }
            } catch (error) {
                console.error('Error making API request:', error);
                return res.status(500).json({ error: 'Internal server error: Failed to fetch transaction details' });
            }
        });

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const callBackApi = async (req, res) => {
    try {
        
        const data = req.query;
        console.log("data",data)
        const apiOrderId = data.rchid;
        const remainbal = data.remainbal;
        const Operatorid = data.operatorid;

        const db = getDB();
        const collection = db.collection('fundhistory'); // Specify the collection name
        const walletsCollection = db.collection('wallets');

        const existingTransaction = await collection.findOne({ apiOrderId });
       
        if (existingTransaction.status !== 'Pending') {
            return res.status(400).json({ message: 'This Transection Already Upadted' });
        }

        if (!existingTransaction) {
            return res.status(400).json({ message: 'Invalid Transaction Id' });
        }

        if (data.Status === 'Success') {
            await collection.updateOne(
                { apiOrderId },
                { $set: { status: 'Success', message: 'Transaction Successful', rrn: Operatorid, remainingBalance: remainbal } }
            );
            return res.status(200).json({
                status: 'Success',
                data
            });
        } else if (data.Status === 'Failed') {
            const amount = existingTransaction.amount;
            const userId = existingTransaction.Senderno;

            const wallet = await walletsCollection.findOne({ userId });
            if (!wallet) {
                return res.status(400).json({ message: 'User wallet not found' });
            }

            const newBalance = wallet.amount + parseInt(amount) + 5;
            await walletsCollection.updateOne(
                { userId },
                { $set: { amount: newBalance } }
            );

            const admin = await db.collection('users').findOne({ role: 'admin' });
            if (!admin) {
                await walletsCollection.updateOne(
                    { userId },
                    { $set: { amount: wallet.amount } }
                );
                return res.status(400).json({ message: 'Something went wrong, contact Admin' });
            }

            const adminWallet = await walletsCollection.findOne({ userId: admin.number });
            if (!adminWallet) {
                await walletsCollection.updateOne(
                    { userId },
                    { $set: { amount: wallet.amount } }
                );
                return res.status(400).json({ message: 'Contact Admin' });
            }

            const newAdminBalance = adminWallet.amount - parseInt(amount) + 5;
            await walletsCollection.updateOne(
                { userId: admin.number },
                { $set: { amount: newAdminBalance } }
            );

            const transactionHistory = {
                senderOpening: adminWallet.amount,
                senderClosing: newAdminBalance,
                senderId: admin.number,
                receiverOpening: wallet.amount,
                receiverClosing: newBalance,
                receiverId: userId,
                date: new Date(),
                transactionId: generateTransactionId(15),
                amount: parseInt(amount) + 5,
                type: 'refund'
            };

            await db.collection('transectionHistory').insertOne(transactionHistory);

            await collection.updateOne(
                { apiOrderId },
                { $set: { status: 'Failed', message: 'Transaction Failed', rrn: Operatorid, remainingBalance: remainbal } }
            );
            return res.status(200).json({
                status: 'Failed',
                data
            });
        } else {
            return res.status(400).json({ error: 'Unknown transaction status' });
        }
    } catch (error) {
        console.error('Error processing callback API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = { verifiyNumber, registerRemitter, verifyOtp, getAllBank, addAccount, getAccounts, fundWithdraw, allFundTransferHistory, statusCheck, callBackApi };