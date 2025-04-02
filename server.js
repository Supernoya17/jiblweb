// server.js - Main server file for JiblWeb
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jiblweb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
// Contact Form Model
const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Contact = mongoose.model('Contact', ContactSchema);

// User model for admin authentication
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);

// Middleware for authentication
const auth = (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecretkey');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Routes
// Contact form submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        // Create new contact entry
        const newContact = new Contact({
            name,
            email,
            message
        });

        // Save to database
        await newContact.save();

        res.status(200).json({ msg: 'Your message has been sent successfully!' });
    } catch (err) {
        console.error('Error saving contact form:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// User authentication
// Register admin (should be protected in production)
app.post('/api/admin/register', async (req, res) => {
    try {
        const { username, password, adminSecret } = req.body;
        
        // Verify admin secret
        if (adminSecret !== (process.env.ADMIN_SECRET || 'jibladminsecret')) {
            return res.status(403).json({ msg: 'Invalid admin secret' });
        }

        // Check if user already exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            password,
            isAdmin: true
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user
        await user.save();

        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                isAdmin: user.isAdmin
            }
        };

        // Sign token
        jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'jwtsecretkey',
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('Error registering admin:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                isAdmin: user.isAdmin
            }
        };

        // Sign token
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'jwtsecretkey',
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get current user
app.get('/api/admin/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error('Error getting user:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Admin routes
// Get all contact messages
app.get('/api/admin/contacts', [auth, isAdmin], async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (err) {
        console.error('Error getting contacts:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update contact status
app.put('/api/admin/contacts/:id', [auth, isAdmin], async (req, res) => {
    try {
        const { status } = req.body;
        
        // Find contact by ID and update
        const updatedContact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updatedContact) {
            return res.status(404).json({ msg: 'Contact not found' });
        }

        res.json(updatedContact);
    } catch (err) {
        console.error('Error updating contact:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete contact
app.delete('/api/admin/contacts/:id', [auth, isAdmin], async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({ msg: 'Contact not found' });
        }

        await contact.remove();
        res.json({ msg: 'Contact removed' });
    } catch (err) {
        console.error('Error deleting contact:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get contact statistics
app.get('/api/admin/stats', [auth, isAdmin], async (req, res) => {
    try {
        const totalContacts = await Contact.countDocuments();
        const newContacts = await Contact.countDocuments({ status: 'new' });
        const repliedContacts = await Contact.countDocuments({ status: 'replied' });
        const archivedContacts = await Contact.countDocuments({ status: 'archived' });
        
        // Get contacts for the last 7 days
        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        
        const contactsLastWeek = await Contact.countDocuments({
            createdAt: { $gte: lastWeekDate }
        });
        
        // Get contacts for the previous week for comparison
        const twoWeeksAgoDate = new Date();
        twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 14);
        
        const contactsPreviousWeek = await Contact.countDocuments({
            createdAt: { 
                $gte: twoWeeksAgoDate, 
                $lt: lastWeekDate 
            }
        });
        
        // Calculate growth rate
        const growthRate = contactsPreviousWeek === 0 
            ? 100 
            : ((contactsLastWeek - contactsPreviousWeek) / contactsPreviousWeek) * 100;
        
        res.json({
            totalContacts,
            newContacts,
            repliedContacts,
            archivedContacts,
            contactsLastWeek,
            growthRate: Math.round(growthRate)
        });
    } catch (err) {
        console.error('Error getting stats:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Serve the admin dashboard for any admin routes
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Serve the main website for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Create initial admin user if none exists
const createInitialAdmin = async () => {
    try {
        const adminExists = await User.findOne({ isAdmin: true });
        
        if (!adminExists) {
            const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(defaultPassword, salt);
            
            const admin = new User({
                username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
                password: hashedPassword,
                isAdmin: true
            });
            
            await admin.save();
            console.log('Default admin user created');
        }
    } catch (err) {
        console.error('Error creating initial admin:', err);
    }
};

// Call the function after MongoDB connection is established
mongoose.connection.once('open', createInitialAdmin);