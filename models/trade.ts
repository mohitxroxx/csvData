import { Schema, model } from "mongoose"

interface Trade{
    User_ID:number,
    Trades:{
        UTC_Time:String,
        Operation:string,
        Market:string,
        Amount:number,
        Price:number
    }
}

const TradeSchema=new Schema<Trade>({
    User_ID:{
        type:Number,
        required: true,
        trim: true 
    },
    Trades:[{
        UTC_Time:{
            type: String,
            required: true,
            // trim: true 
        },
        Operation:{
            type: String,
            required: true,
            trim: true 
        },
        Market:{
            type: String,
            required: true,
            trim: true 
        },
        Amount:{
            type: Number,
            required: true,
            trim: true 
        },
        Price:{
            type: Number,
            required: true,
            trim: true 
        }
    }]
})

export default model<Trade>("Trade Detail",TradeSchema)