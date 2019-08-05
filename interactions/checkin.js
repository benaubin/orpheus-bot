const { getInfoForUser } = require('../utils.js')

const interactionCheckin = (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    if (err) {
      console.log(err)
    }

    convo.addMessage({
      delay: 500,
      text: `Give me a sec... let me pull up my database`
    }, 'loading')
    convo.addMessage({
      delay: 1000,
      text: `*typewriter noises*`
    }, 'loading')

    convo.addMessage('What day was it on?', 'date')

    convo.addQuestion({
      text: 'When was your meeting?',
      blocks: [{
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "(You can tell me a date in `YYYY-MM-DD` format, or click a shortcut button"
          }
        },
        {
          "type": "actions",
          "elements": [{
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": `Today (${new Date(Date.now()).toLocaleDateString('en-us', { weekday: 'long' })})`
            },
            "value": "today"
          }]
        }
      ]
    }, [{
        pattern: 'today',
        callback: (response, c) => {
          console.log('*User met today*')
          bot.replyInteractive(response, '_You tell orpheus you met today_')
          convo.say(`Ok, I'll record that you met today, *${new Date(Date.now()).toLocaleDateString()}*`)
          convo.gotoThread('attendance')
        }
      },
      {
        default: true,
        callback: (response, convo) => {
          console.log(response, convo)
          convo.repeat()
        }
      }
    ], {}, 'date')

    convo.addQuestion(`How many people showed up? (please just enter digits– I'm fragile)`, (response, c) => {
      const attendance = +response.text
      console.log(attendance, response, c)

      convo.say(`I parsed that as *${attendance}* hackers`)
      convo.gotoThread('')
    }, {}, 'attendance')

    convo.activate()
    convo.gotoThread('loading')

    getInfoForUser(message.user).then(({
      leader,
      club,
      history
    }) => {
      if (!leader || !club) {
        convo.say({
          delay: 2000,
          text: `I don't have any record of you being a club leader (ಠ_ಠ)`
        })
        convo.stop()
      } else {
        convo.addMessage({
          delay: 2000,
          text: `Found you! It's *${leader.fields['Full Name']}*, right?`
        }, 'found')
        convo.addMessage({
          delay: 2000,
          text: `From ${club.fields['Name']}`,
          action: 'date'
        }, 'found')

        convo.gotoThread('found')
      }
    })
  })
}

module.exports = interactionCheckin