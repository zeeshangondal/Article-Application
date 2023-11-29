const express = require("express");
const mongoose = require("mongoose")
const app = express();

app.use(express.json())
require("dotenv").config();
const cors = require("cors")

const userRouter = require("./Routes/userRoutes");
const drawRouter = require("./Routes/drawRoutes");

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use('/user', userRouter)
app.use('/draw', drawRouter)

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'))
// })

app.listen(process.env.PORT || 3005, () => {
    console.log(`App Listning at Port 3005`)
})


mongoose.connect(process.env.DB_URL).then(err => {
    console.log("Connected")
})