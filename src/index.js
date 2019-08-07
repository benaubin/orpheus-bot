process.env.STARTUP_TIME = Date.now()
import Botkit from 'botkit'
import redisStorage from 'botkit-storage-redis'
import _ from 'lodash'

import { getAllClubs } from './utils'

import checkinInteraction from './interactions/checkin'
import dateInteraction from './interactions/date'
import infoInteraction from './interactions/info'
import statsInteraction from './interactions/stats'
import helloInteraction from './interactions/hello'
import triggerInteraction from './interactions/trigger'

const controller = new Botkit.slackbot({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  clientSigningSecret: process.env.SLACK_CLIENT_SIGNING_SECRET,
  scopes: ['bot', 'chat:write:bot'],
  storage: redisStorage({ url: process.env.REDISCLOUD_URL })
})

const initBot = () => (
  // we need to create our "bot" context for interactions that aren't initiated by the user.
  // ex. we want to send a "hello world" message on startup w/o waiting for a user to trigger it.
  controller.spawn({
    token: process.env.SLACK_BOT_TOKEN
  })
)

controller.startTicking()

controller.setupWebserver(process.env.PORT, function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver)
  controller.createOauthEndpoints(controller.webserver)
})

const init = (bot=initBot()) => {
  const reply = _.sample([
    '_out of the ashes a small dinosaur pops its head out of the ground. the cycle goes on_',
    '_the cracks in the egg gave way to a small head with curious eyes. the next iteration sets its gaze upon the world_'
  ])
  bot.say({
    text: reply,
    channel: 'C0P5NE354' // #bot-spam
  })
}
init()

controller.hears('thump thump', 'ambient', (b, m) => {
  console.log('*orpheus hears her heart beat in her chest*')

  b.api.reactions.add({
    timestamp: m.tx,
    channel: m.channel,
    name: 'white_check_mark'
  })

  getAllClubs().then(clubs => clubs.forEach(club => {
    const day = club.fields['Checkin Day']
    const hour = club.fields['Checkin Hour']
    const channel = club.fields['Slack Channel ID']

    if (!day) { return }
    if (!hour) { return }
    if (!channel) { return }

    const bot = initBot()
    const message = { channel }

    // triggerInteraction(bot, message)
    console.log(`*starting checkin w/ club in channel ${channel}*`)
    checkinInteraction(bot, message)
  }))
})

controller.hears('checkin', 'direct_message,direct_mention', (bot, message) => {
  bot.replyInThread(message, "I'll send you a check-in right now!")

  checkinInteraction(bot, message)
})

controller.hears('date', 'direct_mention', dateInteraction)

controller.hears('info', 'direct_message,direct_mention', infoInteraction)

controller.on('slash_command', (bot, message) => {
  const { command, user } = message
  console.log(`Received ${command} command from user ${user}`)

  switch (command) {
    case '/stats':
      statsInteraction(bot, message)
      break
  
    default:
      bot.replyPrivate(message, `I don't know how to do that ¯\_(ツ)_/¯`)
      break
  }
})

controller.hears('hello', 'ambient', helloInteraction)

// catch-all
controller.hears('.*', 'direct_message,direct_mention', (bot, message) => {
  const { text, user } = message

  // ignore threaded messages
  if (_.has(message.event, 'parent_user_id')) return

  if (Math.random() > 0.5) {
    const response = _.sample([
      `*slowly blinks one eye*`,
      `*stares off into the distance, dazed*`,
      `*eyes slowly glaze over in boredom*`,
      `*tilts head in confusion*`,
      `*UWU*`
    ])

    bot.replyInThread(message, response)
  } else {
    bot.api.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name: _.sample([
        'parrot_confused',
        'confused-dino',
        'question',
        'grey_question'
      ]),
    }, (err, res) => {
      if (err) console.error(err)
    })
  }
})