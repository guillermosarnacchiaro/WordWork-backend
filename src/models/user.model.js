import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false },
    verificationEmailSentAt: { type: Date, default: null },
    passwordResetEmailSentAt: { type: Date, default: null },
    passwordResetVersion: { type: Number, default: 0, select: false },
    avatarUrl: { type: String, default: null },
    bio: { type: String, trim: true, maxlength: 140, default: 'Disponible' },
    availability: {
      type: String,
      enum: ['available', 'busy', 'away'],
      default: 'available',
    },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
)

export default mongoose.model('User', userSchema)
