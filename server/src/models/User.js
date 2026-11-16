const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function () { return !this.githubId; },
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    // GitHub OAuth fields
    githubId: { type: String, sparse: true, index: true, default: null },
    githubUsername: { type: String, default: '' },
    githubAvatar: { type: String, default: '' },
    githubAccessToken: { type: String, select: false, default: null },
    githubConnectedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving - use 10 rounds for balanced performance and security
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  user.hasPassword = Boolean(this.password);
  delete user.password;
  delete user.githubAccessToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);
