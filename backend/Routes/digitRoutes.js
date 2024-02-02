const {getFirstAndSecond, getAllDigits, getDigitById, updateDigit, deleteDigit, createDigit, makeBulkPurchase } = require("../Controller/digitController");

const digitRouter = require("express").Router();

digitRouter.post("/filtered", getFirstAndSecond);
digitRouter.post("/make_bulk_purchase", makeBulkPurchase);

digitRouter.get("/:id", getDigitById);
digitRouter.post("/", createDigit);
digitRouter.patch("/:id", updateDigit);
digitRouter.delete("/:id", deleteDigit);
digitRouter.get("/", getAllDigits);

module.exports = digitRouter;
