const Draw = require("../Models/Draw");
const Digit = require("../Models/Digit");

// Create a new draw
let createDraw = async (req, res) => {
    try {
        let drawData = { ...req.body }
        const oneDigitFirst = await createDigit({ articles: initializeOneDigit(drawData.oneDigitFirst.price) });
        const oneDigitSecond = await createDigit({ articles: initializeOneDigit(drawData.oneDigitSecond.price) });
        const twoDigitFirst = await createDigit({ articles: initializeTwoDigit(drawData.twoDigitFirst.price) });
        const twoDigitSecond = await createDigit({ articles: initializeTwoDigit(drawData.twoDigitSecond.price) });
        const threeDigitFirst = await createDigit({ articles: initializeThreeDigit(drawData.threeDigitFirst.price) });
        const threeDigitSecond = await createDigit({ articles: initializeThreeDigit(drawData.threeDigitSecond.price) });
        const fourDigitFirst = await createDigit({ articles: initializeFourDigit(drawData.fourDigitFirst.price) });
        const fourDigitSecond = await createDigit({ articles: initializeFourDigit(drawData.fourDigitSecond.price) });

        const draw = new Draw({
            ...drawData,
            oneDigitFirst: { digit: oneDigitFirst._id, price: drawData.oneDigitFirst.price },
            oneDigitSecond: { digit: oneDigitSecond._id, price: drawData.oneDigitSecond.price },
            twoDigitFirst: { digit: twoDigitFirst._id, price: drawData.twoDigitFirst.price },
            twoDigitSecond: { digit: twoDigitSecond._id, price: drawData.twoDigitSecond.price },
            threeDigitFirst: { digit: threeDigitFirst._id, price: drawData.threeDigitFirst.price },
            threeDigitSecond: { digit: threeDigitSecond._id, price: drawData.threeDigitSecond.price },
            fourDigitFirst: { digit: fourDigitFirst._id, price: drawData.fourDigitFirst.price },
            fourDigitSecond: { digit: fourDigitSecond._id, price: drawData.fourDigitSecond.price },
        });

        // Save the Draw document
        await draw.save();
        res.status(201).send({ message: "Draw created successfully" });
    } catch (error) {
        console.error("Error creating draw");
        res.status(500).send({ message: "Error", error });
    }
};

async function createDigit(data) {
    const digit = new Digit(data);
    return await digit.save();
}

function initializeOneDigit(price = 0) {
    const digitsArray = Array.from({ length: 10 }, (_, index) => index.toString());
    const articles = {};
    digitsArray.forEach((digit) => {
        articles[digit] = price;
    });
    return articles
}
function initializeTwoDigit(price = 0) {
    const twoDigitsArray = Array.from({ length: 100 }, (_, index) => index.toString().padStart(2, '0'));
    const articles = {};
    twoDigitsArray.forEach((digits) => {
        articles[digits] = price;
    });
    return articles
}
function initializeThreeDigit(price = 0) {
    const threeDigitsArray = Array.from({ length: 1000 }, (_, index) => index.toString().padStart(3, '0'));
    const articles = {};
    threeDigitsArray.forEach((digits) => {
        articles[digits] = price;
    });
    return articles
}
function initializeFourDigit(price = 0) {
    const fourDigitsArray = Array.from({ length: 10000 }, (_, index) => index.toString().padStart(4, '0'));
    const articles = {};
    fourDigitsArray.forEach((digits) => {
        articles[digits] = price;
    });
    return articles
}



let updateDraw = async (req, res) => {
    let _id = req.params.id;

    try {
        // Get the existing Draw document
        const existingDraw = await Draw.findById(_id);

        if (!existingDraw) {
            return res.status(404).send({ message: "Draw not found" });
        }

        // Apply updates to the existing data
        let prevDraw = { ...existingDraw.toObject() }
        const updatedDrawData = { ...existingDraw.toObject(), ...req.body };

        // Update the Draw document
        const updatedDraw = await Draw.findByIdAndUpdate(_id, updatedDrawData, { new: true });

        // Update associated Digit models (dummy update)
        updateAssociatedDigits(updatedDraw, prevDraw);

        res.status(200).send({ message: "Draw updated", draw: updatedDraw });
    } catch (err) {
        res.status(500).send({ message: "Error", err });
    }
};

// let articleKeys=Object.keys(digit.articles)
// // console.log(digit.articles)
// articleKeys.forEach(key=>{
//     console.log(key, digit.articles[key])
// })


const updateAssociatedDigits = async (updatedDraw, prevDraw) => {
    try {
        // Loop through each digit field and trigger a dummy update in the associated Digit model
        for (const digitField of ['oneDigitFirst', 'oneDigitSecond', 'twoDigitFirst', 'twoDigitSecond', 'threeDigitFirst', 'threeDigitSecond', 'fourDigitFirst', 'fourDigitSecond']) {
            if (updatedDraw[digitField] && updatedDraw[digitField].digit) {
                const digit = await Digit.findById(updatedDraw[digitField].digit);
                if (digit) {
                    // digit.articles = initializeOneDigit(updatedDraw[digitField].price)
                    let articleKeys = Object.keys(digit.articles)
                    
                    articleKeys.forEach(key => {
                        digit.articles[key] = Number(digit.articles[key]) + Number(updatedDraw[digitField].price) - Number(prevDraw[digitField].price)
                    })
                }
                digit.markModified('articles');
                await digit.save();
            }
        }
    } catch (err) {
        console.error("Error triggering dummy update in associated digits:", err);
    }
};

// const updateAssociatedDigits = async (updatedDraw, prevDraw) => {
//     try {
//         // Loop through each digit field and trigger a dummy update in the associated Digit model
//         for (const digitField of ['oneDigitFirst', 'oneDigitSecond', 'twoDigitFirst', 'twoDigitSecond', 'threeDigitFirst', 'threeDigitSecond', 'fourDigitFirst', 'fourDigitSecond']) {
//             if (updatedDraw[digitField] && updatedDraw[digitField].digit) {
//                 if (updatedDraw[digitField].price !== prevDraw[digitField].price) {
//                     const digit = await Digit.findById(updatedDraw[digitField].digit);
//                     if (digit) {
//                         switch (digitField) {
//                             case 'oneDigitFirst':
//                                 digit.articles = initializeOneDigit(updatedDraw[digitField].price)
//                                 break;
//                             case 'oneDigitSecond':
//                                 digit.articles = initializeOneDigit(updatedDraw[digitField].price)
//                                 break;
//                             case 'twoDigitFirst':
//                                 digit.articles = initializeTwoDigit(updatedDraw[digitField].price)
//                                 break;
//                             case 'twoDigitSecond':
//                                 digit.articles = initializeTwoDigit(updatedDraw[digitField].price)
//                                 break;
//                             case 'threeDigitFirst':
//                                 digit.articles = initializeThreeDigit(updatedDraw[digitField].price)
//                                 break;
//                             case 'threeDigitSecond':
//                                 digit.articles = initializeThreeDigit(updatedDraw[digitField].price)
//                                 break;
//                             case 'fourDigitFirst':
//                                 digit.articles = initializeFourDigit(updatedDraw[digitField].price)
//                                 break;
//                             case 'fourDigitSecond':
//                                 digit.articles = initializeFourDigit(updatedDraw[digitField].price)
//                                 break;
//                             default:
//                         }
//                         await digit.save();
//                     }
//                 }
//             }
//         }

//     } catch (err) {
//         console.error("Error triggering dummy update in associated digits:", err);
//     }
// };
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
        const draws = await Draw.find({})
        // const draws = await Draw.find({})
        //     .populate('oneDigitFirst.digit oneDigitSecond.digit twoDigitFirst.digit twoDigitSecond.digit threeDigitFirst.digit threeDigitSecond.digit fourDigitFirst.digit fourDigitSecond.digit')
        //     .exec();

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
        .populate('oneDigitFirst.digit oneDigitSecond.digit twoDigitFirst.digit twoDigitSecond.digit threeDigitFirst.digit threeDigitSecond.digit fourDigitFirst.digit fourDigitSecond.digit')
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
