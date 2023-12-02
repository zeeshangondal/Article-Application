const mongoose = require("mongoose")

const UserSchema = mongoose.Schema({
    userId: {
        type: Number,
    },
    name: {
        type: String,
    },
    address: {
        type: String,
    },
    active: {
        type: Boolean,
    },
    
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
    },
    contactNumber: {
        type: String,
    },
    role: {
        type: String,
        // required: true,
    },
    password: {
        type: String,
    },

    debit: {
        type: Number,
        default:0
    },
    credit: {
        type: Number,
        default:0
    },
    balance: {
        type: Number,
        default:0
    },
},
    { timestamps: true }
);






const User = mongoose.model('User', UserSchema);

module.exports = User;