const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    messagesData: [
        {
            drawId: { type: String },
            messages: [String]
        }
    ],
    limitCuttingSaves: {
        firstA: {
            type: Number,
            default: null
        },
        secondA: {
            type: Number,
            default: null
        },
        firstB: {
            type: Number,
            default: null
        },
        secondB: {
            type: Number,
            default: null
        },
        firstC: {
            type: Number,
            default: null
        },
        firstC: {
            type: Number,
            default: null
        },
        secondC: {
            type: Number,
            default: null
        },
        firstD: {
            type: Number,
            default: null
        },
        secondD: {
            type: Number,
            default: null
        },
    },
    userId: {
        type: Number,
    },
    username: {
        type: String,
        unique: true
    },
    role: {
        type: String,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    password: {
        type: String,
    },
    debit: {
        type: Number,
        default: 0
    },
    credit: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    availableBalance: {
        type: Number,
        default: 0
    },
    balanceUpline: {
        type: Number,
        default: 0
    },
    commission: {
        commision: { type: Number, default: 0 },
        share: { type: Number, default: 0 },
        pcPercentage: { type: Number, default: 0 },
        pcShare: { type: Number, default: 0 },

        shareEnabled: {
            type: Boolean,
            default: true
        },
    },
    hadd: {
        hindsyKiHad1: { type: Number, default: 0 },
        hindsyKiHad2: { type: Number, default: 0 },
        akraKiHad1: { type: Number, default: 0 },
        akraKiHad2: { type: Number, default: 0 },
        firstTendolaKiHad: { type: Number, default: 0 },
        secondTendolaKiHad: { type: Number, default: 0 },
        firstPangodaKiHad: { type: Number, default: 0 },
        secondPangodaKiHad: { type: Number, default: 0 },
        haddEnabled: {
            type: Boolean,
            default: false
        },

    },
    generalInfo: {
        name: { type: String, default: '' },
        address: { type: String, default: '' },
        contactNumber: { type: String, default: '' },
        active: { type: Boolean, default: false },
        enableLimitSaleReportView: { type: Boolean, default: false },
    },
    rewardCommission: {
        firstA: { type: Number, default: 0 },
        firstB: { type: Number, default: 0 },
        firstC: { type: Number, default: 0 },
        firstD: { type: Number, default: 0 },
    },
    purchaseLimit: {
        purchaseLimitA1: { type: Number, default: 0 },
        purchaseLimitA2: { type: Number, default: 0 },
        purchaseLimitB1: { type: Number, default: 0 },
        purchaseLimitB2: { type: Number, default: 0 },
        purchaseLimitC1: { type: Number, default: 0 },
        purchaseLimitC2: { type: Number, default: 0 },
        purchaseLimitD1: { type: Number, default: 0 },
        purchaseLimitD2: { type: Number, default: 0 },

        oneDigitFirst: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        oneDigitSecond: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        twoDigitFirst: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        twoDigitSecond: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        threeDigitFirst: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        threeDigitSecond: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        fourDigitFirst: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
        fourDigitSecond: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Digit',
        },
    },



    transactionHistory: [{
        description: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
        },
        debit: {
            type: Number,
            default: 0,
        },
        credit: {
            type: Number,
            default: 0,
        },
        balanceUpline: {
            type: Number,
            default: 0,
        },
        date: {
            type: String,
        },
    }],
    purchasedFromDrawData: [{
        drawId: {
            type: String
        },
        savedPurchases: [{
            bundle: { type: String },
            first: { type: Number },
            second: { type: Number }
        }],
        savedOversales: [{
            bundle: { type: String },
            first: { type: Number },
            second: { type: Number }
        }]
    }],

    //confirm saved
    savedPurchasesFromDrawsData: [{
        drawId: {
            type: String
        },
        sheetName: {
            type: String,
            default: ""
        },
        savedPurchases: [{
            bundle: { type: String },
            first: { type: Number },
            second: { type: Number }
        }],
        savedOversales: [{
            bundle: { type: String },
            first: { type: Number },
            second: { type: Number }
        }]
    }],


}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;
