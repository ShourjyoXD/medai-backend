// config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options are recommended for new connections, though some might be deprecated in future Mongoose versions
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true, // Deprecated in Mongoose 6+
      // useFindAndModify: false // Deprecated in Mongoose 6+
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Optional: Listen for connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose default connection open to ' + conn.connection.host);
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose default connection error: ' + err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose default connection disconnected');
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;