const Draw = require("../Models/Draw");

// Create a new draw
let createDraw = async (req, res) => {
    try {
        const { title, drawDate, drawTime, drawStatus, oneDigitFirst, oneDigitSecond, twoDigitFirst, twoDigitSecond, threeDigitFirst, threeDigitSecond, fourDigitFirst, fourDigitSecond } = req.body;
        console.log(req.body)
        const draw = new Draw({...req.body});

        const createdDraw = await draw.save();

        res.status(201).send({ message: "Draw created successfully", draw: createdDraw });
    } catch (error) {
        console.error("Error creating draw", error);
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

// Get all draws
let getAllDraws = (req, res) => {
    Draw.find({})
        .then((draws) => {
            res.status(200).send({ draws });
        })
        .catch(err => {
            res.status(500).send({ message: "Error", err });
        });
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
