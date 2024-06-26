import { Request, Response } from "express"
import csvtojson from "csvtojson";
import Trade from "../models/trade";
import moment from 'moment';

function preciseDate(date) {
    return moment(date, "M-D-YYYY hh:mm:ss:A").toDate();
}

interface Trades {
    UTC_Time: String,
    Operation: string,
    Market: string,
    Amount: number,
    Price: number,
    _id: string
}

const input = async (req: Request, res: Response) => {
    try {
        if (!req.file)
            return res.status(404).json({ msg: 'No files found' })
        if (!(req.file.mimetype === "text/csv") && !req.file.originalname.endsWith(".csv"))
            return res.status(403).json({ msg: 'Invalid file format, CSV file is needed to proceed any further' })
        let csvData = req.file.buffer.toString();
        const strData = Buffer.from(csvData).toString("utf-8");
        let csvJson = await csvtojson({
            noheader: false,
            trim: true,
            output: "json",
        }).fromString(strData);
        // console.log(csvData)
        csvJson.forEach(trade => {
            trade.Amount = trade['Buy/Sell Amount'];
            delete trade['Buy/Sell Amount'];
        })
        const tradesByUserId = {};

        for (const trade of csvJson) {
            if (!tradesByUserId[trade.User_ID]) {
                tradesByUserId[trade.User_ID] = []
            }
            // console.log(preciseDate(trade.UTC_Time))
            await tradesByUserId[trade.User_ID].push({
                UTC_Time: preciseDate(trade.UTC_Time),
                Operation: trade.Operation,
                Market: trade.Market,
                Amount: Number(trade.Amount),
                Price: Number(trade.Price)
            });
        }
        for (const userId in tradesByUserId) {
            const userTrades = tradesByUserId[userId];
            const tradeDocument = new Trade({
                User_ID: userId,
                Trades: userTrades
            });
            await tradeDocument.save();
        }
        return res.status(200).json({ msg: "All data saved in the database" })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error occured while uplaoding file' })
    }
}

const balance = async (req: Request, res: Response) => {
    try {
        const User_ID = req.query.id;
        if(!User_ID)
            return res.status(403).json({msg:"User ID is required"})
        let { timestamp } = req.body;
        if(!timestamp)
            return res.status(403).json({msg:"Time stamp is required"})
        timestamp = moment(timestamp, "YYYY-M-D hh:mm:ss A").toDate();

        const data = await Trade.findOne({ User_ID });
        if (!data || !data.Trades) {
            console.error('No data found or Trades is undefined');
            return;
        }

        const transactions = data.Trades;
        // console.log(transactions)
        let btc = 0, matic = 0;

        for (let i = 0; i < Object.values(transactions).length; i++) {
            // console.log((new Date(transactions[i].UTC_Time)).getTime(),timestamp.getTime())
            if ((new Date(transactions[i].UTC_Time)).getTime() < timestamp) {
                if (transactions[i].Operation === 'Buy') {
                    const coin = transactions[i].Market.split('/')
                    if (coin[0] === 'BTC') {
                        btc += transactions[i].Amount
                    }
                    else if (coin[0] === 'MATIC') {
                        matic += transactions[i].Amount
                    }
                }
                else {
                    const coin = transactions[i].Market.split('/')
                    if (coin[0] === 'BTC') {
                        btc -= transactions[i].Amount
                    }
                    else if (coin[0] === 'MATIC') {
                        matic -= transactions[i].Amount
                    }
                }
            }
        }
        if (btc !== 0 && matic !== 0)
            return res.status(200).json({ btc, matic })
        else if (btc !== 0)
            return res.status(200).json({ btc })
        else
            return res.status(200).json({ matic })
    } catch (error) {
        console.error(`Error processing transactions: ${error}`);
        return res.status(500).json({ msg: "Error fetching data" })
    }
}

const all_exports = {
    input,
    balance
}

export default all_exports

