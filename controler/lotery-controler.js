const { getDB } = require('../dbconnection');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const secretKey = process.env.secretkey;

const addLottery = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('lottery');
        const data = req.body;
        let lotteryName = data.lotteryName.trim().toUpperCase(); // Trim whitespace and convert to uppercase

        // Check if the lottery already exists
        const isAlreadyExist = await collection.findOne({ lotteryName: lotteryName });

        if (isAlreadyExist) {
            return res.status(400).json({ message: 'Lottery already exists!' });
        }

        // Generate a unique readable number using the current timestamp
        const date = new Date();
        const uniqueNumber = `LOT${date.getTime()}`;
        data.lotteryId = uniqueNumber;
        data.createdAt = date;
        data.lotteryName = lotteryName;
        data.arrayLuckyNumber = generateNumberArray(data.totalLuckyNumber);
        const isPresentWithTime = await collection.findOne({
            hours: data.hours,
            period: data.period
        })
        console.log(isPresentWithTime)
        if (isPresentWithTime) {
            return res.status(400).json({ message: 'lottery already save with this time' })
        }
        await collection.insertOne(data);

        return res.status(200).json({ message: 'Lottery added successfully!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


function generateNumberArray(n) {
    let result = [];
    for (let i = 0; i < n; i++) {
        result.push(i.toString().padStart(2, '0'));
    }
    return result;
}

// Example usage:



const getAllLottery = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('lottery');
        const result = await collection.find().toArray();
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const saveWidInfo = async (req, res) => {
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
            const collection = db.collection('wids');
            const wallets = db.collection('wallets');
            const data = req.body;

            const lotteryArrya = data.lotteryArrya;

            if (!lotteryArrya || lotteryArrya.lenght == 0) {
                return res.status(400).json({ message: 'lottery details not found' })
            }
            const isUser = await db.collection('users').findOne({ number });
            if (!isUser) {
                return res.status(400).json({ message: 'Invalid User Id' });
            }

            const isWallet = await wallets.findOne({ userId: number });
            if (!isWallet) {
                return res.status(400).json({ message: 'Invalid request' });
            }

            const walletAmount = isWallet.amount;
            if (walletAmount < data.totalAmount) {
                return res.status(400).json({ message: 'Insufficient balance' });
            }
            let adminAmmount;
            const commissionCollection = db.collection('commession');
            
            if (isUser.referal) {
                const getRefrel = await db.collection('users').findOne({ number: isUser.referal });
                
                const commission = await commissionCollection.findOne({ user: isUser.referal });
                let CalculateCommission;
               
                if (commission) {
                    const commession = commission.commession;
                    CalculateCommission = ((data.amount) * (parseInt(commession))) / 100;
             

                } else {

                    if (getRefrel) {
                        const role = getComputedStyle.role;
                        const forAllUser = await commissionCollection.findOne({ role: role });
                        if (forAllUser) {
                            const commession = forAllUser.commession;
                            CalculateCommission = ((data.totalAmount) * (parseInt(commession))) / 100;
                        } else {
                            CalculateCommission = ((data.totalAmount) * (parseInt(0))) / 100;
                        }
                    }
                }

                if (getRefrel) {
                    const refrelWallet=await wallets.findOne({userId: isUser.referal});
                    const amount=refrelWallet.amount;
                    const updateAmount=amount+CalculateCommission
                    await wallets.findOneAndUpdate(
                        { userId: isUser.referal },
                        { $set: { amount: updateAmount } },
                        { returnOriginal: false }
                    );
                    adminAmmount = data.totalAmount - CalculateCommission;
                   
                }


            }

            const newBalance = walletAmount - parseInt(data.totalAmount);
            const userUpdateResult = await wallets.findOneAndUpdate(
                { userId: number },
                { $set: { amount: newBalance } },
                { returnOriginal: false }
            );

            if (!userUpdateResult) {
                return res.status(500).json({ message: 'Failed to update user balance' });
            }

            const admin = await db.collection('users').findOne({ role: 'admin' });
            if (!admin) {
                await wallets.findOneAndUpdate(
                    { userId: number },
                    { $set: { amount: walletAmount } },
                    { returnOriginal: false }
                );
                return res.status(400).json({ message: 'Something went wrong, contact Admin' });
            }

            const adminWallet = await wallets.findOne({ userId: admin.number });
            if (!adminWallet) {
                await wallets.findOneAndUpdate(
                    { userId: number },
                    { $set: { amount: walletAmount } },
                    { returnOriginal: false }
                );
                return res.status(400).json({ message: 'Contact Admin' });
            }

            const adminBalance = adminWallet.amount;
            const newBalanceAdmin = adminBalance + parseInt(adminAmmount);
            await wallets.findOneAndUpdate(
                { userId: admin.number },
                { $set: { amount: newBalanceAdmin } },
                { returnOriginal: false }
            );

            data.name = decodedToken.name;
            data.status = false;
            const amount = data.amount
            data.number = number;
            for (let item of lotteryArrya) {
                item.number = number,
                    item.name = decodedToken.name;
                item.amount = amount
                item.status = false;
                const result = await collection.insertOne(item);
                if (!result) {
                    return res.status(400).json({ message: 'Something went wrong' });
                }

            }


            return res.status(200).json({ message: 'Lotery Added' });
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};




const findWidsForUser = async (req, res) => {
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
            const collection = db.collection('wids');
            const number = decodedToken.number;
            const role = decodedToken.role;
            let result;

            if (role === 'admin') {
                result = await collection.find().toArray();
            } else {
                result = await collection.find({ number: number }).toArray();
            }

            return res.status(200).json(result);
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const lotteryStatus = async (req, res) => {
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
            const lotteryCollection = db.collection('lottery');
            const widsCollection = db.collection('wids');

            const lotteries = await lotteryCollection.find({}, {
                projection: { lotteryName: 1, uniqueNumber: 1, _id: 0 }
            }).toArray();

            const investmentData = await widsCollection.aggregate([
                {
                    $group: {
                        _id: {
                            uniqueNumber: "$uniqueNumber",
                            luckyNumber: "$luckyNumber"
                        },
                        totalAmount: { $sum: "$amount" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.uniqueNumber",
                        numbers: {
                            $push: {
                                luckyNumber: "$_id.luckyNumber",
                                totalAmount: "$totalAmount"
                            }
                        },
                        totalLotteryAmount: { $sum: "$totalAmount" },
                        minInvestment: { $min: "$totalAmount" },
                        maxInvestment: { $max: "$totalAmount" }
                    }
                }
            ]).toArray();

            const result = lotteries.map(lottery => {
                const investment = investmentData.find(i => i._id === lottery.uniqueNumber) || {
                    numbers: [],
                    totalLotteryAmount: 0,
                    minInvestment: 0,
                    maxInvestment: 0
                };
                return {
                    lotteryName: lottery.lotteryName,
                    uniqueNumber: lottery.uniqueNumber,
                    totalLotteryAmount: investment.totalLotteryAmount,
                    minInvestment: investment.minInvestment,
                    maxInvestment: investment.maxInvestment,
                    numbers: investment.numbers
                };
            });

            return res.status(200).json(result);
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const findAllwids = async (req, res) => {
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
            const collection = db.collection('wids');

            // Aggregation pipeline to group by lotteryId and lotteryName, sum the amount, and count the investments
            const result = await collection.aggregate([
                { $match: { status: false } },
                {
                    $group: {
                        _id: {
                            lotteryId: "$lotteryId",
                            lotteryName: "$lotteryName"
                        },
                        totalAmount: { $sum: { $toInt: "$amount" } },
                        totalInvestments: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        lotteryId: "$_id.lotteryId",
                        lotteryName: "$_id.lotteryName",
                        totalAmount: 1,
                        totalInvestments: 1
                    }
                }
            ]).toArray();

            return res.status(200).json(result);
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const findWidsOnNumber = async (req, res) => {
    try {
        const { lotteryId } = req.body;
        const db = getDB();
        const lotteryCollection = db.collection('lottery');
        const widsCollection = db.collection('wids');

        // Find the lottery document by lotteryId
        const lottery = await lotteryCollection.findOne({ lotteryId });

        if (!lottery) {
            return res.status(404).json({ error: 'Lottery not found' });
        }

        // Aggregate to find total investments for each lucky number
        const investments = await widsCollection.aggregate([
            { $match: { lotteryId: lotteryId } }, // Filter investments for the specified lotteryId
            {
                $group: {
                    _id: '$lucky', // Aggregate based on lucky number
                    totalInvestment: { $sum: { $toInt: "$amount" } }, // Calculate total investment for each lucky number
                    totalNumberInvestments: { $sum: 1 }
                }
            },
            { $project: { luckyNumber: '$_id', totalInvestment: 1, totalNumberInvestments: 1, _id: 0 } }
        ]).toArray();

        // Check if no investments found
        if (investments.length === 0) {
            return res.status(404).json({ message: 'No investments found for this lottery' });
        }

        // Fill missing lucky numbers with zero investment and zero investments count
        const allLuckyNumbers = lottery.arrayLuckyNumber;
        const allInvestments = allLuckyNumbers.map(number => {
            const investment = investments.find(item => item.luckyNumber === number);
            if (investment) {
                return investment;
            } else {
                return { luckyNumber: number, totalInvestment: 0, totalNumberInvestments: 0 };
            }
        });

        return res.status(200).json({ allInvestments, winingReturn: lottery.winingReturn });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};




const announceWinner = async (req, res) => {
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
            if (role !== 'admin') {
                return res.status(400).json({ message: 'Unauthorized user' });
            }

            const data = req.body;
            if (!data || !data.lotteryId || !data.luckyNumber) {
                return res.status(400).json({ message: 'Invalid request body' });
            }

            const db = getDB();
            const collection = db.collection('wids');
            const wallets = db.collection('wallets');

            // Filter documents based on both lotteryId and luckyNumber
            const result = await collection.find({
                lotteryId: data.lotteryId,
                lucky: data.luckyNumber
            }).toArray();

            const lotteryCollection = db.collection('lottery');
            const findLottery = await lotteryCollection.findOne({ lotteryId: data.lotteryId });
            if (!findLottery) {
                return res.status(400).json({ message: 'Invalid lottery' });
            }

            const winingReturn = findLottery.winingReturn;

            for (let item of result) {
                const amount = item.amount;
                const winingAmount = parseInt(amount) * parseInt(winingReturn);
                const userId = item.number;
                const userWallet = await wallets.findOne({ userId: userId });
                if (!userWallet) {
                    return res.status(400).json({ message: 'User does not exist' });
                }

                const crAmount = userWallet.amount;
                const updateAmount = crAmount + winingAmount;
                await wallets.findOneAndUpdate(
                    { userId: userId },
                    { $set: { amount: updateAmount } },
                    { returnOriginal: false }
                );

                const admin = await db.collection('users').findOne({ role: 'admin' });
                if (!admin) {
                    return res.status(400).json({ message: 'Admin user not found' });
                }

                const adminWallet = await wallets.findOne({ userId: admin.number });
                if (!adminWallet) {
                    return res.status(400).json({ message: 'Admin wallet not found' });
                }

                const adminBalance = adminWallet.amount;
                const newBalanceAdmin = adminBalance - parseInt(winingAmount);
                await wallets.findOneAndUpdate(
                    { userId: admin.number },
                    { $set: { amount: newBalanceAdmin } },
                    { returnOriginal: false }
                );
            }

            // Update status for all documents with the specified lotteryId
            await collection.updateMany(
                { lotteryId: data.lotteryId },
                { $set: { status: true, winnerNumber: data.luckyNumber } }
            );


            // Find all wids on lottery
            const findAllWidsOnLottery = await collection.find({
                lotteryId: data.lotteryId
            }).toArray();

            // Insert the fetched documents into the winners collection
            const winnersCollection = db.collection('winners');
            await winnersCollection.insertMany(findAllWidsOnLottery);

            // Delete the fetched documents from the wids collection
            await collection.deleteMany({ lotteryId: data.lotteryId });

            const date = new Date();
            findLottery.date = date;
            findLottery.luckyNumber = data.luckyNumber;

            // Remove existing _id and generate a new one
            const winshistroyDocument = { ...findLottery };
            delete winshistroyDocument._id;
            winshistroyDocument._id = new ObjectId();

            // Insert into winshistroy
            await db.collection('winshistroy').insertOne(winshistroyDocument);

            // Send response
            res.status(200).json({ message: 'Winner announced', wids: findAllWidsOnLottery });
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}



const findWidsForUser1 = async (req, res) => {
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
            const collection = db.collection('wids');

            // Filter documents based on both lotteryId and luckyNumber
            const result = await collection.find({ number: number }).toArray();

            res.status(200).json(result);

        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }

}

const findLottery = async (req, res) => {
    try {
        // const authHeader = req.headers['authorization'];

        // if (!authHeader) {
        //     return res.status(401).json({ error: 'Unauthorized: Authorization header missing' });
        // }

        // const token = authHeader.split(' ')[1];

        // if (!token) {
        //     return res.status(401).json({ error: 'Unauthorized: Token missing' });
        // }

        // jwt.verify(token, secretKey, async (err, decodedToken) => {
        //     if (err) {
        //         return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        //     }

        // const number = decodedToken.number;

        const db = getDB();
        const collection = db.collection('wids');

        // Filter documents based on lotteryId within lotteryArrya
        const result = await collection.find({
            'lotteryArrya.lottery.lotteryId': 'LOT1718012027405'
        }).toArray();

        res.status(200).json(result);
        // });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const winnerList = async (req, res) => {
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
            const collection = db.collection('winshistroy');
            const result = await collection.find().toArray()
            res.status(200).json(result);
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
module.exports = { addLottery, getAllLottery, saveWidInfo, findWidsForUser, lotteryStatus, findAllwids, findWidsOnNumber, announceWinner, findWidsForUser1, findLottery, winnerList };
