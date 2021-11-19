const Discord = require('discord.js')
const axios = require('axios')

require('dotenv').config()

const config = require('../config.json')

let prefix = config.prefix
const lock = false

module.exports = {
    chess: async message => {
        message.channel.send({content: '♟ Prefix for chess is specified as `c!`, type `c! help` for more ight'})
    },
    
    help: async message => {
        message.channel.send({ embeds: [new Discord.MessageEmbed()
            .setColor('#DD6E0F')
            .setTitle('Hanako')
            .setAuthor('', 'https://i.imgur.com/RZKGQ7z.png')
            .setDescription('created by shotgun#4239, written in JS')
            .setThumbnail('https://i.imgur.com/RZKGQ7z.png')
            .addFields(
            { name: '​', value: '💭 **Current prefix:** '+prefix+'\n'+`
            -------------------------------
            **help** - Show this message
            **prefix** - Set a new prefix for me
    
            **8ball** - Answer your questions [y/n]
            **chess** - Info about chess
            **compile** - Code compiler
            **mcskin** - Show skin of a Minecraft player (not good rn)
            **achieve** - Achievement got!
            **ms** - Get a Minecraft server's status
            **gato** - Random gato picture
            **wa** - wa?!
            `
            }),
        new Discord.MessageEmbed()
          .setColor('#DD6E0F')
            .setTitle('🎶 Music commands')
            .addFields(
            { name: '​', value: `
            **filter** - Set a sound filter
            **find** - Give me a song lyrics and I'll find the song
            **lyrics** - Display the current sound's lyrics
            **play** - Play a sound or add into queue
            **pause/resume** - Pause/Resume the current queue (unstable)
            **remove** - Remove a song in given position from the queue
            **queue** - Show the current queue
            **skip** - Skip to the next sound in queue
            **stop** - Stop the playing sound
            **volume** - Set the bot's volume
            -------------------------------
            `
            })
            .setTimestamp()
            .setFooter('ight have fun')
        ]})
    },
    
    prefix: async (message, arg2) => {
        if (arg2) {
            if (arg2 === 'c!') return message.channel.send({content: '⚠♟ `c!` is preserved for chess game! Type `c! help` for more,.'})
            
            config.prefix = arg2
            prefix = config.prefix

            message.channel.send({content: '❗ My prefix is now changed to `'+arg2+'`\n❗ In case you forgot what the prefix is, see what I\'m listening to!'})
            if (arg2 == 'default') {
                message.channel.send({content: '⚠ Note: it will literally be `default`, **__not__** `oi`.'})
            }
            message.client.user.setActivity(prefix + ' help', { type: "LISTENING" })
        } else {
            message.channel.send({content: 'Current prefix: `'+prefix+'`\nTo change prefix, type `'+prefix+'` prefix [new-prefix]`\n\n❗ In case you forgot what the prefix is,  see what I\'m listening to!'})
        }
    },

    gato: async(message) => {
        axios.get('https://aws.random.cat/meow?ref=apilist.fun')
        .then(res => {
            message.channel.send({ embeds: [new Discord.MessageEmbed()
                .setColor('#DD6E0F')
                .setTitle('gato')
                .setImage(res.data.file)
            ]})
        })
    },

    wa: async(message) => {
      if (lock) return message.channel.send({content: 'noj,,,'})
      axios.get('https://api.waifu.pics/sfw/waifu')
        .then(res => {
            if (message.channel.nsfw) {
              message.channel.send({ embeds: [new Discord.MessageEmbed()
                .setColor('#DD6E0F')
                .setTitle('wa')
                .setImage(res.data.url)
              ]})
            } else {
              message.channel.send({content: 'Oui, nsfw channel only!'})
            }
        })
    },

    '8ball': async(message) => {
      axios.get(process.env.S_API_B1)
        .then(res => message.channel.send({content: res.data[0].reply}))
    },

    msgSplit: (msg) => {
      return [
        msg.substring(0, 2000),
        msg.substring(2000, msg.length)
      ]
    }
}