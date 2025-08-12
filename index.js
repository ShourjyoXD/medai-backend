const express = require('express');
const connectDB = require('./config/db'); 
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Connect to the database
connectDB();

app.use(express.json());


app.get('/', (req, res) => {
  res.send('MedAI API is running...');
});



const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});