const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const nodeRoutes = require('./routes/nodeRoutes');
const edgeRoutes = require('./routes/edgeRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const eventRoutes = require('./routes/eventRoutes');
const qrRoutes = require('./routes/qrRoutes');
const authRoutes = require('./routes/authRoutes');
const floorRoutes = require('./routes/floorRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/edges', edgeRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/floors', floorRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Campus Navigation API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
