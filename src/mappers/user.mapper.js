export function toPublicUser(user) {
  const lastSeenAt = user.lastSeenAt || null
  const isOnline = lastSeenAt
    ? Date.now() - new Date(lastSeenAt).getTime() < 2 * 60 * 1000
    : false

  return {
    id: String(user._id),
    display_name: user.displayName,
    email: user.email,
    email_verified: user.emailVerified,
    avatar_url: user.avatarUrl,
    bio: user.bio,
    availability: user.availability,
    presence: isOnline ? 'online' : 'offline',
    last_seen_at: lastSeenAt,
    created_at: user.createdAt,
  }
}
