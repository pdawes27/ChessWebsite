const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const port = 5000;

app.use("/computer", require("./computerMove.js"));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});