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
    oneDigitFirst: {
        price: { type: Number },
        articles: {
            type: Map,
            of: { type: Number },
        },
    },
    oneDigitSecond: {
        price: { type: Number },
        articles: {
            type: Map,
            of: { type: Number },
        },
    },
    twoDigitFirst: {
        price: { type: Number },
        articles: {
            type: Map,
            of: { type: Number },
        },
    },
    twoDigitSecond: {
        price: { type: Number },
        articles: {
            type: Map,
            of: { type: Number },
        },
    },
    threeDigitFirst: {
        price: { type: Number },
        articles: {
            type: Map,
            of: { type: Number },
        },
    },
    threeDigitSecond: {
        price: { type: Number },
        articles: {
            type: Map,
            of: { type: Number },
        },
    },
    fourDigitFirst: {
        price: { type: Number },
        articles: {
            type: Map,
            of: { type: Number },
        },
    },
    fourDigitSecond: {
        price: { type: Number },
        articles: {
            type: Map,
            of: { type: Number },
        },
    },
}, { timestamps: true });

const Draw = mongoose.model('Draw', DrawSchema);

module.exports = Draw;
