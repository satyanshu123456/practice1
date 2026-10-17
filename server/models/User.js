const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide a valid email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
      required: false,
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    authMethod: {
      type: String,
      enum: ['password', 'email-otp', 'google'],
      default: 'password',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Profile Fields (Name, Bio, Profile Picture URL, Skills, Title, Location, Phone)
    bio: {
      type: String,
      default: '',
      maxlength: [300, 'Bio cannot exceed 300 characters'],
    },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    title: {
      type: String,
      default: 'Collaborator',
    },
    location: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
