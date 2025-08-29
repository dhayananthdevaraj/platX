const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/results', require('./routes/results'));
app.use('/api/centers', require('./routes/centers'));
// app.use('/api/tests/:tid/questions', require('./routes/testQuestions'));

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://edutrackplatform:HIGHjump%40308@edutrackcluster.ky2r4me.mongodb.net/?retryWrites=true&w=majority&appName=EduTrackCluster';


mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {console.log('MongoDB connected successfully')
// .then(async () => 
  const superadmin = new User({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'SuperSecure123', // Will be hashed automatically
    role: 'superadmin',
    phone: '9999999999',
    avatar: 'https://example.com/avatar-admin.jpg'
  });
  await superadmin.save();
  console.log('Superadmin created successfully!');
})
// )
.catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});