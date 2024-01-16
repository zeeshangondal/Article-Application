const mongoose = require("mongoose");

const DrawSchema = mongoose.Schema({
    rewardedUsernames: {
        type: [String], 
        default: []      
      },
      allRewarded:{
        type:Boolean,
        default:false
      },
    prize:{
        firstPrize:{
            type:String,
            default:""
        },
        secondPrize1:{
            type:String,
            default:""
        },
        secondPrize2:{
            type:String,
            default:""
        },
        secondPrize3:{
            type:String,
            default:""
        },
        secondPrize4:{
            type:String,
            default:""
        },
        secondPrize5:{
            type:String,
            default:""
        },
    },
    title: {
        type: String,
    },
    drawDate: {
        type: String,
    },
    drawTime: {
        type: String,
    },
    drawStatus: {
        type: Boolean,
    },
    drawExpired: {
        type: Boolean,
        default: false,
    },
    oneDigitFirst: {
        digit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        price: {
            type: Number,
            default: 0,
        },
    },
    oneDigitSecond: {
        digit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        price: {
            type: Number,
            default: 0,
        },
    },
    twoDigitFirst: {
        digit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        price: {
            type: Number,
            default: 0,
        },
    },
    twoDigitSecond: {
        digit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        price: {
            type: Number,
            default: 0,
        },
    },
    threeDigitFirst: {
        digit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        price: {
            type: Number,
            default: 0,
        },
    },
    threeDigitSecond: {
        digit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        price: {
            type: Number,
            default: 0,
        },
    },
    fourDigitFirst: {
        digit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        price: {
            type: Number,
            default: 0,
        },
    },
    fourDigitSecond: {
        digit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        price: {
            type: Number,
            default: 0,
        },
    },
}, { timestamps: true });

const Draw = mongoose.model('Draw', DrawSchema);

module.exports = Draw;
