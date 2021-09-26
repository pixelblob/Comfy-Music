const Discord = require('discord.js');
const {Collection, MessageEmbed, Permissions} = require('discord.js');
const ytdl = require("discord-ytdl-core");
const ytpl = require('ytpl');
const gtts = require('node-gtts')('en');
const fs = require('fs');
const { createAudioPlayer, joinVoiceChannel, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus, getVoiceConnection, NoSubscriberBehavior } = require('@discordjs/voice');
const client = new Discord.Client({ intents: ["GUILD_VOICE_STATES", "GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"] });
const { token, ytKey, prefix } = require('./config.json');
const urlRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gm
const numRegex = /(\d+)/
const axios = require("axios")
global.AbortController = require("abort-controller")
var musicQueue = []
var voiceActivity = []



client.once('ready', function() {
    console.log('Ready!\n' + "Current Servers" + "(" + client.guilds.cache.map(g => g.name).length + ")" + " : " + client.guilds.cache.map(g => g.name).join(" / "))

    console.log("I have ADMIN PERMS ON: ("+client.guilds.cache.filter(guild => guild.me.permissions.has(Permissions.FLAGS.ADMINISTRATOR)).map(g=> g.name).join(", ")+") wtf....")


})



client.on("voiceStateUpdate", function(oldState, newState) {
    var oldChannel = oldState.channel
    var newChannel = newState.channel
    if (newChannel != oldChannel) {
        if (oldChannel && !newChannel) {
            console.log(oldState.member.user.username + ": left " + oldChannel.name)
            if (voiceActivity[oldState.member.user.id]) {
                var sec = new Date() - voiceActivity[oldState.member.user.id]
                console.log(newState.member.user.username+": left after "+new Date(sec).toISOString().substr(11, 8))
            } else {
                console.log("Could Not Get Leave Time For "+ oldState.member.user.username)
            }
            
        } else if (newChannel && !oldChannel) {
            console.log(newState.member.user.username + ": joined " + newChannel.name)
            voiceActivity[newState.member.user.id] = new Date()
        } else {
            
            if (voiceActivity[oldState.member.user.id]) {
                var sec = new Date() - voiceActivity[oldState.member.user.id]
                console.log(newState.member.user.username+": left "+oldState.channel.name+" after "+new Date(sec).toISOString().substr(11, 8))
            } else {
                console.log("Could Not Get Leave Time For "+ oldState.member.user.username)
            }
            voiceActivity[newState.member.user.id] = new Date()
            console.log(newState.member.user.username + ": " + oldChannel.name + " --> " + newChannel.name)
        }
    }

})

client.on("messageCreate", function(msg) { //#0E5B73
    if (msg.author.bot) return;
    var args = msg.content.split(" ").slice(1)
    if (!musicQueue[msg.guildId]) musicQueue[msg.guildId] = ({currentIndex: 0, current: null, queue: []})
    if (msg.content.startsWith(prefix+"play") || msg.content.startsWith(prefix+"p")) {


       
       //console.log(args.match(urlRegex))

       if (args[0].startsWith("https://open.spotify.com/playlist/")) { //https://open.spotify.com/playlist/     //https://api.spotify.com/v1/playlists/
       var id = args[0].split("https://open.spotify.com/playlist/")[1].split("?si=")[0]
       console.log(id)

       axios.get("https://api.spotify.com/v1/playlists/"+id, {   
                headers: {
                    'Authorization': `Bearer BQDSiZZRDccaJ5sU3R1j9UlIkHllbbyoQGXv6V9Jfa3C6NRhXbIbj7MejcJr8V1hWni0qQbGhOTJn9gZqYu0wGrpAqCdZyI7AUOOacwLsiT0gQZcyxTAcxLee0kqrn63KdI8BxPxVSpILA-7UwoAVi_aV2lh0-Sim2hv7r0904sL5wvPUlN8auIBpTK95kO5fykZ5nzQHyLH8PIp7_01k7ugGx4SH09WFwSsyFwEala8mbBE5_CMi-okIB9HH1NXZuTNbFhypAOA2pshyUnpgQHwYt2u0VjYQ3EKV_0y6WMr`
                  }})
  .then(function (response) {
      //console.log(response.data.tracks.items.map(i=> i.track.name + " " + i.track.artists.map(a=> a.name).join(" ")))
      response.data.tracks.items.map(i=> i.track.name + " " + i.track.artists.map(a=> a.name).join(" ")).forEach(t=>{
        axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: "snippet",
                key: ytKey,
                q: t
    
        },
        'headers': {}
    })
        .then(function (response) {
          // handle success
          var url = "https://www.youtube.com/watch?v="+response.data.items[0].id.videoId
    
          ytdl.getBasicInfo(url).then(function(v){
    
            musicQueue[msg.guildId].queue.push({url: v.videoDetails.video_url, title: v.videoDetails.title, duration: v.videoDetails.lengthSeconds})
    
            var queue = musicQueue[msg.guildId]
                if (musicQueue[msg.guildId].current == null) {
                    queue.current = queue.queue[queue.currentIndex]
                    playUrl(queue.current.url, msg.member.voice.channel, musicQueue[msg.guildId], msg)
                    //msg.reply({ embeds: [playingEmbed({video: {title: v.videoDetails.title, url: queue.current.url, description: v.videoDetails.description, length:v.videoDetails.lengthSeconds, thumburl: v.videoDetails.thumbnails[0].url }, embed: {}})] })
                    console.log(musicQueue[msg.guildId].current)
                }
    
          }).catch(function(e){
            console.log(e)
          })
          
        })
        .catch(function (error) {
          // handle error
          console.log(error)
        }) 
      })
  })

    }

       if (args[0].startsWith("https://open.spotify.com/track/")) {

            var id = args[0].split("https://open.spotify.com/track/")[1].split("?si=")[0]

            console.log(id)

            axios.get("https://api.spotify.com/v1/tracks/"+id, {   
                headers: {
                    'Authorization': `Bearer `+spotifyKey
                  }})
  .then(function (response) {
    // handle success
    console.log(response.data.name)
    console.log(response.data.artists.map(a=> a.name).join(" "))
    console.log(response.data.name + " " + response.data.artists.map(a=> a.name).join(" "))

    //console.log(ytKey)

     axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
            part: "snippet",
            key: ytKey,
            q: response.data.name + " " + response.data.artists.map(a=> a.name).join(" ")

    },
    'headers': {}
})
    .then(function (response) {
      // handle success
      var url = "https://www.youtube.com/watch?v="+response.data.items[0].id.videoId

      ytdl.getBasicInfo(url).then(function(v){

        musicQueue[msg.guildId].queue.push({url: v.videoDetails.video_url, title: v.videoDetails.title, duration: v.videoDetails.lengthSeconds})

        var queue = musicQueue[msg.guildId]
            if (musicQueue[msg.guildId].current == null) {
                queue.current = queue.queue[queue.currentIndex]
                playUrl(queue.current.url, msg.member.voice.channel, musicQueue[msg.guildId], msg)
                //msg.reply({ embeds: [playingEmbed({video: {title: v.videoDetails.title, url: queue.current.url, description: v.videoDetails.description, length:v.videoDetails.lengthSeconds, thumburl: v.videoDetails.thumbnails[0].url }, embed: {}})]})
                console.log(musicQueue[msg.guildId].current)
            }

      }).catch(function(e){
        console.log(e)
      })
      
    })
    .catch(function (error) {
      // handle error
      console.log(error)
    }) 

  })
  .catch(function (error) {
    // handle error
    console.log(error)
  })

       } else if (args.filter(a=> a.match(urlRegex))) {
            console.log(args.filter(a=> a.match(urlRegex)))

            args.filter(a=> a.match(urlRegex)).forEach(function(url){
                ytdl.getBasicInfo(url).then(function(v){
                    //console.log(v.videoDetails)

                    musicQueue[msg.guildId].queue.push({url: v.videoDetails.video_url, title: v.videoDetails.title, duration: v.videoDetails.lengthSeconds})

                    var queue = musicQueue[msg.guildId]
                        if (musicQueue[msg.guildId].current == null) {
                            queue.current = queue.queue[queue.currentIndex]
                            playUrl(queue.current.url, msg.member.voice.channel, musicQueue[msg.guildId], msg)
                            //msg.reply({ embeds: [playingEmbed({video: {title: v.videoDetails.title, url: queue.current.url, description: v.videoDetails.description, length:v.videoDetails.lengthSeconds, thumburl: v.videoDetails.thumbnails[0].url }, embed: {}})] })
                            console.log(musicQueue[msg.guildId].current)
                        } else {
                            //msg.reply({ content: "Adding song to current queue!", embeds: [playingEmbed({video: {title: v.videoDetails.title, url: queue.current.url, description: v.videoDetails.description, length:v.videoDetails.lengthSeconds, thumburl: v.videoDetails.thumbnails[0].url }, embed: {}})] })
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
                                    
                                    ytdl.getBasicInfo(queue.current.url).then(function(v){
                                        //msg.reply({ embeds: [playingEmbed({video: {title: v.videoDetails.title, url: queue.current.url, description: v.videoDetails.description, length:v.videoDetails.lengthSeconds, thumburl: v.videoDetails.thumbnails[0].url }})] })
                                        //msg.reply({ embeds: [playingEmbed(v.videoDetails.title, queue.current.url, v.videoDetails.description, v.videoDetails.lengthSeconds, v.videoDetails.thumbnails[0].url, v.videoDetails.viewCount, v.videoDetails.likes, v.videoDetails.dislikes, "Now Playing!")] })
                                        })
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


            var fields = []
            musicQueue[msg.guildId].queue.forEach((element, index) =>{
                if (index == musicQueue[msg.guildId].currentIndex) {
                    fields.push({ name: "➤#"+(index+1)+" "+element.title+"⮜", value: 'Sus' })
                } else {
                    //➤
                    fields.push({ name: "#"+(index+1)+" "+element.title, value: 'Sus' })
                }
                
            })
        
            const exampleEmbed = new MessageEmbed()
            .setColor('#0E5B73')
            .setTitle("Below is your current queue!")
            .setAuthor(`YT: Current Queue! (${musicQueue[msg.guildId].queue.length}) `, 'https://i.imgur.com/LLnAcH6.png', 'https://discord.com/api/oauth2/authorize?client_id=879026679329198161&permissions=36752448&scope=bot')
            .setTimestamp()
            .setFields(fields.slice(0, 10))
            .setFooter("Ask pixel if an error occurs?");

            msg.reply({embeds: [exampleEmbed]}).then(msg=>{
                msg.react("<:ComfyDoubleArrowDown:891065730353754132>").then(()=>{
                msg.react("<:ComfyDoubleArrowUp:891065730412478484>")




                const filter = (reaction, user) => {
                    return user.id != client.user.id;
                };
                
                const collector = msg.createReactionCollector({ filter, time: 60000, dispose: true });
                
                var selectorArrow = 0

                collector.on("collect", function (reaction, user) {
                    console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
                        
                    if (reaction.emoji.id == "891065730353754132") {  //◀️

                        selectorArrow++
                        msg.edit({embeds: [msg.embeds[0].setFields(fields.slice(selectorArrow, selectorArrow+10))]})
                        console.log(selectorArrow)

                    } else if (reaction.emoji.id == "891065730412478484") {

                        selectorArrow--
                        msg.edit({embeds: [msg.embeds[0].setFields(fields.slice(selectorArrow, selectorArrow+10))]})
                        console.log(selectorArrow)

                    }
                    
                        reaction.users.remove(user)
                    

                })
                
                collector.on('end', collected => {
                    msg.reactions.removeAll()
                });





            })})





            //msg.reply("Below Is The Current Queue:\n"+musicQueue[msg.guildId].queue.map(s=> "```"+s.title + "\n" + s.url + "\n" + s.duration +"\n```").join("\n")).catch(e=>{
            //    msg.reply("Could Not Send Queue Message This May Be Because Of Its Length ("+"Below Is The Current Queue:\n"+musicQueue[msg.guildId].queue.map(s=> "```"+s.title + "\n" + s.url + "\n" + s.duration +"\n```").join("\n").length+") I will fix this later(maybe)")
            //})

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
                msg.reply({ embeds: [playingEmbed({video: {title: v.videoDetails.title, url: queue.current.url, description: v.videoDetails.description, length:v.videoDetails.lengthSeconds, thumburl: v.videoDetails.thumbnails[0].url }, embed: {}})] })
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
                        //msg.reply({ embeds: [playingEmbed({video: {title: v.videoDetails.title, url: queue.current.url, description: v.videoDetails.description, length:v.videoDetails.lengthSeconds, thumburl: v.videoDetails.thumbnails[0].url }, embed: {}})] })
                        })
                    } else {
                        msg.reply("Please provide a YOUTUBE url!")
                    }
                } else {
                    msg.reply("Please provide a url!")
                }
                
            
        }
        if (args[0] == "queue") {
            var items = [{"name":"Generic Song #1"}]
            msg.reply({ embeds: [queueEmbed(items)]})
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
        


    } else if (msg.content.startsWith(prefix+"controls")) {
        var controls = [{emote:"▶️", description: "Resumes Your Current Song."},{emote:"⏸️", description: "Pauses Your Current Song."},{emote:"⏹️", description: "Same Function As ⏸️, Clears The Current Queue Instead."},{emote:"⏪", description: "Seeks Backwards 10 Seconds."},{emote:"⏩", description: "Seeks Forward 10 Seconds."},{emote:"⏮️", description: "Skips To The Next Song In Your Queue."},{emote:"⏭️", description: "template"},{emote:"🛑", description: "Leaves Your Current Voice Channel."},{emote:"✅", description: "Joins Your Current Voice Channel."}]
        msg.reply("**Below Are All Of The Controls And Their Funmctions!**\n"+controls.map(c=> c.emote+": "+c.description+"\n").join("") + "__**These Controls Currently Do Jack btw...**__").then(msg=>{
            controls.forEach(e=>{
                msg.react(e.emote)
            })
        })
    } else if (msg.content.startsWith(prefix+"feature")) {
    
        if (!args[0]) {
            msg.reply("Please Supply Some Constructive Criticism")
        } else {
            msg.reply(`Saving! Use ${prefix}sf To See All The Shit You Guys Sent Me.`)

            

            let rawdata = fs.readFileSync("./MusicBot/features.json");
            let student = JSON.parse(rawdata);
            console.log(student);

            student.push({USERNAME: msg.author.username, MESSAGE: args.join(" ")})

            let data = JSON.stringify(student);
            fs.writeFileSync('./MusicBot/features.json', data);

        }

    } else if (msg.content.startsWith(prefix+"sf")) {
        let rawdata = fs.readFileSync("./MusicBot/features.json");
            let student = JSON.parse(rawdata);
            console.log(student);

            //console.log(student.map(s=> s.USERNAME+": "+s.MESSAGE+"\n").join(""))

            msg.reply(student.map(s=> s.USERNAME+": "+s.MESSAGE+"\n").join(""))
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
            //msg.reply({ embeds: [playingEmbed({video: {title: v.videoDetails.title, url: queue.current.url, description: v.videoDetails.description, length:v.videoDetails.lengthSeconds, thumburl: v.videoDetails.thumbnails[0].url }, embed: {color: "#FF7900"}})] })
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

function playingEmbed(video, embed) {

    //console.log(embed)
/* 
    var color = embed.color
    var title = embed.title
    var operation = embed.operation

    const exampleEmbed = new MessageEmbed()
	.setColor(color || '#0E5B73')
	.setTitle(title || "No Title Provided")
	.setURL(video.url || "No Url Provided")
	.setAuthor('YT: '+operation || "No Status Provided", 'https://i.imgur.com/LLnAcH6.png', 'https://discord.com/api/oauth2/authorize?client_id=879026679329198161&permissions=36752448&scope=bot')
	.setDescription(video.description || "No Description Provided")
	.setThumbnail(video.title || "No Thumbnail Provided")
	.addField('Video-Length:', new Date(video.length || 0 * 1000).toISOString().substr(11, 8), true)
    .addField('Video-Views:', video.views || 0, true)
    .addField('Video-Likes:', video.likes || "0".toString(), true)
    .addField('Video-Dislikes:', video.dislikes || "0".toString(), true)
	.setTimestamp()
	.setFooter("Ask pixel if an error occurs?");
return exampleEmbed; */
}

function queueEmbed(queue) {
var fields = []
    queue.queue.forEach((element, index) =>{
        if (index == queue.currentIndex) {
            fields.push({ name: "➤#"+index+" "+element.title+"⮜", value: 'Sus' })
        } else {
            //➤
            fields.push({ name: "#"+index+" "+element.title, value: 'Sus' })
        }
        
    })

    const exampleEmbed = new MessageEmbed()
	.setColor('#0E5B73')
	.setTitle("Below is your current queue!")
	.setAuthor(`YT: Current Queue! (${queue.queue.length}) `, 'https://i.imgur.com/LLnAcH6.png', 'https://discord.com/api/oauth2/authorize?client_id=879026679329198161&permissions=36752448&scope=bot')
	.setTimestamp()
    .setFields(fields)
	.setFooter("Ask pixel if an error occurs?");
return exampleEmbed;
}

client.login(token)