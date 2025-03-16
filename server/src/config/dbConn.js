const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  });

// Export the connection
module.exports = mongoose.connection;