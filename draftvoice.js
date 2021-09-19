const Discord = require('discord.js');
const {MessageEmbed} = require('discord.js');
const ytdl = require("discord-ytdl-core");
const ytpl = require('ytpl');
const gtts = require('node-gtts')('en');
const { createAudioPlayer, joinVoiceChannel, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus, getVoiceConnection, NoSubscriberBehavior } = require('@discordjs/voice');
const voice = require('@discordjs/voice');
const client = new Discord.Client({ intents: ["GUILD_VOICE_STATES", "GUILDS", "GUILD_MESSAGES"] });
const { token, ytKey, prefix } = require('./config.json');
const urlRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gm
const numRegex = /(\d+)/
const axios = require("axios")
global.AbortController = require("abort-controller");
var musicQueue = []



client.once('ready', function() {
    console.log('Ready!\n' + "Current Servers" + "(" + client.guilds.cache.map(g => g.name).length + ")" + " : " + client.guilds.cache.map(g => g.name).join(" / "))

})


client.on("messageCreate", function(msg) { //#0E5B73
    if (msg.author.bot) return;
    var args = msg.content.split(" ").slice(1)
    if (!musicQueue[msg.guildId]) musicQueue[msg.guildId] = ({currentIndex: 0, current: null, queue: []})
    if (msg.content.startsWith(prefix+"play") || msg.content.startsWith(prefix+"p")) {


       
       //console.log(args.match(urlRegex))
        if (args.filter(a=> a.match(urlRegex))) {
            console.log(args.filter(a=> a.match(urlRegex)))

            args.filter(a=> a.match(urlRegex)).forEach(function(url){
                ytdl.getBasicInfo(url).then(function(v){
                    //console.log(v.videoDetails)

                    musicQueue[msg.guildId].queue.push({url: v.videoDetails.video_url, title: v.videoDetails.title, duration: v.videoDetails.lengthSeconds})

                    var queue = musicQueue[msg.guildId]
                        if (musicQueue[msg.guildId].current == null) {
                            queue.current = queue.queue[queue.currentIndex]
                            playUrl(queue.current.url, msg.member.voice.channel, musicQueue[msg.guildId], msg)
                            msg.reply({ embeds: [playingEmbed(v.videoDetails.title, queue.current.url, v.videoDetails.description, v.videoDetails.lengthSeconds, v.videoDetails.thumbnails[0].url, v.videoDetails.viewCount, v.videoDetails.likes, v.videoDetails.dislikes)] })
                            console.log(musicQueue[msg.guildId].current)
                        }

                }).catch(function(e){
                    console.log(e)
                    console.log("Could Not Find Video, Trying Playlist Download?")

                    ytpl.getPlaylistID(url).then(function(id) {
                        ytpl(id, [{limit: 200, pages: 10}]).then(function(vids) {
                            console.log("Found "+ vids.items.length)
                            msg.reply("Playlists Are Currently Limited To 100 Songs, I Can Hopefully Fix This Later?")
                            vids.items.forEach(function(v) {
                                //console.log(v)

                                musicQueue[msg.guildId].queue.push({url: v.shortUrl, title: v.title, duration: v.durationSec})

                                var queue = musicQueue[msg.guildId]
                                if (musicQueue[msg.guildId].current == null) {
                                    queue.current = queue.queue[queue.currentIndex]
                                    playUrl(queue.current.url, msg.member.voice.channel, musicQueue[msg.guildId], msg)
                                    msg.reply({ embeds: [playingEmbed(v.title, musicQueue[msg.guildId].current.url)] })
                                    console.log(musicQueue[msg.guildId].current)
                                }

                            })
                        }).catch(function(e){
                            console.log(e)
                            console.log("Failure In Playlist Download!")
                        })
                    }).catch(function(e){
                        console.log(e)
                        console.log("Could Not Find Playlist :/")
                    })

                })
            })

            /* ytdl.getBasicInfo(url).then(info=>{
                console.log(info)
            }).catch(e=>{
                console.log(e)
                msg.reply(e)
            }) */
        } else {
            msg.reply("Search Terms Are Currently A Work In Progress Please Use A Youtube Url For Now!")
        }
        

        

         
        //console.log(musicQueue[msg.guildId])

    } else if (msg.content == prefix+"queue" || msg.content == prefix+"q") {

        console.log(musicQueue[msg.guildId])

        if (musicQueue[msg.guildId].queue.length == 0) {
            msg.reply("There Is Nothing Currently In Your Queue!")
        } else {
            console.log("Below Is The Current Queue:\n"+musicQueue[msg.guildId].queue.map(s=> "```"+s.title + "\n" + s.url + "\n" + s.duration +"\n```").join("\n").length)

            msg.reply("Below Is The Current Queue:\n"+musicQueue[msg.guildId].queue.map(s=> "```"+s.title + "\n" + s.url + "\n" + s.duration +"\n```").join("\n")).catch(e=>{
                msg.reply("Could Not Send Queue Message This May Be Because Of Its Length ("+"Below Is The Current Queue:\n"+musicQueue[msg.guildId].queue.map(s=> "```"+s.title + "\n" + s.url + "\n" + s.duration +"\n```").join("\n").length+") I will fix this later(maybe)")
            })

        }

    } else if (msg.content == prefix+"skip" || msg.content == prefix+"s") {
        if (musicQueue[msg.guildId].currentIndex == musicQueue[msg.guildId].queue.length) {
            if (musicQueue[msg.guildId].queue.length == 0) {
                msg.reply("You are currently at the end of your queue, which makes sense because its empty...")
            } else {
                msg.reply("You are currently at the end of your queue!")
            }
        } else {
            var queue = musicQueue[msg.guildId]
            queue.current = queue.queue[queue.currentIndex+1]
            queue.currentIndex++
            //console.log(queue.queue)
            console.log(queue.currentIndex)
            console.log(queue.current)
            playUrl(queue.current.url, msg.member.voice.channel, queue, msg)
            ytdl.getBasicInfo(queue.current.url).then(function(v){
                msg.reply({ embeds: [playingEmbed(v.videoDetails.title, queue.current.url, v.videoDetails.description, v.videoDetails.lengthSeconds, v.videoDetails.thumbnails[0].url, v.videoDetails.viewCount, v.videoDetails.likes, v.videoDetails.dislikes)] })
                })
        }
        /* var queue = musicQueue[msg.guildId]
            queue.current = queue.queue[queue.currentIndex] */
    } else if (msg.content == prefix+"clear" || msg.content == prefix+"c") {
        msg.reply("Cleared "+ musicQueue[msg.guildId].queue.length + " Songs From The Queue!" + "\nPlayer Will Finish Current Song Before Stopping!")
        musicQueue[msg.guildId] = ({currentIndex: 0, current: null, queue: []})
    } else if (msg.content.startsWith(prefix+"remove") || msg.content.startsWith(prefix+"r")) {
        if (args.find(a=> a.match(numRegex))) {
                const index = musicQueue[msg.guildId].queue.indexOf(args.find(a=> a.match(numRegex)));
                if (index > -1) {
                    musicQueue[msg.guildId].queue.splice(index, 1);
                    musicQueue[msg.guildId].currentIndex-1
                  }
        } else {
            msg.reply("Please Specify A Number!")
        }
    } else if (msg.content.startsWith(prefix+"help") || msg.content.startsWith(prefix+"h")) {
        const help = require('./help.json')
        msg.reply("Thank you for using "+ client.user.username +" my current prefix is \"-\" and below is a list of commands:\n"+help.join("\n"))
    } else if (msg.content.startsWith(prefix+"embed") || msg.content.startsWith(prefix+"e")) {
            if (args[0] == "play") {
                if (args[1]) {
                    if (args[1].match(urlRegex)) {
                        var url = args[1].match(urlRegex)
                        ytdl.getBasicInfo(url).then(function(v){
                        msg.reply({ embeds: [playingEmbed(v.videoDetails.title, url[0], v.videoDetails.description, v.videoDetails.lengthSeconds, v.videoDetails.thumbnails[0].url, v.videoDetails.viewCount, v.videoDetails.likes, v.videoDetails.dislikes)] })
                        })
                    } else {
                        msg.reply("Please provide a YOUTUBE url!")
                    }
                } else {
                    msg.reply("Please provide a url!")
                }
                
            
        }
        
    } else if (msg.content.startsWith(prefix+"shuffle")) {
        shuffle(musicQueue[msg.guildId].queue)
    } else if (msg.content.startsWith(prefix+"tts")) {
        if (args[0]) {
        var channel = msg.member.voice.channel
        tts(args.join(" "), channel)
        } else {
            msg.reply("Please input some text!")
        }
        


    }

})

function playUrl(url, channel, queue, msg) {

    console.log("QUEUE: "+ queue)
    
    let stream = ytdl(url, {
        filter: "audioonly",
        opusEncoded: true,
})

    var vc = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });
    player.on(AudioPlayerStatus.Idle, function() {
        console.log("IDLE")
        console.log(queue)
        console.log(queue.currentIndex)
         if (queue.currentIndex >= queue.queue.length-1) {
            queue.current = null
            queue.currentIndex++
        } else {
            queue.current = queue.queue[queue.currentIndex+1]
            queue.currentIndex++
            playUrl(queue.current.url, channel, queue, msg)
            ytdl.getBasicInfo(queue.current.url).then(function(v){
            msg.reply({ embeds: [playingEmbed(v.videoDetails.title, queue.current.url, v.videoDetails.description, v.videoDetails.lengthSeconds, v.videoDetails.thumbnails[0].url, v.videoDetails.viewCount, v.videoDetails.likes, v.videoDetails.dislikes)] })
            })
        } 
        
    });
    player.on("error", error => {
        console.log(error);
    });
    
    const resource = createAudioResource(stream);
    player.play(resource);
    vc.subscribe(player); 

}

function shuffle(array) {

    //No Fucking Clue How This Function Works (I Stole It)

    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

function tts(text, channel) {
    var vc = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });
    player.on("error", error => {
        console.log(error);
    });
    
    const resource = createAudioResource(gtts.stream(text));
    player.play(resource);
    vc.subscribe(player); 
}

function playingEmbed(title, url, description, length, thumbnail, views, likes, dislikes) {
    console.log(likes, dislikes)

    if (!length) length = 0
    if (!views) views = "0"
    if (!likes) likes = "0"
    if (!dislikes) dislikes = "0"
    if (!thumbnail) thumbnail = ""
    if (!description) description = "Could Not Fetch Some Of The Required Values, Please Ask Pixel To Fix This!"

    const exampleEmbed = new MessageEmbed()
	.setColor('#0E5B73')
	.setTitle(title)
	.setURL(url)
	.setAuthor('YT: Now Playing!', 'https://i.imgur.com/LLnAcH6.png', 'https://discord.com/api/oauth2/authorize?client_id=879026679329198161&permissions=36752448&scope=bot')
	.setDescription(description)
	.setThumbnail(thumbnail)
	.addField('Video-Length:', new Date(length * 1000).toISOString().substr(11, 8), true)
    .addField('Video-Views:', views, true)
    .addField('Video-Likes:', likes.toString(), true)
    .addField('Video-Dislikes:', dislikes.toString(), true)
	.setTimestamp()
	.setFooter("Ask pixel if an error occurs?", client.users.cache.get("290444481743028224").avatarURL());
return exampleEmbed;
}

client.login(token)