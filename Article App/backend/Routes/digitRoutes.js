const {getFirstAndSecond, getAllDigits, getDigitById, updateDigit, deleteDigit, createDigit } = require("../Controller/digitController");

const digitRouter = require("express").Router();

digitRouter.post("/filtered", getFirstAndSecond);
digitRouter.get("/:id", getDigitById);
digitRouter.post("/", createDigit);
digitRouter.patch("/:id", updateDigit);
digitRouter.delete("/:id", deleteDigit);
digitRouter.get("/", getAllDigits);

module.exports = digitRouter;
