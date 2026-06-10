const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: ['developer', 'tester'],
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  acceptedAt: Date,
}, {
  timestamps: true,
});

inviteSchema.index({ token: 1 });
inviteSchema.index({ organization: 1, email: 1 });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Invite', inviteSchema);
