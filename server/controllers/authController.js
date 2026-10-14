const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc Register user
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, bio, avatarUrl, skills, title, location, phoneNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    const user = await User.create({
      name,
      email,
      password,
      bio: bio || '',
      avatarUrl: avatarUrl || undefined,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s) => s.trim()) : []),
      title: title || 'Collaborator',
      location: location || '',
      phoneNumber: phoneNumber || '',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      skills: user.skills,
      title: user.title,
      location: user.location,
      phoneNumber: user.phoneNumber,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      skills: user.skills,
      title: user.title,
      location: user.location,
      phoneNumber: user.phoneNumber,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get current profile
// @route GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update user profile fields (5-6 fields: name, bio, avatar, skills, title, location, phone)
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.avatarUrl = req.body.avatarUrl || user.avatarUrl;
    user.title = req.body.title || user.title;
    user.location = req.body.location || user.location;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    if (req.body.skills !== undefined) {
      user.skills = Array.isArray(req.body.skills)
        ? req.body.skills
        : req.body.skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Upload profile image file
// @route POST /api/auth/upload-avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file to upload' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Store relative file path /uploads/...
    const avatarUrl = `/uploads/${req.file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({
      message: 'Profile image updated successfully',
      avatarUrl: user.avatarUrl,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

