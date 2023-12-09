const mongoose = require("mongoose");

const DrawSchema = mongoose.Schema({
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
    drawExpired:{
        type:Boolean,
        default:false
    },
    oneDigitFirst: {
        price: { type: Number },
        articles: {
            type: Object, // Change from Map to Object
            default: {},  // Default to an empty object
        },
    },
    oneDigitSecond: {
        price: { type: Number },
        articles: {
            type: Object, // Change from Map to Object
            default: {},  // Default to an empty object
        },
    },
    twoDigitFirst: {
        price: { type: Number },
        articles: {
            type: Object, // Change from Map to Object
            default: {},  // Default to an empty object
        },
    },
    twoDigitSecond: {
        price: { type: Number },
        articles: {
            type: Object, // Change from Map to Object
            default: {},  // Default to an empty object
        },
    },
    threeDigitFirst: {
        price: { type: Number },
        articles: {
            type: Object, // Change from Map to Object
            default: {},  // Default to an empty object
        },
    },
    threeDigitSecond: {
        price: { type: Number },
        articles: {
            type: Object, // Change from Map to Object
            default: {},  // Default to an empty object
        },
    },
    fourDigitFirst: {
        price: { type: Number },
        articles: {
            type: Object, // Change from Map to Object
            default: {},  // Default to an empty object
        },
    },
    fourDigitSecond: {
        price: { type: Number },
        articles: {
            type: Object, // Change from Map to Object
            default: {},  // Default to an empty object
        },
    },
}, { timestamps: true });

const Draw = mongoose.model('Draw', DrawSchema);

module.exports = Draw;
