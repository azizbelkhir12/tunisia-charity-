const jwt = require("jsonwebtoken");
const Volunteer = require("../models/Volunteer"); // Renamed to use Volunteer model
const { getToken } = require('./token');

const auth = async (req, res, next) => {
  try {
    // 1. Check for token
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Find volunteer
    const volunteer = await Volunteer.findById(decoded.id);
    if (!volunteer) {
      return res.status(401).json({ message: "Volunteer not found" });
    }

    // 4. Attach volunteer to request
    req.volunteer = {
      id: volunteer._id,
      email: volunteer.email,
      role: volunteer.role,
      status: volunteer.status
    };

    next();
  } catch (err) {
    console.error(err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "Access denied, admin only" });
    }

    const admin = await Volunteer.findOne({ _id: decoded.id, role: 'admin' });
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.volunteer = {
      id: admin._id,
      email: admin.email,
      role: 'admin',
      status: admin.status
    };

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { auth, adminAuth };