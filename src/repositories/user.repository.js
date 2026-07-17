import User from '../models/user.model.js'

class UserRepository {
  findByEmail(email, { includePassword = false } = {}) {
    const query = User.findOne({ email: email.toLowerCase() })
    return includePassword ? query.select('+passwordHash') : query
  }

  findById(id, { includeResetVersion = false } = {}) {
    const query = User.findById(id)
    return includeResetVersion ? query.select('+passwordResetVersion') : query
  }

  create(data) {
    return User.create(data)
  }

  updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  }

  updatePassword(id, passwordHash) {
    return User.findByIdAndUpdate(
      id,
      { $set: { passwordHash }, $inc: { passwordResetVersion: 1 } },
      { new: true, runValidators: true },
    )
  }

  deleteById(id) {
    return User.findByIdAndDelete(id)
  }

  listVerified({ excludeUserId, search = '' }) {
    const filters = {
      _id: { $ne: excludeUserId },
      emailVerified: true,
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const expression = new RegExp(escapedSearch, 'i')
      filters.$or = [{ displayName: expression }, { email: expression }]
    }

    return User.find(filters)
      .sort({ displayName: 1 })
      .limit(50)
  }

  findVerifiedByIds(ids) {
    return User.find({ _id: { $in: ids }, emailVerified: true })
  }
}

export default new UserRepository()
