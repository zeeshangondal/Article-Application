const Draw = require("../Models/Draw");

// Create a new draw
let createDraw = async (req, res) => {
    try {
        const { title, drawDate, drawTime, drawStatus, oneDigitFirst, oneDigitSecond, twoDigitFirst, twoDigitSecond, threeDigitFirst, threeDigitSecond, fourDigitFirst, fourDigitSecond, drawExpired } = req.body;
        const draw = new Draw({ ...req.body });
        const createdDraw = await draw.save();

        res.status(201).send({ message: "Draw created successfully", draw: createdDraw });
    } catch (error) {
        console.error("Error creating draw");
        res.status(500).send({ message: "Error", error });
    }
};

// Update a draw
let updateDraw = (req, res) => {
    let _id = req.params.id;
    let updates = req.body;

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
        const draws = await Draw.find({});

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
