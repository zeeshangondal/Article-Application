const mongoose = require("mongoose")

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
    oneDigitFirst: {
        type: Number,
    },
    oneDigitSecond: {
        type: Number,
    },

    twoDigitFirst: {
        type: Number,
    },
    twoDigitSecond: {
        type: Number,
    },

    threeDigitFirst: {
        type: Number,
    },
    threeDigitSecond: {
        type: Number,
    },

    fourDigitFirst: {
        type: Number,
    },
    fourDigitSecond: {
        type: Number,
    },
},
    { timestamps: true }
);






const Draw = mongoose.model('Draw', DrawSchema);

module.exports = Draw;