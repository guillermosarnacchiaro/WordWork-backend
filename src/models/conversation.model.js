import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['private', 'group'], default: 'private' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    privateKey: { type: String, required: true, unique: true, index: true },
    name: { type: String, trim: true, minlength: 2, maxlength: 60, default: null },
    description: { type: String, trim: true, maxlength: 250, default: '' },
    avatarUrl: { type: String, trim: true, maxlength: 500, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
)

conversationSchema.index({ participants: 1, lastMessageAt: -1 })

conversationSchema.pre('validate', function validateConversation() {
  if (this.type === 'private' && !this.privateKey) this.invalidate('privateKey', 'La conversación privada requiere una clave')
  if (this.type === 'group' && !this.name) this.invalidate('name', 'El grupo requiere un nombre')
})

export default mongoose.model('Conversation', conversationSchema)
