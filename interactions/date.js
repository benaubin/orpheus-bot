const chrono = require('chrono')

const interactionDate = (bot, message) => {
  // bot.api.users.info({ user: message.user }, (err, res) => {
    const meetingDate = chrono.parse(message.text)
    bot.reply(message, `I parsed that as ${meetingDate}`)
  // }
}