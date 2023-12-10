const Digit = require("../Models/Digit");

// Create a new Digit
const createDigit = async (req, res) => {
    try {
        const { articles } = req.body;

        const digit = new Digit({ articles });

        const createdDigit = await digit.save();

        res.status(201).send({ message: "Digit created successfully", digit: createdDigit });
    } catch (error) {
        console.error("Error creating digit", error);
        res.status(500).send({ message: "Error", error });
    }
};

// Update an existing Digit
const updateDigit = async (req, res) => {
    const digitId = req.params.id;
    const updates = req.body;

    try {
        const updatedDigit = await Digit.findByIdAndUpdate(digitId, updates, { new: true });

        if (!updatedDigit) {
            return res.status(404).send({ message: "Digit not found" });
        }

        res.status(200).send({ message: "Digit updated", digit: updatedDigit });
    } catch (err) {
        res.status(500).send({ message: "Error", err });
    }
};

// Delete a Digit
const deleteDigit = (req, res) => {
    const digitId = req.params.id;

    Digit.findByIdAndDelete(digitId)
        .then((deletedDigit) => {
            if (!deletedDigit) {
                return res.status(404).send({ message: "Digit not found" });
            }
            res.status(200).send({ message: "Digit deleted", deletedDigit });
        })
        .catch((err) => {
            res.status(500).send({ message: "Error", err });
        });
};

// Get all Digits
const getAllDigits = (req, res) => {
    Digit.find({})
        .then((digits) => {
            res.status(200).send({ digits });
        })
        .catch((err) => {
            res.status(500).send({ message: "Error", err });
        });
};

// Get a Digit by ID
const getDigitById = (req, res) => {
    const digitId = req.params.id;

    Digit.findById(digitId)
        .then((digit) => {
            if (!digit) {
                return res.status(404).send({ message: "Digit not found" });
            }
            res.status(200).send({ digit });
        })
        .catch((err) => {
            res.status(500).send({ message: "Error", err });
        });
};

const getFirstAndSecond = async (req, res) => {
    const { firstDigitId, secondDigitId, bundle } = req.body;

    try {
        // Use Promise.all to concurrently fetch data for both digit IDs
        const [firstDigit, secondDigit] = await Promise.all([
            Digit.findById(firstDigitId),
            Digit.findById(secondDigitId)
        ]);

        // Check if both digits are found
        if (!firstDigit || !secondDigit) {
            const notFoundDigits = [];

            if (!firstDigit) {
                notFoundDigits.push(firstDigitId);
            }

            if (!secondDigit) {
                notFoundDigits.push(secondDigitId);
            }

            return res.status(404).send({ message: `Digits not found for IDs` });
        }
        const combinedData = {
            firstPrice: firstDigit.articles[bundle],
            secondPrice: secondDigit.articles[bundle],
            bundle
        };
        res.status(200).send({ message: "Data retrieved successfully", data: combinedData });
    } catch (err) {
        console.error("Error fetching digits:", err);
        res.status(500).send({ message: "Error", err });
    }
};

module.exports = {
    createDigit,
    updateDigit,
    deleteDigit,
    getAllDigits,
    getDigitById,
    getFirstAndSecond
};
