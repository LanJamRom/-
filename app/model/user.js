'use strict'

module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const UserSchema = new Schema({
    email: { type: String, required: true},
    psw: { type: String, required: true},
    nickname: { type: String, required: true},
    avatar: { type: String, required: false, default: 'default.png'}
  }, { timestamps: true })

  return mongoose.model('User', UserSchema)
}