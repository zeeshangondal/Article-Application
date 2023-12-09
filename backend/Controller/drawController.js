const Draw = require("../Models/Draw");

// Create a new draw
let createDraw = async (req, res) => {
    try {
        let drawData={ ...req.body }
        const draw = new Draw(initializeDraw(drawData));
        const createdDraw = await draw.save();
        res.status(201).send({ message: "Draw created successfully", draw: createdDraw });
    } catch (error) {
        console.error("Error creating draw");
        res.status(500).send({ message: "Error", error });
    }
};


function initializeDraw(drawObj){
    const { title, drawDate, drawTime, drawStatus, oneDigitFirst, oneDigitSecond, twoDigitFirst, twoDigitSecond, threeDigitFirst, threeDigitSecond, fourDigitFirst, fourDigitSecond, drawExpired } = drawObj
    const drawData={
        title, drawDate, drawTime, drawStatus, 
        oneDigitFirst: initializeOneDigit(oneDigitFirst.price), 
        oneDigitSecond: initializeOneDigit(oneDigitSecond.price), 
        twoDigitFirst: initializeTwoDigit(twoDigitFirst.price), 
        twoDigitSecond: initializeTwoDigit(twoDigitSecond.price), 
        threeDigitFirst: initializeThreeDigit(threeDigitFirst.price), 
        threeDigitSecond: initializeThreeDigit(threeDigitSecond.price),
        fourDigitFirst: initializeFourDigit(fourDigitFirst.price), 
        fourDigitSecond:initializeFourDigit(fourDigitSecond.price), 
        drawExpired
    }
    return drawData
}
function initializeOneDigit(price=0) {
    const digitsArray = Array.from({ length: 10 }, (_, index) => index.toString());
    const articles = {};
    digitsArray.forEach((digit) => {
        articles[digit] = price;
    });
    const oneDigit = {
        price: price, // Replace with your actual price
        articles: articles,
    };
    return oneDigit
}
function initializeTwoDigit(price=0) {
    const twoDigitsArray = Array.from({ length: 100 }, (_, index) => index.toString().padStart(2, '0'));
    const articles = {};
    
    twoDigitsArray.forEach((digits) => {
        articles[digits] = price;
    });

    const twoDigit = {
        price: price,
        articles: articles,
    };
    return twoDigit
}

function initializeThreeDigit(price = 0) {
    const threeDigitsArray = Array.from({ length: 1000 }, (_, index) => index.toString().padStart(3, '0'));
    const articles = {};

    threeDigitsArray.forEach((digits) => {
        articles[digits] = price;
    });

    const threeDigit = {
        price: price,
        articles: articles,
    };
    return threeDigit
}

function initializeFourDigit(price = 0) {
    const fourDigitsArray = Array.from({ length: 10000 }, (_, index) => index.toString().padStart(4, '0'));
    const articles = {};

    fourDigitsArray.forEach((digits) => {
        articles[digits] = price;
    });

    const fourDigit = {
        price: price,
        articles: articles,
    };
    return fourDigit;
}


// Update a draw
let updateDraw = (req, res) => {
    let _id = req.params.id;
    const { title, drawDate, drawTime, drawStatus, oneDigitFirst, oneDigitSecond, twoDigitFirst, twoDigitSecond, threeDigitFirst, threeDigitSecond, fourDigitFirst, fourDigitSecond, drawExpired } = req.body

    let updates = {
        title, drawDate, drawTime, drawStatus, oneDigitFirst:{price:oneDigitFirst.price}, oneDigitSecond:{price:oneDigitSecond.price}, twoDigitFirst:{price:twoDigitFirst.price}, twoDigitSecond:{price:twoDigitFirst.price}, threeDigitFirst:{price: threeDigitFirst.price}, threeDigitSecond:{price:threeDigitSecond.price}, fourDigitFirst:{price:fourDigitFirst.price}, fourDigitSecond:{price:fourDigitSecond.price}, drawExpired
    };

    Draw.findOneAndUpdate({ _id }, updates, { new: true })
        .then((updatedDraw) => {
            if (!updatedDraw) {
                return res.status(404).send({ message: "Draw not found" });
            }
            res.status(200).send({ message: "Draw updated", draw: updatedDraw });
        })
        .catch(err => {
            res.status(500).send({ message: "Error", err });
        });
};

// Delete a draw
let deleteDraw = (req, res) => {
    let _id = req.params.id;

    Draw.findByIdAndDelete(_id)
        .then((deletedDraw) => {
            if (!deletedDraw) {
                return res.status(404).send({ message: "Draw not found" });
            }
            res.status(200).send({ message: "Draw deleted", deletedDraw });
        })
        .catch(err => {
            res.status(500).send({ message: "Error", err });
        });
};


// Function to check if draw time has passed
function isDrawTimePassed(drawDate, drawTime) {
    const drawDateTime = new Date(`${drawDate} ${drawTime}`);
    const currentDateTime = new Date();
    return currentDateTime > drawDateTime;
}

// Get all draws with updated drawStatus and save the updates
let getAllDraws = async (req, res) => {
    try {
        // Fetch all draws
        const draws = await Draw.find({}).select('-oneDigitFirst.articles -oneDigitSecond.articles -twoDigitFirst.articles -twoDigitSecond.articles -threeDigitFirst.articles -threeDigitSecond.articles -fourDigitFirst.articles -fourDigitSecond.articles');

        // Update draw status for each draw
        const updates = draws.map(async draw => {
            const { drawDate, drawTime, drawExpired } = draw;

            // Check if draw time has passed
            const isExpired = isDrawTimePassed(drawDate, drawTime);
            // Update draw status
            draw.drawExpired = isExpired;
            if (isExpired) {
                draw.drawStatus == false
            }
            // Save the updated draw
            await draw.save();

            // Return the updated draw
            return draw.toObject();
        });

        // Wait for all updates to be completed
        const updatedDraws = await Promise.all(updates);

        // Send the updated draws to the frontend
        res.status(200).send({ draws: updatedDraws });
    } catch (err) {
        res.status(500).send({ message: "Error", err });
    }
};

// Get draw by ID
let getDrawById = (req, res) => {
    let drawId = req.params.id;

    Draw.findById(drawId)
        .then((draw) => {
            if (!draw) {
                return res.status(404).send({ message: "Draw not found" });
            }
            res.status(200).send({ draw });
        })
        .catch(err => {
            res.status(500).send({ message: "Error", err });
        });
};

module.exports = {
    createDraw,
    updateDraw,
    deleteDraw,
    getAllDraws,
    getDrawById,
};
