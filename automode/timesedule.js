const schedule = require('node-schedule');
const { getDB } = require('../dbconnection');
require('dotenv').config();

let activeLotteries = [];

async function scheduleJobs() {
    try {
        const db = getDB();
        const collection = db.collection('lottery');
        const currentLotteryCollection = db.collection('currentLottery');
        const result = await collection.find().toArray();

        for (let lottery of result) {
            console.log(`Scheduling lottery: ${lottery.lotteryName}`);

            const period = lottery.period;
            const hour = lottery.hours;
            const minutes = lottery.minutes;
            let startHour = hour;

            // Convert to 24-hour format
            if (period === 'PM' && hour !== 12) {
                startHour += 12;
            } else if (period === 'AM' && hour === 12) {
                startHour = 0;
            }

            // Schedule start job
            const startJobTime = new Date();
            startJobTime.setHours(startHour);
            startJobTime.setMinutes(minutes);
            startJobTime.setSeconds(0);
            if (startJobTime < new Date()) {
                // If the start time is in the past, add one day to the start time
                startJobTime.setDate(startJobTime.getDate() + 1);
            }
            console.log(`Scheduled start time: ${startJobTime.toLocaleString()}`);

            // Use async functions inside scheduleJob to ensure proper error handling and await operations
            schedule.scheduleJob(startJobTime, async () => {
                console.log(`Starting lottery: ${lottery.lotteryName} at ${new Date().toLocaleString()}`);

                try {
                    // Check if the lottery already exists in currentLottery collection and delete if it does
                    const existingLottery = await currentLotteryCollection.findOne({ lotteryId: lottery.lotteryId });

                    if (existingLottery) {
                        console.log(`Existing lottery found in currentLottery: ${existingLottery.lotteryName}, attempting to delete.`);
                        const deleteResult = await currentLotteryCollection.deleteOne({ lotteryId: lottery.lotteryId });
                        if (deleteResult.deletedCount === 1) {
                            console.log(`Successfully deleted existing lottery: ${existingLottery.lotteryName}`);
                        } else {
                            console.log(`Failed to delete existing lottery: ${existingLottery.lotteryName}`);
                        }
                    } else {
                        console.log(`No existing lottery found in currentLottery for lotteryId: ${lottery.lotteryId}`);
                    }

                    // Insert the running lottery into the database
                    await currentLotteryCollection.insertOne(lottery);
                    activeLotteries.push(lottery);

                    // Schedule end job
                    const endJobTime = new Date(startJobTime.getTime() + lottery.timeDuration * 60 * 60 * 1000);
                    console.log(`Scheduled end time: ${endJobTime.toLocaleString()}`);

                    schedule.scheduleJob(endJobTime, async () => {
                        console.log(`Ending lottery: ${lottery.lotteryName} at ${new Date().toLocaleString()}`);
                        try {
                            const deleteResult = await currentLotteryCollection.deleteOne({ lotteryId: lottery.lotteryId });
                            if (deleteResult.deletedCount === 1) {
                                console.log(`Successfully deleted lottery: ${lottery.lotteryName} from currentLottery`);
                            } else {
                                console.log(`Failed to delete lottery: ${lottery.lotteryName} from currentLottery`);
                            }
                        } catch (error) {
                            console.error(`Error deleting lottery: ${lottery.lotteryName} from currentLottery - ${error.message}`);
                        }
                        activeLotteries = activeLotteries.filter(activeLottery => activeLottery.lotteryId !== lottery.lotteryId);
                    });
                } catch (error) {
                    console.error(`Error processing lottery: ${lottery.lotteryName} - ${error.message}`);
                }
            });
        }
    } catch (error) {
        console.error(`Error scheduling jobs: ${error.message}`);
    }
}

function logCurrentTime() {
    schedule.scheduleJob('*/5 * * * * *', () => {
        const now = new Date();
        console.log(`Current time: ${now.toLocaleTimeString()}`);
        console.log(`Active lotteries: ${activeLotteries.map(lottery => lottery.lotteryName).join(', ')}`);
    });
}

// Start the scheduler
scheduleJobs(); 
logCurrentTime(); 
