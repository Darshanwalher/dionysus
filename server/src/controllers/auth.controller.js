const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ success: true, data: { user, token } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile (name, email, avatar)
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const userId = req.user._id;

    // If email is changing, check uniqueness
    if (email && email !== req.user.email) {
      const conflict = await User.findOne({ email, _id: { $ne: userId } });
      if (conflict) {
        return res.status(400).json({ success: false, message: 'Email is already taken' });
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { ...(name && { name }), ...(email && { email }), ...(avatar !== undefined && { avatar }) },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password +githubId');

    // If user has a password already, verify current password
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }
    // Otherwise (GitHub-only user) allow setting password for the first time

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate GitHub OAuth
// @route   GET /api/auth/github
const githubAuth = async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;
  // If the user is already logged in they pass their JWT as link_token so we can link the account
  const linkToken = req.query.link_token || '';
  const state = Buffer.from(JSON.stringify({ linkToken })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'read:user user:email repo',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

// @desc    GitHub OAuth callback
// @route   GET /api/auth/github/callback
const githubCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // 1. Exchange code for access token
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    });
    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.redirect(`${clientUrl}/settings?github=error`);
    }

    // 2. Fetch GitHub user profile
    const [ghUserResp, ghEmailsResp] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
      }),
    ]);

    const ghUser = await ghUserResp.json();
    const ghEmails = await ghEmailsResp.json();
    const primaryEmail = Array.isArray(ghEmails)
      ? (ghEmails.find((e) => e.primary && e.verified) || ghEmails[0])?.email
      : ghUser.email;

    // 3. Parse state to check for link_token
    let linkToken = null;
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      linkToken = parsed.linkToken || null;
    } catch (_) {}

    // 4a. If a logged-in user wants to LINK their GitHub account
    if (linkToken) {
      try {
        const decoded = jwt.verify(linkToken, process.env.JWT_SECRET);
        await User.findByIdAndUpdate(decoded.id, {
          githubId: String(ghUser.id),
          githubUsername: ghUser.login,
          githubAvatar: ghUser.avatar_url,
          githubAccessToken: accessToken,
          githubConnectedAt: new Date(),
        });
        return res.redirect(`${clientUrl}/settings?github=linked`);
      } catch (_) {
        // Invalid token — fall through to login flow
      }
    }

    // 4b. OAuth login / register flow
    let user = await User.findOne({ githubId: String(ghUser.id) }).select('+githubAccessToken');

    if (!user && primaryEmail) {
      // Try to find by email and link
      user = await User.findOne({ email: primaryEmail });
    }

    if (user) {
      // Update GitHub fields
      await User.findByIdAndUpdate(user._id, {
        githubId: String(ghUser.id),
        githubUsername: ghUser.login,
        githubAvatar: ghUser.avatar_url,
        githubAccessToken: accessToken,
        githubConnectedAt: new Date(),
      });
    } else {
      // Create brand-new GitHub user (no password required)
      user = await User.create({
        name: ghUser.name || ghUser.login,
        email: primaryEmail || `${ghUser.login}@github-noemail.local`,
        avatar: ghUser.avatar_url || '',
        githubId: String(ghUser.id),
        githubUsername: ghUser.login,
        githubAvatar: ghUser.avatar_url,
        githubAccessToken: accessToken,
        githubConnectedAt: new Date(),
      });
    }

    const jwtToken = generateToken(user._id);
    return res.redirect(`${clientUrl}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect GitHub account
// @route   DELETE /api/auth/github
const disconnectGithub = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Set a password before disconnecting GitHub (you need at least one login method)',
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $unset: { githubId: '', githubUsername: '', githubAvatar: '', githubAccessToken: '', githubConnectedAt: '' },
    });

    res.json({ success: true, message: 'GitHub account disconnected' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, updatePassword, githubAuth, githubCallback, disconnectGithub };
