const { MessageEmbed } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders')
const { SpotifyPlugin } = require('@distube/spotify')
const { getLyrics } = require('genius-lyrics-api')
const { pagination } = require('reconlx')
const Distube = require('distube')
const ProgressBar = require('progress')
const LyricsSearch = require('@penfoldium/lyrics-search')

const { msgSplit, sendMessage, msgEdit } = require('../helper')

const findSong = new LyricsSearch(process.env.GENIUS_API)

let distube

module.exports = {
  _init(cli) {
    distube = new Distube.DisTube(cli, {
      nsfw: true,
      youtubeDL: false, 
      leaveOnEmpty: true,
      emitNewSongOnly: true,
      plugins: [new SpotifyPlugin()]
    })

    distube
      .on('finish', queue => queue.textChannel.send('😴 **Queue ended.**').then(m => { setTimeout(_ => m.delete(), 5000) }))
      .on('playSong', (queue, song) => queue.textChannel.send(`🎶 **${song.name}** - \`${song.formattedDuration}\` is now playing!`))
      .on('addSong', (queue, song) => {
        if (queue.songs.length > 1) queue.textChannel.send(`🎺 **${song.name}** - \`${song.formattedDuration}\` queued - Position ${queue.songs.length}`)
      })
      .on('error', (channel, err) => channel.send(`❌ Ah shite error: \`${err}\``))
  },

  filter: {
    slash: new SlashCommandBuilder()
      .setName('filter')
      .setDescription('Apply or remove a filter')
      .addStringOption(option => option
        .setName('filter')
        .setDescription('Example: bassboost')
        .setRequired(true))
      .toJSON(),

    args: 'filter',

    async execute(message, arg2, main) {
      if (!message.member.voice.channel) return sendMessage(message, 'Enter a voice channel bu')
      if (!distube.getQueue(message)) return sendMessage(message, '\\🌫 Oui play some sound to set filter ight')
      if (!arg2) return sendMessage(message, `🌫 You can set the filter with: \`3d | bassboost | echo | karaoke | nightcore | vaporwave | flanger | gate | haas | reverse | surround | mcompand | phaser | tremolo | earwax\`\n\nExample: \`oi filter reverse\`\nMention the filter type again to turn that filter off uwu`)

      const filters = main.substr(7, main.length).match(/\w+/gm)

      const filter = await distube.setFilter(message, filters)
      return sendMessage(message, `🌫 Filter is now set to \`${filter || 'off'}\`! Wait me apply..,`)
    }
  },

  find: {
    slash: new SlashCommandBuilder()
      .setName('find')
      .setDescription('Find a song based on lyrics')
      .addStringOption(option => option
        .setName('lyrics')
        .setDescription('Example: how you want me to')
        .setRequired(true))
      .toJSON(),

    args: 'lyrics',

    async execute(message, arg2, main) {
      if (!arg2) return sendMessage(message, `🔎 Provide some lyrics!! Example: \`oi find how you want me to\``)

      findSong.search(main.substr(4, main.length)).then(res => {
        const info = res.fullTitle.split('by')
        message.reply({
          embeds: [new MessageEmbed()
            .setColor('#DD6E0F')
            .setTitle(info[0])
            .setDescription('by' + info[1])
            .setAuthor('Song:')
            .setThumbnail(res.primaryArtist.header)
            .addFields( { name: '​', value: `[About song](${res.url})\n[About author](${res.primaryArtist.url})` } )
            .setImage(res.songArtImage)
          ],
          allowedMentions: { repliedUser: false }
        })
      }).catch(e => sendMessage(message, `❌ Request error: ${e}`))
    }
  },

  jump: {
    slash: new SlashCommandBuilder()
      .setName('jump')
      .setDescription('Jump to a position in the queue')
      .addStringOption(option => option
        .setName('position')
        .setDescription('Position of the track')
        .setRequired(true))
      .toJSON(),

    args: 'position',

    async execute(message, arg2) {
      if (!message.member.voice.channel) return sendMessage(message, 'Enter a voice channel bu')

      if (!arg2) return sendMessage(message, '🦘 Jump to where?')

      await distube.jump(message, parseInt(arg2) - 1).catch(_ => sendMessage(message, 'The given position does not exist!'))
      sendMessage(message, `➡ Jumped to position ${arg2}!`)
    }
  },

  lyrics: {
    slash: new SlashCommandBuilder()
      .setName('lyrics')
      .setDescription('Get the current track\'s lyrics (if available)')
      .toJSON(),

    async execute(message) {
      const queue = distube.getQueue(message)
      if (!queue) return sendMessage(message, '🕳 Play a sound so I can get the lyrics aight')

      let data = queue.songs[0].name.split(' - ')
      const songName = (!data[1] ? data[0] : data[1]).replace(/\([^)]*\)/gm, '')
      const artist = data[0].replace(/\([^)]*\)/gm, '');

      const options = {
        apiKey: process.env.GENIUS_API,
        title: songName,
        artist: artist,
        optimizeQuery: true
      }

      const status = await sendMessage(message, `Getting lyrics for ${songName}`)

      getLyrics(options).then(res => {
        if (!res) return msgEdit(status, 'Could not find any lyrics!')

        msgSplit(res).forEach(lyricPart => {
          if (lyricPart || lyricPart.length > 0) return message.channel.send(lyricPart)
        })
      }).catch(err => msgEdit(status, err))
    }
  },

  loop: {
    slash: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Set repeat/loop mode')
        .addStringOption(option => option
          .setName('mode')
          .setDescription('on | off | queue | n (loop the current track n times)')
          .setRequired(false))
        .toJSON(),
  
      args: 'mode',
  
    async execute(message, arg2) {
      const queue = distube.getQueue(message)
  
      if (!message.member.voice.channel) return sendMessage(message, '🙄 Join voice channel to repeat listening.,')
      if (!queue) return sendMessage(message, '🕳 No track currently,,')
  
      if (!arg2 || arg2 == 'on') {
        await distube.setRepeatMode(message, 1)
        sendMessage(message, '🔁 Current song is on repeat ight!')
      } else if (arg2 == 'off') {
        await distube.setRepeatMode(message, 0)
        sendMessage(message, '🔁 Repeat mode is now `off`.')
      } else if (arg2 == 'q' || arg2 == 'queue') {
        await distube.setRepeatMode(message, 2)
        sendMessage(message, '🔁 Current queue is now on repeat!')
      } else if (parseInt(arg2) > 0) {
        const repeatAmount = parseInt(arg2)
        for (let i = 1; i <= repeatAmount; i++, queue.songs.splice(1, 0, queue.songs[0]));
  
        sendMessage(message, `🔁 Current song will repeat for \`${arg2}\` times k`)
      }
    }
  },

  play: {
    slash: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Play a track')
      .addStringOption(option => option
        .setName('title')
        .setDescription('Track title, or url')
        .setRequired(true))
      .toJSON(),

    args: 'title',

    async execute(message, _, main) {
      const voiceChannel = message.member.voice.channel
      if (!voiceChannel) return sendMessage(message, 'Enter a voice channel pls!')
  
      const permissions = voiceChannel.permissionsFor(message.client.user)
      if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) return sendMessage(message, 'I don\'t have the permission to join or speak in the channel 😭')
  
      const attachment = message.attachments && message.attachments[0]?.attachment
    
      const distubeVoice = distube.voices
      distubeVoice.join(voiceChannel)
      distubeVoice.get(message).setSelfDeaf(true)
  
      if (message.editReply) sendMessage(message, 'Getting track..')

      await distube.play(voiceChannel, attachment || main.replace(/play |p /gm, ''), { textChannel: message.channel })
    }
  },

  pause: {
    slash: new SlashCommandBuilder()
      .setName('pause')
      .setDescription('Pause the queue')
      .toJSON(),

    async execute(message) {
      if (!message.member.voice.channel) return sendMessage(message, '🤏 You have to be listening first alr')

      const queue = distube.getQueue(message)
      if (!queue) return sendMessage(message, '🗑 There is no sound around,.')
      if (queue.paused) return sendMessage(message, `🙄 Queue is already paused!! Type \`oi resume\` to resume!`)

      await distube.pause(message)
      sendMessage(message, `⏸ Current queue has been paused. Type \`oi resume\` to resume.`)
    }
  },

  queue: {
    slash: new SlashCommandBuilder()
      .setName('queue')
      .setDescription('Show all tracks in the queue')
      .toJSON(),

    async execute(message) {
      let queue = distube.getQueue(message), pages = [], q = ''
      if (!queue) return sendMessage(message, '🕳 Queue empty..,')
      
      await queue.songs.map((song, index) => q += `**${index + 1}**. ${song.name} - \`${song.formattedDuration}\`\n`)
      
      const queueList = q.match(/(.*?\n){10}/gm) || [q]
      for (list of queueList) pages.push(new MessageEmbed()
        .setColor('#DD6E0F')
        .setTitle('Current Queue')
        .setDescription(`Total length - \`${queue.formattedDuration}\``)
        .addFields({ name: '---', value: list })
      )
      
      if (message.deleteReply) sendMessage(message, `${message.guild.name}'s current queue`)

      pagination({
        author: message.author?.id? message.author : message.user,
        channel: message.channel,
        embeds: pages,
        button: [
          { name: 'previous', emoji: '⬅', style: 'DANGER' },
          { name: 'next', emoji: '➡', style: 'PRIMARY' }
        ],
        time: 120000
      })
    }
  },

  remove: {
    slash: new SlashCommandBuilder()
      .setName('remove')
      .setDescription('Remove a track from the queue')
      .addStringOption(option => option
        .setName('position')
        .setDescription('The track position')
        .setRequired(true))
      .toJSON(),

    args: 'position',

    async execute(message, arg2) {
      let queue = distube.getQueue(message)
      if (!queue) return sendMessage(message, '🥔 Queue is empty rn so no remove!')
      if (!arg2) return sendMessage(message, '🆔 Select a song position to remove from the queue!')
  
      const index = parseInt(arg2) - 1
      const toRemove = queue.songs[index].name
  
      await queue.songs.splice(index, 1)
      sendMessage(message, `💨 **${toRemove}** has been removed from queue oki`)
    }
  },

  replay: {
    slash: new SlashCommandBuilder()
      .setName('replay')
      .setDescription('Replay the current track')
      .toJSON(),

    async execute(message) {
      if (!message.member.voice.channel) return sendMessage(message, '🤏 Make sure ur in the channel!')

      const queue = distube.getQueue(message)
      if (!queue) return sendMessage(message, '🔄 Play some sound first!')
      const to_replay = queue.songs[0]

      sendMessage(message, `🔂 Replaying **${to_replay.name}**`)
      await queue.songs.splice(1, 0, to_replay)
      await distube.skip(message)
    }
  },

  resume: {
    slash: new SlashCommandBuilder()
      .setName('resume')
      .setDescription('Resume the current queue')
      .toJSON(),

    async execute(message) {
      if (!message.member.voice.channel) return sendMessage(message, '🤏 You have to be listening first alr')

      const queue = distube.getQueue(message)
      if (!queue) return sendMessage(message, '🗑 No sound to resume,.')
      if (!queue.paused) return sendMessage(message, '🙄 Queue is already playing trl')

      await distube.resume(message)
      sendMessage(message, '⏯ Queue resumed!')
    }
  },

  stop: {
    slash: new SlashCommandBuilder()
      .setName('stop')
      .setDescription('Stop the current queue')
      .toJSON(),

    async execute(message) {
      if (!message.member.voice.channel) return sendMessage(message, '🤏 Can\'t stop me, u need to be in the channel!')
      if (!distube.getQueue(message)) return sendMessage(message, '🗑 There are no songs around,.')

      await distube.stop(message)
      sendMessage(message, '😴 All sounds have stopped and queue has been cleared. I\'m out,.,')
    }
  },

  skip: {
    slash: new SlashCommandBuilder()
      .setName('skip')
      .setDescription('Skip to the next track in queue')
      .toJSON(),

    async execute(message) {
      if (!message.member.voice.channel) return sendMessage(message, '🙄 You\'re not listening..,')
      if (!distube.getQueue(message)) return sendMessage(message, 'No song to skip,, Play some!!')
  
      await distube.skip(message)
      .then(_ => sendMessage(message, '⏯ **Skipped!**'))
      .catch(async _ => {
        await distube.stop(message)
        return sendMessage(message, '⏯ There\'s no song left in queue so I\'ll stop, bai!!')
      })
    }
  },

  songinfo: {
    slash: new SlashCommandBuilder()
      .setName('songinfo')
      .setDescription('Show the current track information')
      .toJSON(),

    async execute(message) {
      if (!message.member.voice.channel) return sendMessage(message, '🤏 Can\'t stop me, u need to be in the channel!')

      const queue = distube.getQueue(message)
      if (!queue) return sendMessage(message, '🗑 There are no songs around,.')

      const playing = queue.songs[0]

      const bar = new ProgressBar(':bar', {
        total: 50,
        complete: '-',
        incomplete: '-',
        head: '🔘',
        curr: queue.currentTime * (50 / playing.duration)
      })
      bar.tick()

      message.reply({
        embeds: [new MessageEmbed()
          .setColor('#DD6E0F')
          .setTitle(playing.name)
          .setDescription(`by [${playing.uploader.name}](${playing.uploader.url})`)
          .setThumbnail(playing.thumbnail)
          .addFields( { name: 'Source', value: playing.url } )
          .setFooter(`${queue.formattedCurrentTime} ${bar.lastDraw} ${playing.formattedDuration}`)
        ],
        
        allowedMentions: { repliedUser: false }
      })
    }
  },

  volume: {
    slash: new SlashCommandBuilder()
      .setName('volume')
      .setDescription('Set the bot\'s volume')
      .addStringOption(option => option
        .setName('level')
        .setDescription('Volume level')
        .setRequired(true))
      .toJSON(),

    args: 'level',

    async execute(message, arg2) {
      if (!message.member.voice.channel) return sendMessage(message, '🙄 Join voice channel first pls')
      if (!distube.getQueue(message)) return sendMessage(message, 'No song around tho,,')
  
      const level = parseInt(arg2)
      if (!arg2) sendMessage(message, '⚠ Select a volume level mf!!')
      else if (level < 301 && level > -1) {
        await distube.setVolume(message, level)
        sendMessage(message, `🔉 Oki volume has been set to \`${level}\``)
      }
      else sendMessage(message, '💢 Volume can only be set from `0` to `300`')
    }
  }
}