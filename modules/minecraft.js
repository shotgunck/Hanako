const Discord = require('discord.js')
const axios = require('axios')
const imgbb = require('imgbb-uploader')

const dotenv = require('dotenv')
dotenv.config()

const config = require('../config.json')

const commands = {
    mcskin: (message, arg2) => {
      if (!arg2) return message.channel.send('🙄 Provide a Minecraft player\'s username,, like `'+config.prefix+' mcskin notch`')
      message.channel.send('🔶 Getting **'+arg2+'** skin..,').then(m => m.delete({timeout: 2000}))
        axios.get('https://minecraft-api.com/api/skins/'+arg2+'/body/10.5/10/json')
        .then(res => {
            imgbb({
               		apiKey: process.env.IMGBB_API_KEY,
               		name: arg2,
               		expiration: 3600,
               		base64string: !res.data.skin ? 'https://www.ssbwiki.com/images/0/05/Steve_Minecraft.png' : res.data.skin
               	})
              	.then(imgRes => { 
               		  message.channel.send({ embed: new Discord.MessageEmbed() 
                    .setColor('#DD6E0F')
                    .setTitle(arg2)
                    .setImage(imgRes.url)
                   })
                })
            
        }).catch(err => message.channel.send('📛 Player API is experiencing errors, try again in 5 minutes oki! || '+err))
    },

    achieve: message => {
        const args = message.content.slice(config.prefix.length+8).trim().split(/ +/g).join('..')
        axios.get('https://minecraft-api.com/api/achivements/cooked_salmon/achievement..got/'+args)
        .then(data => {
            message.channel.send({ embed: new Discord.MessageEmbed() 
            .setColor('#DD6E0F')
            .setImage(data.config.url)
            })
        })
    },

    ms: async (message, arg2) => {
        if (!arg2) return message.channel.send('💢 Pls provide a Minecraft server bru')

        message.channel.send('Fetching, please wait...').then(msg => msg.delete({timeout: 2000}))
        
		axios.get('https://mcapi.xdefcon.com/server/'+arg2+'/full/json')
        .then(res => {
            const data = res.data
            if (data.serverStatus === 'offline') {
            message.channel.send({ embed: new Discord.MessageEmbed() 
            	.setColor('#DD6E0F')
            	.setTitle('\\🔴 '+arg2+' is offline, try again latur kk')
              .setDescription('🔹 If u see info being displayed wrongly, try again in 5 minutes!')
            	.setTimestamp()
            })
            } else if (data.serverStatus === 'online') {
               	imgbb({
               		apiKey: process.env.IMGBB_API_KEY,
               		name: "mcservericon",
               		expiration: 3600,
               		base64string: !data.icon ? 'https://i.imgur.com/cpfxvnE.png' : data.icon.substr(22, data.icon.length)
               	})
              	.then(imgRes => { 
               		const ping = data.ping
                        let ok = parseInt(ping)

                        if (ok > 499) ok = ping+'ms [Bad]'
                        else if (ok < 500 && ok > 149) ok = ping+'ms [avg]'
                        else if (ok < 150) ok = ping+'ms [OK]'

                   			message.channel.send({ embed: new Discord.MessageEmbed() 
                     			.setColor('#DD6E0F')
                      			.setTitle('\\🟢 '+arg2+' is online')
			                	.setDescription(data.motd.text)
			                	.setThumbnail(imgRes.url)
                       			.addFields(
                       			{ name: '​', value: '**➕ Info: **'+'\n'+
                       			'-------------------------------\n\n'+
			                	'**Version**: '+data.version+
                       			'\n**Players in game:** '+data.players+'/'+data.maxplayers+
                       			'\n**Ping**: '+ok+
                   				'\n\n'+
			                    '-------------------------------'+
               				    '\n🔹 If u see info being displayed wrongly, try again in 5 minutes!'
                   				})
                   				.setTimestamp()
                   			})     
                })
            	.catch(err => message.channel.send('Image API error, pls wait for 5 minutes before trying again. || '+err))
        	}
      	})
		.catch(err => {
        	console.log(err)
        	message.channel.send('API error, pls wait for 5 minutes before trying again. || '+err)
      	})
    }
}

module.exports = commands