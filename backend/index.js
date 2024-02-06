// SECRET_KEY=614E645267556B58703272357538782F413F4428472B4B6250655368566D5971337436763979244226452948404D635166546A576E5A7234753778217A25432A

// DB_URL=mongodb+srv://zeeshanaligondal0777:asdfg12345@cluster0.2ugz8kv.mongodb.net/Article_DB


const express = require("express");
const mongoose = require("mongoose")
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');


const app = express();


// Increase the limit (default is 100kb)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json())
require("dotenv").config();
const cors = require("cors")

const userRouter = require("./Routes/userRoutes");
const drawRouter = require("./Routes/drawRoutes");
const digitRouter = require("./Routes/digitRoutes");

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use('/user', userRouter)
app.use('/draw', drawRouter)
app.use('/article', digitRouter)



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/savePdf', upload.single('pdfContent'), (req, res) => {
    try {
        const pdfContent = req.file.buffer;
        const uniqueKey = uuidv4(); // Generate a unique key
        const pdfFileName = `pdf_${uniqueKey}.pdf`;
        const saveDirectory = '/uploads';
        const filePath = path.join(__dirname, saveDirectory, pdfFileName);
        fs.writeFileSync(filePath, pdfContent);
        const pdfLink = `http://localhost:3005/reports/${pdfFileName}`;
        res.json({ pdfLink });
    } catch (error) {
        console.error('Error saving the PDF:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/reports/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'uploads', fileName);

    // Send the file back as a response without triggering a download
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending the PDF:', err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});


app.use(express.static(path.join(__dirname, 'build')));

// For all other requests, serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


app.listen(process.env.PORT || 3005, () => {
    console.log(`App Listning at Port 3005`)
})


mongoose.connect(process.env.DB_URL).then(err => {
    console.log("Connected")
})