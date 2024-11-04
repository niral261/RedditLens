const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config()

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch(error) {
        console.error('MongoDB connection failed', error.message);
    }
};

module.exports = connectDB