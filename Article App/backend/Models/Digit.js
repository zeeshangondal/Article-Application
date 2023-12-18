const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema
const DigitSchema = new Schema({
    articles: {
        type: Object,  // Change from Map to Object
        default: {},   // Default to an empty object
    },
});

// Create the model based on the schema
const Digit = mongoose.model('Digit', DigitSchema);

// Export the model
module.exports = Digit;
