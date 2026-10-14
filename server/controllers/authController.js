const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const { sendOtpEmail } = require('../config/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      bio: bio || '',
      avatarUrl: avatarUrl || undefined,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s) => s.trim()) : []),
      title: title || 'Collaborator',
      location: location || '',
      phoneNumber: phoneNumber || '',
      authMethod: 'password',
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

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
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

// @desc Update user profile fields
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

// @desc Send OTP for direct email authentication
// @route POST /api/auth/send-email-otp
exports.sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    const isNewUser = !existingUser;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await EmailOtp.deleteMany({ email: normalizedEmail });
    await EmailOtp.create({ email: normalizedEmail, otp, expiresAt });

    const result = await sendOtpEmail(normalizedEmail, otp);

    res.json({
      message: `Authentication code sent to ${normalizedEmail}`,
      email: normalizedEmail,
      isNewUser,
      devOtp: result.mode === 'console' ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Verify OTP to create account or log in directly
// @route POST /api/auth/verify-email-otp
exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp, name } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOtp = otp.toString().trim();

    const otpRecord = await EmailOtp.findOne({ email: normalizedEmail });
    if (!otpRecord) {
      return res.status(400).json({ message: 'No verification code found or it has expired. Please request a new code.' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await EmailOtp.deleteMany({ email: normalizedEmail });
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    if (otpRecord.otp !== normalizedOtp) {
      return res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
    }

    await EmailOtp.deleteMany({ email: normalizedEmail });

    let user = await User.findOne({ email: normalizedEmail });
    let createdNew = false;

    if (!user) {
      const derivedName = name?.trim() || normalizedEmail.split('@')[0].replace(/[._]/g, ' ');
      const capitalizedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

      user = await User.create({
        name: capitalizedName,
        email: normalizedEmail,
        authMethod: 'email-otp',
        isEmailVerified: true,
        title: 'Collaborator',
      });
      createdNew = true;
    } else {
      user.isEmailVerified = true;
      await user.save();
    }

    res.status(createdNew ? 201 : 200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      skills: user.skills,
      title: user.title,
      location: user.location,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
      message: createdNew
        ? 'Account created and authenticated successfully!'
        : 'Logged in successfully!',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Authenticate with Google OAuth (Sign Up or Sign In)
// @route POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential token is required' });
    }

    let payload;
    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        payload = jwt.decode(credential);
      }
    } catch (verifyErr) {
      payload = jwt.decode(credential);
      if (!payload || !payload.email) {
        return res.status(401).json({ message: 'Invalid Google authentication token' });
      }
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ message: 'Unable to extract Google account information' });
    }

    const { email, name, picture, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({
      $or: [{ email: normalizedEmail }, { googleId }],
    });

    let createdNew = false;
    if (!user) {
      user = await User.create({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        avatarUrl: picture || undefined,
        googleId,
        authMethod: 'google',
        isEmailVerified: true,
        title: 'Collaborator',
      });
      createdNew = true;
    } else {
      if (!user.googleId) user.googleId = googleId;
      user.isEmailVerified = true;
      if (!user.avatarUrl || user.avatarUrl.includes('unsplash')) {
        if (picture) user.avatarUrl = picture;
      }
      await user.save();
    }

    res.status(createdNew ? 201 : 200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      skills: user.skills,
      title: user.title,
      location: user.location,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
      message: createdNew
        ? 'Account successfully created with Google!'
        : 'Logged in with Google successfully!',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
