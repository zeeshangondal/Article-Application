const { createDraw, getDrawById, updateDraw, deleteDraw, getAllDraws } = require("../Controller/drawController");

const drawRouter = require("express").Router();

drawRouter.get("/:id", getDrawById);
drawRouter.post("/", createDraw);
drawRouter.patch("/:id", updateDraw);
drawRouter.delete("/:id", deleteDraw);
drawRouter.get("/", getAllDraws);

module.exports = drawRouter;
