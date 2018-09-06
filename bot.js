const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const { Client, Util } = require('discord.js');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");
const queue = new Map();
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`in ${client.guilds.size} servers `)
    console.log(`[xd] ${client.users.size}`)
    client.user.setStatus("online")
});

const prefix = "-"
client.on('message', async msg => {
	if (msg.author.bot) return undefined;
	
	if (!msg.content.startsWith(prefix)) return undefined;
	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let command = msg.content.toLowerCase().split(" ")[0];
	command = command.slice(prefix.length)

	if (command === `play`) {
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('يجب توآجد حضرتك بروم صوتي .');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
			
			return msg.channel.send('لا يتوآجد لدي صلاحية للتكلم بهذآ الروم');
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send('لا يتوآجد لدي صلاحية للتكلم بهذآ الروم');
		}

		if (!permissions.has('EMBED_LINKS')) {
			return msg.channel.sendMessage("**يجب توآفر برمشن `EMBED LINKS`لدي **")
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(` **${playlist.title}** تم الإضآفة إلى قأئمة التشغيل`);
		} else {
			try {

				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 5);
					let index = 0;
					const embed1 = new Discord.RichEmbed()
			        .setDescription(`**الرجآء من حضرتك إختيآر رقم المقطع** :
${videos.map(video2 => `[**${++index} **] \`${video2.title}\``).join('\n')}`)

					.setFooter("Masters Bot")
					msg.channel.sendEmbed(embed1).then(message =>{message.delete(20000)})
					
					// eslint-disable-next-line max-depth
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 15000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('لم يتم إختيآر مقطع صوتي');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send(':X: لا يتوفر نتآئج بحث ');
				}
			}

			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === `skip`) {
		if (!msg.member.voiceChannel) return msg.channel.send('أنت لست بروم صوتي .');
		if (!serverQueue) return msg.channel.send('لا يتوفر مقطع لتجآوزه');
		serverQueue.connection.dispatcher.end('تم تجآوز هذآ المقطع');
		return undefined;
	} else if (command === `stop`) {
		if (!msg.member.voiceChannel) return msg.channel.send('أنت لست بروم صوتي .');
		if (!serverQueue) return msg.channel.send('لا يتوفر مقطع لإيقآفه');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('تم إيقآف هذآ المقطع');
		return undefined;
	} else if (command === `vol`) {
		if (!msg.member.voiceChannel) return msg.channel.send('أنت لست بروم صوتي .');
		if (!serverQueue) return msg.channel.send('لا يوجد شيء شغآل.');
		if (!args[1]) return msg.channel.send(`:loud_sound: مستوى الصوت **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 50);
		return msg.channel.send(`:speaker: تم تغير الصوت الي **${args[1]}**`);
	} else if (command === `np`) {
		if (!serverQueue) return msg.channel.send('لا يوجد شيء حالي ف العمل.');
		const embedNP = new Discord.RichEmbed()
	.setDescription(`:notes: الان يتم تشغيل : **${serverQueue.songs[0].title}**`)
		return msg.channel.sendEmbed(embedNP);
	} else if (command === `queue`) {
		
		if (!serverQueue) return msg.channel.send('لا يوجد شيء حالي ف العمل.');
		let index = 0;
		
		const embedqu = new Discord.RichEmbed()

.setDescription(`**Songs Queue**
${serverQueue.songs.map(song => `**${++index} -** ${song.title}`).join('\n')}
**الان يتم تشغيل** ${serverQueue.songs[0].title}`)
		return msg.channel.sendEmbed(embedqu);
	} else if (command === `pause`) {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('تم إيقاف الموسيقى مؤقتا!');
		}
		return msg.channel.send('لا يوجد شيء حالي ف العمل.');
	} else if (command === "resume") {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('استأنفت الموسيقى بالنسبة لك !');
		}
		return msg.channel.send('لا يوجد شيء حالي في العمل.');
	}

	return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	
//	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`لا أستطيع دخول هذآ الروم ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(` **${song.title}** تم اضافه الاغنية الي القائمة!`);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`بدء تشغيل : **${song.title}**`);
}

client.on("message", message => {
 if (message.content === `-music`) {
  const embed = new Discord.RichEmbed()
      .setColor("#000000")
      .setDescription(`
${prefix}play ⇏ لتشغيل أغنية برآبط أو بأسم
${prefix}skip ⇏ لتجآوز الأغنية الحآلية
${prefix}pause ⇏ إيقآف الأغنية مؤقتا
${prefix}resume ⇏ لموآصلة الإغنية بعد إيقآفهآ مؤقتا
${prefix}vol ⇏ لتغيير درجة الصوت 100 - 0
${prefix}stop ⇏ لإخرآج البوت من الروم
${prefix}join ⇏ لادخال البوت في الروم
${prefix}np ⇏ لمعرفة الأغنية المشغلة حآليا
${prefix}queue ⇏ لمعرفة قآئمة التشغيل
 `)
   message.channel.sendEmbed(embed)
    
   }
   }); 

client.on("message", message => {
	 if (message.content === `-join`) {
		if (!message.member.voiceChannel) return message.reply('**Sorry,youre not on a voice channel**');
		message.member.voiceChannel.join().then(message.react('✅'));
	}
});
const fs = require('fs');
const moment = require('moment');
const jimp = require('jimp');
const Canvas = require('canvas');

client.on('guildMemberAdd', member => {
     const welcomer =  member.guild.channels.find('name', 'welcome');
    if(!welcomer) return;
      if(welcomer) {
         moment.locale('ar-ly');
         var m = member.user;
        let yumz = new Discord.RichEmbed()
        .setColor('RANDOM')
        .setThumbnail(m.avatarURL)
        .setAuthor(m.username,m.avatarURL)
        .addField(': تاريخ دخولك الدسكورد',`${moment(member.user.createdAt).format('D/M/YYYY h:mm a')} **\n** \`${moment(member.user.createdAt).fromNow()}\``,true)            
      
         .setFooter(`${m.tag}`,"https://images-ext-2.discordapp.net/external/JpyzxW2wMRG2874gSTdNTpC_q9AHl8x8V4SMmtRtlVk/https/orcid.org/sites/default/files/files/ID_symbol_B-W_128x128.gif")
     welcomer.send({embed:yumz});          
         
    



      const w = ['imgkgyvnw1.png',]


         let Image = Canvas.Image,
            canvas = new Canvas(400, 200),
            ctx = canvas.getContext('2d');
        fs.readFile(`${w[Math.floor(Math.random() * w.length)]}`, function (err, Background) {
            if (err) return console.log(err);
            let BG = Canvas.Image;
            let ground = new Image;
            ground.src = Background;
            ctx.drawImage(ground, 0, 0, 400, 200);
             
          

                let url = member.user.displayAvatarURL.endsWith(".webp") ? member.user.displayAvatarURL.slice(100) + ".png" : member.user.displayAvatarURL;
                jimp.read(url, (err, ava) => {
                    if (err) return console.log(err);
                    ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
                        if (err) return console.log(err);
                        
                        ctx.font = "bold 12px Arial";
                        ctx.fontSize = '20px';
                        ctx.fillStyle = "#f1f1f1";
                        ctx.textAlign = "center";
                        ctx.fillText(`welcome to ${member.guild.name}`, 300, 130);
                        
                        ctx.font = "bold 12px Arial";
                        ctx.fontSize = '20px';
                        ctx.fillStyle = "#f1f1f1";
                        ctx.textAlign = "center";
                        ctx.fillText(member.user.username, 200, 150);
 
                let Avatar = Canvas.Image;
                              let ava = new Avatar;
                              ava.src = buf;
                              ctx.beginPath();
                              ctx.arc(77, 101, 62, 0, Math.PI*2);
                              ctx.stroke();
                                 ctx.clip();
                                 ctx.drawImage(ava, 13, 38, 128, 126);  
                          
                
                             
welcomer.sendFile(canvas.toBuffer())



      
      
                    }  )  
      
                    

})
      });                    
 }
});
client.on('ready', () => {
  client.user.setActivity("Maric Douglas ORDERS", {type: 'LISTENING'});
  console.log('---------------');
  console.log(' Bot Is Online')
  console.log('---------------')
});
client.on('message', message => {
     if (message.content === ".servers") {
     let embed = new Discord.RichEmbed()
  .setColor("#0000FF")
  .addField("**Server: **" , client.guilds.size)
  message.channel.sendEmbed(embed);
    }

client.on('message', msg => {
  if (msg.content === '7892bs782bs') {
    msg.reply('s7u2bs298');
  }
});
if (message.content === '-help') {
	var embed  = new Discord.RichEmbed()
              var embed  = new Discord.RichEmbed()
                .addField("**👫الاوامر العامة👫**","** **")
                .addField("**AVATAR**" ,"**الاستخدام:** ``-avatar صورة حسابك ``")
                .addField("**LINK**" ,"**الاستخدام:** ``-link أرسال رابط السيرفر ``")
                .addField("**ID**" ,"**الاستخدام:** ``-id معلومات عن حسابك ``")
	        .addField("**MUSIC**" ,"**الاستخدام:** ``-music اوامر لتشغيل الاغاني ``")
                .addField("**ADMIN**" ,"**الاستخدام:** ``-admin الاوامر الادارية ``")
                .addField("**PLAYER**" ,"**الاستخدام:** ``-player لمعرفة عدد اعضاء السيرفر ``")
                .addField("**SERVER**" ,"**الاستخدام:** ``-server معلومات عن السيرفر ``")
                .addField("**INVITE**" ,"**الاستخدام:** ``-invite  لمعرفة انت كم جايب عضو ل السيرفر``")
                .addField("**PING**" ,"**الاستخدام:** ``-ping  سرعة اتصال البوت ``")
                .setColor('RANDOM')
.setColor('RANDOM')
  message.author.sendEmbed(embed);
    }
});
client.on('message', message => {
     if (message.content === ".servers") {
     let embed = new Discord.RichEmbed()
  .setColor("#0000FF")
  .addField("**Server: **" , client.guilds.size)
  message.channel.sendEmbed(embed);
    }

client.on('message', msg => {
  if (msg.content === '7892bs782bs') {
    msg.reply('s7u2bs298');
  }
});                 
if (message.content === '-admin') {
  if(!message.member.hasPermission("ADMINISTRATOR"))
 return message.channel.send('**You Dont Have Permission **' );
              var embed  = new Discord.RichEmbed()
                .addField("** 👑لاوامر الادارية👑 **","** **")
                .addField("**BAN**" ,"**الاستخدام:** ``-ban لحظر الأعضاء ``")
                .addField("**KICK**" ,"**الاستخدام:** ``-kick لطرد الأعضاء ``")
                .addField("**MUTEC**" ,"**الاستخدام:** ``-mutec ل فك قفل الشات ``")
                .addField("**UNMUTEC**" ,"**الاستخدام:** ``-unmutec ل فك قفل الشات ``")
                .addField("**MUTE**" ,"**الاستخدام:** ``-mute لعطاء الشخص ميوت ``")
                .addField("**UNMUTE**" ,"**الاستخدام:** ``-unmute لفك الميوت عن الشخص ``")
                .addField("**CV**" ,"**الاستخدام:** ``-cv انشاء روم صوتي ``")
                .addField("**CT**" ,"**الاستخدام:** ``-ct انشاء روم كتابي ``")
                .addField("**DC**" ,"**الاستخدام:** ``-cd لمسح روم صوتي او كتابي  ``")
                .addField("**CLEAR**" ,"**الاستخدام:** ``-clear مسح بعدد ``")
		.addField("**BC**" ,"**الاستخدام:** ``-bc ارسال رسالة لجميع الي في السيرفر ``")
                .setColor('RANDOM')
.setColor('RANDOM')
  message.author.sendEmbed(embed);
    }
});
client.on('message', message => {
    var args = message.content.split(/[ ]+/)
    if(message.content.includes('discord.gg')){
      if(!message.member.hasPermission('ADMINISTRATOR'))
        message.delete()
    return message.reply(`** No Invite Links :angry: ! **`)
    }
});
client.on("message", message => {
  if (message.author.bot) return;
 
  let command = message.content.split(" ")[0];
 
  if (command === "-unmute") {
        if (!message.member.hasPermission('MANAGE_ROLES')) return message.reply("You Dont Have Permission").catch(console.error);
  let user = message.mentions.users.first();
  let modlog = client.channels.find('name', 'log');
  let muteRole = client.guilds.get(message.guild.id).roles.find('name', 'Muted');
  if (!muteRole) return message.reply("** لا يوجد رتبة الميوت 'Muted' **").catch(console.error);
  if (message.mentions.users.size < 1) return message.reply('** يجب عليك المنشن اولاً **').catch(console.error);
  const embed = new Discord.RichEmbed()
    .setColor(0x00AE86)
    .setTimestamp()
    .addField('الأستعمال:', 'اسكت/احكي')
    .addField('تم فك الميوت عن:', `${user.username}#${user.discriminator} (${user.id})`)
    .addField('بواسطة:', `${message.author.username}#${message.author.discriminator}`)
 
  if (!message.guild.member(client.user).hasPermission('MANAGE_ROLES_OR_PERMISSIONS')) return message.reply('** You Dont Have Permission **').catch(console.error);
 
  if (message.guild.member(user).removeRole(muteRole.id)) {
      return message.reply("** تم فك الميوت عن الشخص المحدد  .. **").catch(console.error);
  } else {
    message.guild.member(user).removeRole(muteRole).then(() => {
      return message.reply("** تم فك الميوت عن الشخص المحدد .. **").catch(console.error);
    });
  }
 
};
 
});
client.on("message", message => {
  if (message.author.bot) return;
  
  let command = message.content.split(" ")[0];
  
  if (command === "-mute") {
        if (!message.member.hasPermission('MANAGE_ROLES')) return message.reply("You Dont Have Permission").catch(console.error);
  let user = message.mentions.users.first();
  let modlog = client.channels.find('name', 'log');
  let muteRole = client.guilds.get(message.guild.id).roles.find('name', 'Muted');
  if (!muteRole) return message.reply("** لا يوجد رتبة الميوت 'Muted' **").catch(console.error);
  if (message.mentions.users.size < 1) return message.reply('** يجب عليك المنشن اولاً **').catch(console.error);
  
  const embed = new Discord.RichEmbed()
    .setColor(0x00AE86)
    .setTimestamp()
    .addField('الأستعمال:', 'اسكت/احكي')
    .addField('تم ميوت:', `${user.username}#${user.discriminator} (${user.id})`)
    .addField('بواسطة:', `${message.author.username}#${message.author.discriminator}`)
   
   if (!message.guild.member(client.user).hasPermission('MANAGE_ROLES_OR_PERMISSIONS')) return message.reply('You Dont Have Permission').catch(console.error);
 
  if (message.guild.member(user).roles.has(muteRole.id)) {
     return message.reply("** تم اعطاء العضو المحدد ميوت  **").catch(console.error);
  } else {
    message.guild.member(user).addRole(muteRole).then(() => {
      return message.reply("** تم اعطاء العضو المحدد ميوت كتابي .. **").catch(console.error);
    });
  }

};

});
client.on('message', message => {
var prefix = "-"
  if (message.author.omar) return;
  if (!message.content.startsWith(prefix)) return;
  var command = message.content.split(" ")[0];
  command = command.slice(prefix.length);
  var args = message.content.split(" ").slice(1);
  if (command == "ban") {
   if(!message.channel.guild) return message.reply('** This command only for servers**');
  if(!message.guild.member(message.author).hasPermission("BAN_MEMBERS")) return message.reply("You Dont Have Permission");
if(!message.guild.member(client.user).hasPermission("BAN_MEMBERS")) return message.reply("You Dont Have Permission");
var user = message.mentions.users.first();
  var reason = message.content.split(" ").slice(2).join(" ");
  if (message.mentions.users.size < 1) return message.reply("**منشن شخص**");
  if(!reason) return message.reply ("**اكتب سبب الطرد**");
  if (!message.guild.member(user).banable) return message.reply("**لايمكنني طرد شخص اعلى من رتبتي يرجه اعطاء البوت رتبه عالي**");
  const banembed = new Discord.RichEmbed()
  .setAuthor(`BAN!`, user.displayAvatarURL)
  .setColor("RANDOM")
  .addField("**User:**",  '**[ ' + `${user.tag}` + ' ]**')
  .addField("**By:**", '**[ ' + `${message.author.tag}` + ' ]**')
  .addField("**Reason:**", '**[ ' + `${reason}` + ' ]**')
  user.send(reason).then(()=>{
message.guild.member(user).kick();
  })
}
});
client.on('message', message => {
    var prefix = "-"
  if (message.author.x5bz) return;
  if (!message.content.startsWith(prefix)) return;

  let command = message.content.split(" ")[0];
  command = command.slice(prefix.length);

  let args = message.content.split(" ").slice(1);

  if (command == "kick") {
               if(!message.channel.guild) return message.reply('** This command only for servers**');
         
  if(!message.guild.member(message.author).hasPermission("KICK_MEMBERS")) return message.reply("You Dont Have Permission");
  if(!message.guild.member(client.user).hasPermission("KICK_MEMBERS")) return message.reply("You Dont Have Permission");
  let user = message.mentions.users.first();
  let reason = message.content.split(" ").slice(2).join(" ");
  if (message.mentions.users.size < 1) return message.reply("**منشن شخص**");
  if(!reason) return message.reply ("**اكتب سبب الطرد**");
  if (!message.guild.member(user)
  .kickable) return message.reply("**لايمكنني طرد شخص اعلى من رتبتي يرجه اعطاء البوت رتبه عالي**");

  message.guild.member(user).kick();

  const kickembed = new Discord.RichEmbed()
  .setAuthor(`KICKED!`, user.displayAvatarURL)
  .setColor("RANDOM")
  .setTimestamp()
  .addField("**User:**",  '**[ ' + `${user.tag}` + ' ]**')
  .addField("**By:**", '**[ ' + `${message.author.tag}` + ' ]**')
  .addField("**Reason:**", '**[ ' + `${reason}` + ' ]**')
  message.channel.send({
    embed : kickembed
  })
}
});
client.on('message', message =>{
    let args = message.content.split(' ');
    let prefix = '-';
    
    if(args[0] === `${prefix}avatar`){
        let mentions = message.mentions.members.first()
        if(!mentions) {
          let sicon = message.author.avatarURL
          let embed = new Discord.RichEmbed()
          .setImage(message.author.avatarURL)
          .setColor("#f7abab") 
          .setDescription(`**${message.author.username}#${message.author.discriminator}**'s avatar :`);
          message.channel.send({embed})
        } else {
          let sicon = mentions.user.avatarURL
          let embed = new Discord.RichEmbed()
          .setColor("#f7abab")
          .setDescription(`**${mentions.user.username}#${mentions.user.discriminator}**'s avatar :`)
          .setImage(sicon)
          message.channel.send({embed})
        }
    };
});
  client.on('message', function(msg) {
    if(msg.content.startsWith ('-server')) {
      let embed = new Discord.RichEmbed()
      .setColor('RANDOM')
      .setThumbnail(msg.guild.iconURL)
      .setTitle(`Showing Details Of  **${msg.guild.name}*`)
      .addField('🌐** نوع السيرفر**',`[** __${msg.guild.region}__ **]`,true)
      .addField('🏅** __الرتب__**',`[** __${msg.guild.roles.size}__ **]`,true)
      .addField('🔴**__ عدد الاعضاء__**',`[** __${msg.guild.memberCount}__ **]`,true)
      .addField('🔵**__ عدد الاعضاء الاونلاين__**',`[** __${msg.guild.members.filter(m=>m.presence.status == 'online').size}__ **]`,true)
      .addField('📝**__ الرومات الكتابية__**',`[** __${msg.guild.channels.filter(m => m.type === 'text').size}__** ]`,true)
      .addField('🎤**__ رومات الصوت__**',`[** __${msg.guild.channels.filter(m => m.type === 'voice').size}__ **]`,true)
      .addField('👑**__ الأونـر__**',`**${msg.guild.owner}**`,true)
      .addField('🆔**__ ايدي السيرفر__**',`**${msg.guild.id}**`,true)
      .addField('📅**__ تم عمل السيرفر في__**',msg.guild.createdAt.toLocaleString())
      msg.channel.send({embed:embed});
    }
  });
client.on('message', message => {
    if (message.content.startsWith("-invite")) {

    message.guild.fetchInvites()
    .then(invites => message.channel.send(` انت جبت  [${invites.find(invite => invite.inviter.id === message.author.id).uses}]      عضو للسيرفر   `))
         
    }
});
   client.on('message', async message => {
            if(message.content.includes('discord.gg')){ 
                if(message.member.hasPermission("MANAGE_GUILD")) return;
        if(!message.channel.guild) return;
        message.delete()
          var command = message.content.split(" ")[0];
    let muterole = message.guild.roles.find(`name`, "Muted");
    if(!muterole){
      try{
        muterole = await message.guild.createRole({
          name: "Muted",
          color: "#000000",
          permissions:[]
        })
        message.guild.channels.forEach(async (channel, id) => {
          await channel.overwritePermissions(muterole, {
            SEND_MESSAGES: false,
            ADD_REACTIONS: false
          });
        });
      }catch(e){
        console.log(e.stack);
      }
    }
           if(!message.channel.guild) return message.reply('** This command only for servers**');
     message.member.addRole(muterole);
    const embed500 = new Discord.RichEmbed()
      .setTitle("Muted Ads")
            .addField(`**  You Have Been Muted **` , `**Reason : Sharing Another Discord Link**`)
            .setColor("c91616")
            .setThumbnail(`${message.author.avatarURL}`)
            .setAuthor(message.author.username, message.author.avatarURL)
        .setFooter(`${message.guild.name} `)
     message.channel.send(embed500)
     message.author.send('` انت معاقب ميوت شاتي بسبب نشر سرفرات ان كان عن طريق الخطا **ف** تكلم مع الادارة `');
   
       
    }
})
client.on ("guildMemberAdd", member => {
  
   var role = member.guild.roles.find ("name", "Member");
   member.addRole (role);
  
})

client.on ("guildMemberRemove", member => {
   
})
 client.on('message', message => {
    if (message.content.startsWith("رابط")) {
        message.channel.createInvite({
        thing: true,
        maxUses: 1,
        maxAge: 3600,
    }).then(invite =>
      message.author.sendMessage(invite.url)
    )
    const embed = new Discord.RichEmbed()
        .setColor("RANDOM")
          .setDescription(" تم أرسال الرابط برسالة خاصة ")
           .setAuthor(client.user.username, client.user.avatarURL)
                 .setAuthor(client.user.username, client.user.avatarURL)
                .setFooter('طلب بواسطة: ' + message.author.tag)

      message.channel.sendEmbed(embed).then(message => {message.delete(10000)})
              const Embed11 = new Discord.RichEmbed()
        .setColor("RANDOM")
        
    .setDescription(" مدة الرابط : ساعه  عدد استخدامات الرابط : 1 ")
      message.author.sendEmbed(Embed11)
    }
}); 
client.on('message', message => {
    if(message.content === 'السلام عليكم'){
        message.channel.send('وعليــكــم الــســـلام ورحــمــة الله وبركاته')
    }
});
client.on('message', message => {
    if(message.content === 'السلام عليكم ورحمة الله وبركاتة'){
        message.channel.send('وعليــكــم الــســـلام ورحــمــة الله وبركاته')
    }
});
client.on('message', message => {
    if(message.content === 'السلام عليكم و رحمة الله و بركاتة'){
        message.channel.send('وعليــكــم الــســـلام ورحــمــة الله وبركاته')
    }
});
client.on('message', message => {
    if(message.content === 'سلام عليكم'){
        message.channel.send('وعليــكــم الــســـلام ورحــمــة الله وبركاته')
    }
});
client.on('message', message => {
              if (!message.channel.guild) return;
      if(message.content =='-player')
      var SaifDz = new Discord.RichEmbed()
      .setThumbnail(message.author.avatarURL)
      .setFooter(message.author.username, message.author.avatarURL)
      .setTitle('🌷| Members info')
      .addBlankField(true)
      .addField('عدد اعضاء السيرفر',`${message.guild.memberCount}`)
      message.channel.send(SaifDz);
    });
					client.on('message', message => {

       if(message.content ==="-mutec") {
                           if(!message.channel.guild) return message.reply('** This command only for servers**');

   if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.reply('You Dont Have Permission');
              message.channel.overwritePermissions(message.guild.id, {
            SEND_MESSAGES: false

              }).then(() => {
                  message.reply("** تم قفل الشات :white_check_mark: **")
              });
                }

    if(message.content === "-unmutec") {
                        if(!message.channel.guild) return message.reply('** This command only for servers**');

   if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.reply('You Dont Have Permission');
              message.channel.overwritePermissions(message.guild.id, {
            SEND_MESSAGES: true

              }).then(() => {
                  message.reply("**تم فتح الشات:white_check_mark:**")
              });
                }
                
                
});
client.on("message", (message) => {
if (message.content.startsWith("-ct")) {
            if (!message.member.hasPermission('MANAGE_CHANNELS')) return message.reply("You Dont Have Permission");
        let args = message.content.split(" ").slice(1);
	let modlog = client.channels.find('name', 'log');
    message.guild.createChannel(args.join(' '), 'text');
message.channel.sendMessage('تـم إنـشاء روم كـتابـي')

}
});
client.on("message", (message) => {
if (message.content.startsWith("-cv")) {
            if (!message.member.hasPermission('MANAGE_CHANNELS')) return message.reply("You Dont Have Permission");
        let args = message.content.split(" ").slice(1);
    message.guild.createChannel(args.join(' '), 'voice');
    message.channel.sendMessage('تـم إنـشاء روم صـوتي')
    
}
});
client.on("message", (message) => {
    if (message.content.startsWith('-dc')) {
        if (!message.member.hasPermission('MANAGE_CHANNELS')) return message.reply("You Dont Have Permission");

        let args = message.content.split(' ').slice(1);
        let channel = message.client.channels.find('name','log')
        if (!channel) return message.reply('**لا يوجد روم بهذا الاسم**').catch(console.error);
        channel.delete()
    }
});
client.on('message', message => {
	var prefix = '-'; 
    let args = message.content.split(" ").slice(1);
    if (message.author.bot) return;
    if (!message.channel.guild) return;
    if (message.content.startsWith(prefix + 'clear')) {
	  if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.reply('You Dont Have Permission');

        if (isNaN(args[0])) return message.channel.send('**Please supply a valid amount of messages to clear**');
        if (args[0] > 100) return message.channel.send('**Please supply a number less than 100**');

        message.channel.bulkDelete(args[0])
            .then(messages => message.channel.send(`**Successfully deleted \`${messages.size}/${args[0]}\` messages**`).then(msg => msg.delete({
                timeout: 5000
            })))
    }
});
client.on('message', message => {
	if(message.content.startsWith('-quran')) {
		message.delete();
    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) return message.reply(`**يحب ان تكون في روم صوتي**`);

	let embed = new Discord.RichEmbed()
    .setAuthor(`${message.author.tag}`, message.author.avatarURL)
	.setColor('#000000')
	.setFooter("بوت القرآن | صدقة جارية للجميع", 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiqVT5PZAfcy8qZxlr3SQv3mmCw9zPiu2YBLIQ4bBePL2jLm7h')
      .setDescription(` 
     🕋 اوامر بوت القرآن الكريم 🕋
	 
🇦 القرآن كاملاً ماهر المعيقلي
🇧 سورة البقرة كاملة للشيخ مشاري العفاسي
🇨 سورة الكهف كاملة بصوت مشارى بن راشد العفاسي
⏹ لإيقاف القرآن الكريم
🇩 القرآن كاملاً عبدالباسط عبدالصمد
🇪 القرآن كاملاً ياسر الدوسري
🇫 سورة الواقعه بصوت الشيخ مشاري بن راشد العفاسي`)
	
	message.channel.sendEmbed(embed).then(msg => {
			msg.react('🇦')
		.then(() => msg.react('🇧'))
		.then(() => msg.react('🇨'))
		.then(() => msg.react('⏹'))
		.then(() => msg.react('🇩'))
		.then(() => msg.react('🇪'))
		.then(() => msg.react('🇫'))

// Filters		
	let filter1 = (reaction, user) => reaction.emoji.name === '🇦' && user.id === message.author.id;
	let filter2 = (reaction, user) => reaction.emoji.name === '🇧' && user.id === message.author.id;
	let filter3 = (reaction, user) => reaction.emoji.name === '🇨' && user.id === message.author.id;
	let filter4 = (reaction, user) => reaction.emoji.name === '⏹' && user.id === message.author.id;
	let filter5 = (reaction, user) => reaction.emoji.name === '🇩' && user.id === message.author.id;
	let filter6 = (reaction, user) => reaction.emoji.name === '🇪' && user.id === message.author.id;
	let filter7 = (reaction, user) => reaction.emoji.name === '🇫' && user.id === message.author.id;

// Collectors
	let collector1 = msg.createReactionCollector(filter1, { time: 120000 });
	let collector2 = msg.createReactionCollector(filter2, { time: 120000 });
	let collector3 = msg.createReactionCollector(filter3, { time: 120000 });
	let collector4 = msg.createReactionCollector(filter4, { time: 120000 });
	let collector5 = msg.createReactionCollector(filter5, { time: 120000 });
	let collector6 = msg.createReactionCollector(filter6, { time: 120000 });
	let collector7 = msg.createReactionCollector(filter7, { time: 120000 });
	
// Events
collector1.on('collect', r => {
    voiceChannel.join()
      .then(connnection => {
        const stream = ytdl("https://www.youtube.com/watch?v=Ktync4j_nmA", { filter: 'audioonly' });
        const dispatcher = connnection.playStream(stream);
        dispatcher.on('end', () => voiceChannel.leave());
		collector1.stop();
		collector2.stop();
		collector3.stop();
		collector4.stop();
		collector5.stop();
		collector6.stop();
		collector7.stop();
		embed.setDescription(`<@${message.author.id}> **تم تشغيل القرآن الكريم**`);
		msg.edit(embed).then(msg.delete(5000));
   });
});
collector2.on('collect', r => {
    voiceChannel.join()
      .then(connnection => {
        const stream = ytdl("https://www.youtube.com/watch?v=qFq5h4wtjaM&t=30s", { filter: 'audioonly' });
        const dispatcher = connnection.playStream(stream);
        dispatcher.on('end', () => voiceChannel.leave());
		collector1.stop();
		collector2.stop();
		collector3.stop();
		collector4.stop();
		collector5.stop();
		collector6.stop();
		collector7.stop();
		embed.setDescription(`<@${message.author.id}> **تم تشغيل القرآن الكريم**`);
		msg.edit(embed).then(msg.delete(5000));
      });
});
collector3.on('collect', r => {
    voiceChannel.join()
      .then(connnection => {
        const stream = ytdl("https://www.youtube.com/watch?v=8UWKiKGQmsE", { filter: 'audioonly' });
        const dispatcher = connnection.playStream(stream);
        dispatcher.on('end', () => voiceChannel.leave());
		collector1.stop();
		collector2.stop();
		collector3.stop();
		collector4.stop();
		collector5.stop();
		collector6.stop();
		collector7.stop();
		embed.setDescription(`<@${message.author.id}> **تم تشغيل القرآن الكريم**`);
		msg.edit(embed).then(msg.delete(5000));
      });
});
collector4.on('collect', r => {
	if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
		collector1.stop();
		collector2.stop();
		collector3.stop();
		collector4.stop();
		collector5.stop();
		collector6.stop();
		collector7.stop();
		embed.setDescription(`<@${message.author.id}> **تم إيقاف القرآن الكريم**`);
		msg.edit(embed).then(msg.delete(5000));
});
collector5.on('collect', r => {
    voiceChannel.join()
      .then(connnection => {
        const stream = ytdl("https://www.youtube.com/watch?v=vqXLGtZcUm8", { filter: 'audioonly' });
        const dispatcher = connnection.playStream(stream);
        dispatcher.on('end', () => voiceChannel.leave());
		collector1.stop();
		collector2.stop();
		collector3.stop();
		collector4.stop();
		collector5.stop();
		collector6.stop();
		collector7.stop();
		embed.setDescription(`<@${message.author.id}> **تم تشغيل القرآن الكريم**`);
		msg.edit(embed).then(msg.delete(5000));
      });
});
collector6.on('collect', r => {
    voiceChannel.join()
      .then(connnection => {
        const stream = ytdl("https://www.youtube.com/watch?v=WYT0pQne-7w", { filter: 'audioonly' });
        const dispatcher = connnection.playStream(stream);
        dispatcher.on('end', () => voiceChannel.leave());
		collector1.stop();
		collector2.stop();
		collector3.stop();
		collector4.stop();
		collector5.stop();
		collector6.stop();
		collector7.stop();
		embed.setDescription(`<@${message.author.id}> **تم تشغيل القرآن الكريم**`);
		msg.edit(embed).then(msg.delete(5000));
      });
});
collector7.on('collect', r => {
    voiceChannel.join()
      .then(connnection => {
        const stream = ytdl("https://www.youtube.com/watch?v=LTRcg-gR78o", { filter: 'audioonly' });
        const dispatcher = connnection.playStream(stream);
        dispatcher.on('end', () => voiceChannel.leave());
		collector1.stop();
		collector2.stop();
		collector3.stop();
		collector4.stop();
		collector5.stop();
		collector6.stop();
		collector7.stop();
		embed.setDescription(`<@${message.author.id}> **تم تشغيل القرآن الكريم**`);
		msg.edit(embed).then(msg.delete(5000));
      });
});
})
}
});
client.on('message', message => {
     if(message.content.startsWith(prefix + "clear")) {
         var args = message.content.split(" ").slice(1);
 if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.reply('You Dont Have Permission');
  if (!args[0]) return message.channel.send('You didn\'t provide any number!!!');

  message.channel.bulkDelete(args[0]).then(() => {
    const embed = new Discord.RichEmbed()
      .setColor(0xF16104)
      .setDescription(`Cleared ${args[0]} messages.`);
    message.channel.send({ embed });

    const actionlog = message.guild.channels.find('name', 'log');

    if (!actionlog) return message.channel.send('Cant find log channel. Are you sure that this channel exists and I have permission to view it? **CANNOT POST LOG.**');
    const embedlog = new Discord.RichEmbed()
      .setDescription('CLEAR')
      .setColor(0xF16104)
      .addField('Cleared By', `<@${message.author.id}> with ID ${message.author.id}`)
      .addField('Cleared in', message.channel)
      .addField('Time', message.createdAt);
    actionlog.send(embedlog);
   
  });
};

});
client.on('message' , message => {
  var prefix = "-";
  if(message.author.bot) return;
  if(message.content.startsWith(prefix + "ping")) {
 message.channel.send('Pong...').then((msg) => {
      msg.edit(`\`\`\`javascript\nTime taken: ${msg.createdTimestamp - message.createdTimestamp} ms.\nDiscord API: ${Math.round(client.ping)} ms.\`\`\``);
 })
  }  
 });
 client.on('guildMemberRemove', member => {
  const channel = member.guild.channels.find('name', 'welcome');
  if (!channel) return;
  channel.send(`الله يستر عليك, ${member}`);
  
})
   client.on("deleteChannel",  dc => {
  const channel = dc.guild.channels.find("name", "log")
  if(channel) {
  var embed = new Discord.RichEmbed()
  .setTitle(dc.guild.name)
  .setDescription(`***Channel Deleted Name : *** **${dc.name}**`)
  .setColor(`RANDOM`)
  .setTimestamp(); 
  channel.sendEmbed(embed)
  }
  });
client.on("roleCreate", rc => {
  const channel = rc.guild.channels.find("name", "log")
  if(channel) {
  var embed = new Discord.RichEmbed()
  .setTitle(rc.guild.name)
  .setDescription(`***Created Role Name : *** **${rc.name}** `)
  .setColor(`RANDOM`)
  .setTimestamp(); 
  channel.sendEmbed(embed)
  }
  });
  client.on("guildBanAdd", (guild, member) => {
  client.setTimeout(() => {
    guild.fetchAuditLogs({
        limit: 1,
        type: 22
      })
      .then(audit => {
        let exec = audit.entries.map(a => a.executor.username);
        try {
          let log = guild.channels.find('name', 'log');
          if (!log) return;
          client.fetchUser(member.id).then(myUser => {
          let embed = new Discord.RichEmbed()
        .setAuthor(exec)
        .setThumbnail(myUser.avatarURL)
        .addField('- Banned User:',`**${myUser.username}**`,true)
        .addField('- Banned By:',`**${exec}**`,true)
        .setFooter(myUser.username,myUser.avatarURL)
            .setTimestamp();
          log.send(embed).catch(e => {
            console.log(e);
          });
          });
        } catch (e) {
          console.log(e);
        }
      });
  }, 1000);
});
client.on("roleDelete", role => {
  client.setTimeout(() => {
    role.guild.fetchAuditLogs({
        limit: 1,
        type: 30
      })
      .then(audit => {
        let exec = audit.entries.map(a => a.executor.username)
        try {

          let log = role.guild.channels.find('name', 'log');
          if (!log) return;
          let embed = new Discord.RichEmbed()
            .setColor('#fd0101')            
            .setTitle('❌ RoleDeleted')
            .addField('اسم الرتبة:', role.name, true)
            .addField('أيدي الرتبة:', role.id, true)
            .addField('تم مسح الرتبة من قبل:', exec, true)
            .setTimestamp()
          log.send(embed).catch(e => {
            console.log(e);
          });
        } catch (e) {
          console.log(e);
        }
      })
  }, 1000)
})
client.on('messageDelete', message => {
    if (!message || !message.id || !message.content || !message.guild || message.author.bot) return;
    const channel = message.guild.channels.find('name', 'log');
    if (!channel) return;
    
    let embed = new Discord.RichEmbed()
       .setAuthor(`${message.author.tag}`, message.author.avatarURL)
       .setColor('BLACK')
       .setDescription(`🗑️ **حذف رساله**
**ارسلها <@${message.author.id}>                                                                                                                        تم حذفها في شات** <#${message.channel.id}>\n\n \`${message.cleanContent}\``)
       .setTimestamp();
     channel.send({embed:embed});

});
client.on('messageUpdate', (message, newMessage) => {
    if (message.content === newMessage.content) return;
    if (!message || !message.id || !message.content || !message.guild || message.author.bot) return;
    const channel = message.guild.channels.find('name', 'log');
    if (!channel) return;

    let embed = new Discord.RichEmbed()
       .setAuthor(`${message.author.tag}`, message.author.avatarURL)
       .setColor('SILVER')
       .setDescription(`✏ **تعديل رساله
ارسلها <@${message.author.id}>                                                                                                                         تم تعديلها في شات** <#${message.channel.id}>\n\nقبل التعديل:\n \`${message.cleanContent}\`\n\nبعد التعديل:\n \`${newMessage.cleanContent}\``)
       .setTimestamp();
     channel.send({embed:embed});


});;
client.on("guildMemberAdd", member => {
  member.createDM().then(function (channel) {
  return channel.send(`:rose:  ولكم نورت السيرفر:rose: 
:crown:${member}:crown:
انت العضو رقم ${member.guild.memberCount} `) 
}).catch(console.error)
});
client.on('guildMemberRemove', member => {
    if (!member || !member.id || !member.guild) return;
    const guild = member.guild;
	
    const channel = member.guild.channels.find('name', 'log');
    if (!channel) return;
    let memberavatar = member.user.avatarURL
    
    let embed = new Discord.RichEmbed()
       .setAuthor(`${member.user.tag}`, member.user.avatarURL)
	   .setThumbnail(memberavatar)
       .setColor('RED')
       .setDescription(`📤 <@${member.user.id}> **خرج من السيرفر**\n\n`)
       .setTimestamp();
     channel.send({embed:embed});
});
client.on('guildMemberAdd', member => {
    if (!member || !member.id || !member.guild) return;
    const guild = member.guild;
	
    const channel = member.guild.channels.find('name', 'log');
    if (!channel) return;
    let memberavatar = member.user.avatarURL
    const isNew = (new Date() - member.user.createdTimestamp) < 900000 ? '🆕' : '';
    
    let embed = new Discord.RichEmbed()
       .setAuthor(`${member.user.tag}`, member.user.avatarURL)
	   .setThumbnail(memberavatar)
       .setColor('GREEN')
       .setDescription(`📥 <@${member.user.id}> **دخل السيرفر**\n\n`)
       .setTimestamp();
     channel.send({embed:embed});
});
 client.on('voiceStateUpdate', (oldM, newM) => {
  let m1 = oldM.serverMute;
  let m2 = newM.serverMute;
   let d1 = oldM.serverDeaf;
  let d2 = newM.serverDeaf;
   let ch = oldM.guild.channels.find('name', 'log')
  if(!ch) return;
     oldM.guild.fetchAuditLogs()
    .then(logs => {
       let user = logs.entries.first().executor
     if(m1 === false && m2 === true) {
       let embed = new Discord.RichEmbed()
       .setAuthor(`${newM.user.tag}`, newM.user.avatarURL)
       .setDescription(`${newM} has muted in server`)
       .setFooter(`By : ${user}`)
        ch.send(embed)
    }
    if(m1 === true && m2 === false) {
       let embed = new Discord.RichEmbed()
       .setAuthor(`${newM.user.tag}`, newM.user.avatarURL)
       .setDescription(`${newM} has unmuted in server`)
       .setFooter(`By : ${user}`)
       .setTimestamp()
        ch.send(embed)
    }
    if(d1 === false && d2 === true) {
       let embed = new Discord.RichEmbed()
       .setAuthor(`${newM.user.tag}`, newM.user.avatarURL)
       .setDescription(`${newM} has deafened in server`)
       .setFooter(`By : ${user}`)
       .setTimestamp()
        ch.send(embed)
    }
    if(d1 === true && d2 === false) {
       let embed = new Discord.RichEmbed()
       .setAuthor(`${newM.user.tag}`, newM.user.avatarURL)
       .setDescription(`${newM} has undeafened in server`)
       .setFooter(`By : ${user}`)
       .setTimestamp()
        ch.send(embed)
    }
  })
});
client.on('message' , message => {
    var prefix = "-";
    let user = message.mentions.users.first()|| client.users.get(message.content.split(' ')[1])
    if(message.content.startsWith(prefix + 'unban')) {
        if(!user) return  message.channel.send(`Do this ${prefix} <@ID user> \n or \n ${prefix}unban ID user`);
        message.guild.unban(user);
        message.guild.owner.send(`لقد تم فك الباند عن الشخص \n ${user} \n By : <@${message.author.id}>`)
        var embed = new Discord.RichEmbed()
        .setThumbnail(message.author.avatarURl)
        .setColor("RANDOM")
        .setTitle('**●Unban** !')
        .addField('**●User Unban :** ', `${user}` , true)
        .addField('**●By :**' ,       ` <@${message.author.id}> ` , true)
        .setAuthor(message.guild.name)
        message.channel.sendEmbed(embed)
    }
});
client.on('guildMemberAdd',async member => {
  const Canvas = require('canvas');
  const jimp = require('jimp');
       const w = ['welcome.png'];
		  
        let Image = Canvas.Image,
            canvas = new Canvas(800, 300),
            ctx = canvas.getContext('2d');
        ctx.patternQuality = 'bilinear';
        ctx.filter = 'bilinear';
        ctx.antialias = 'subpixel';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 2;
        ctx.stroke();
        ctx.beginPath();
 
        fs.readFile(`${w[Math.floor(Math.random() * w.length)]}`, function (err, Background) {
            if (err) return console.log(err);
            let BG = Canvas.Image;
            let ground = new Image;
            ground.src = Background;
            ctx.drawImage(ground, 0, 0, 800, 300);
 
})
 
                let url = member.user.displayAvatarURL.endsWith(".webp") ? member.user.displayAvatarURL.slice(5, -20) + ".png" : member.user.displayAvatarURL;
                jimp.read(url, (err, ava) => {
                    if (err) return console.log(err);
                    ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
                 if (err) return console.log(err);
 
          ctx.font = '36px Cairo';
          ctx.fontSize = '72px';
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(member.user.username, 545, 177);
         
          ctx.font = '16px Cairo Bold';
          ctx.fontSize = '72px';
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(`${member.guild.memberCount} Members`, 580, 200);
         
          let Avatar = Canvas.Image;
          let ava = new Avatar;
          ava.src = buf;
          ctx.beginPath();
          ctx.arc(169.5, 148, 126.9, -100, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(ava, 36, 21, 260, 260);
           
          const c = client.channels.find('name', 'welcome');
          c.sendFile(canvas.toBuffer());
 
});
});
});
	client.on('message', message => {
    if(message.content == (prefix + 'id')) {    
 
             if (message.channel.type === 'dm') return message.reply('This Command Is Not Avaible In Dm\'s :x:');   
            var Canvas = module.require('canvas');
            var jimp = module.require('jimp');
    
     const w = ['./ID1.png', './ID2.png', './ID3.png', './ID4.png', './ID5.png', './ID6.png', './ID7.png', './ID8.png', './ID9.png', './ID10.png', './ID11.png', './ID12.png', './ID13.png',];
    
             let Image = Canvas.Image,
                 canvas = new Canvas(802, 404),
                 ctx = canvas.getContext('2d');
             ctx.patternQuality = 'bilinear';
             ctx.filter = 'bilinear';
             ctx.antialias = 'subpixel';
             ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
             ctx.shadowOffsetY = 2;
             ctx.shadowBlur = 2;
             fs.readFile(`${w[Math.floor(Math.random() * w.length)]}`, function (err, Background) {
                 if (err) return console.log(err);
                 let BG = Canvas.Image;
                 let ground = new Image;
                 ground.src = Background;
                 ctx.drawImage(ground, 0, 0, 802, 404);
    
     })
                                let user = message.mentions.users.first();
          var men = message.mentions.users.first();
             var heg;
             if(men) {
                 heg = men
             } else {
                 heg = message.author
             }
           var mentionned = message.mentions.members.first();
              var h;
             if(mentionned) {
                 h = mentionned
             } else {
                 h = message.member
             }
             var ment = message.mentions.users.first();
             var getvalueof;
             if(ment) {
               getvalueof = ment;
             } else {
               getvalueof = message.author;
             }//ما خصك ,_,
                                           let url = getvalueof.displayAvatarURL.endsWith(".webp") ? getvalueof.displayAvatarURL.slice(5, -20) + ".png" : getvalueof.displayAvatarURL;
                                             jimp.read(url, (err, ava) => {
                                                 if (err) return console.log(err);
                                                 ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
                                                     if (err) return console.log(err);
                            
                                                                                           //Avatar
                                                             let Avatar = Canvas.Image;
                                                             let ava = new Avatar;
                                                             ava.src = buf;
                                                             ctx.beginPath();
                                                           ctx.drawImage(ava, 320, 3, 160, 169);
                                                                            //wl
                                                     ctx.font = '35px Arial Bold';
                                                     ctx.fontSize = '40px';
                                                     ctx.fillStyle = "#dadada";
                                                     ctx.textAlign = "center";
                                                    
                            
                                                     ctx.font = '30px Arial Bold';//Name ,_,
                                                     ctx.fontSize = '30px';
                                                     ctx.fillStyle = "#ffffff";
                                                                             ctx.fillText(`${getvalueof.username}`,655, 170);
                                                                            
                                                                        
                                                          moment.locale('en-us');        
                                            
                                            
                                                                    ctx.font = '30px Arial';
                                                     ctx.fontSize = '30px';
                                                     ctx.fillStyle = "#ffffff";
                                                                             ctx.fillText(`${moment(h.joinedAt).fromNow()}`,150, 305);
                                                              
                                                              
                                                                                                     ctx.font = '30px Arial';
                                                     ctx.fontSize = '30px';
                                                     ctx.fillStyle = "#ffffff";
                                                                 ctx.fillText(`${moment(heg.createdTimestamp).fromNow()}`,150, 170); 
                            
                                                       let status;
     if (getvalueof.presence.status === 'online') {
         status = 'online';
     } else if (getvalueof.presence.status === 'dnd') {
         status = 'dnd';
     } else if (getvalueof.presence.status === 'idle') {
         status = 'idle';
     } else if (getvalueof.presence.status === 'offline') {
         status = 'offline';
     }
     
     
                                          ctx.cont = '35px Arial';
                                          ctx.fontSize = '30px';
                                          ctx.filleStyle = '#ffffff'
                                          ctx.fillText(`${status}`,655,305)
                  
                                                                   ctx.font = 'regular 30px Cairo';
                                                                   ctx.fontSize = '30px';
                                                                   ctx.fillStyle = '#ffffff'
                                                         ctx.fillText(`${h.presence.game === null ? "Don't Play" : h.presence.game.name}`,390,390);
                            
                               ctx.font = '35px Arial';
                                                                   ctx.fontSize = '30px';
                                                                   ctx.fillStyle = '#ffffff'
                                                                   ctx.fillText(`#${heg.discriminator}`,390,260)
                            
                                 ctx.beginPath();
                                 ctx.stroke();
                               message.channel.sendFile(canvas.toBuffer());
                            
                            
                          
                            
                             })
                            
                             })
 }
 });
client.on('ready', function(){
  console.log('SOD is Online');
  require("./antispam.js")(client, function(message){
     message.delete().then(loloz => {
     message.channel.send("لا تسوي سبام").then(spammer => {
     spammer.delete(2000)
   });
   });
  });
});
client.on("message", async message => {
  
  if(!message.member.hasPermission("ADMINISTRATOR")) {
    if(/(?:Heroku?:\/)?discord(?:app.com\/invite|.gg)/gi.test(message.content)) {
        message.delete();
        let inviteEmbed = new Discord.RichEmbed()
  
        .setDescription("__**Auto Suppression**__")
        .addField("> Envoyé par :", `<@${message.author.id}> avec l'ID ${message.author.id}`)
        .addField("> Suppression dans :", message.channel)
        .addField(`> Reasson :`, `Envoie une invitation discord : ${message.content}`)
        .setColor(violet);
  
        let incidentchannel = message.guild.channels.find(`name`, "log");
        if(!incidentchannel) return message.channel.send("⛔ Je n'est pas trouvé le channel 'logs' !");
        return incidentchannel.send(inviteEmbed);
    }
  }
  });
let daily = JSON.parse(fs.readFileSync("./daily.json", "utf8")); // يقرا ملف jso
let rep = JSON.parse(fs.readFileSync("./rep.json", "utf8"));

const sql = require("sqlite");
sql.open("./score.sqlite");

client.on("message", message => {
if(!daily[message.author.id]) {
    daily[message.author.id] = {
        getDaily: false,
        dayClaimed: ''
    }
}
let conf = daily[message.author.id];

  if (message.author.bot) return;
  if (message.channel.type !== "text") return;

  sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
    if (!row) {
      sql.run("INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)", [message.author.id, 2, 0]);
    } else {
      let curLevel = Math.floor(0.2 * Math.sqrt(row.points + 1));
      if (curLevel > row.level) {
        row.level = curLevel;
        sql.run(`UPDATE scores SET points = ${row.points + 1}, level = ${row.level} WHERE userId = ${message.author.id}`);

        var Canvas = require('canvas')
var jimp = require('jimp')
const w = ['./img/up1.png','./img/up2.png','./img/up.png'];

        let Image = Canvas.Image,
            canvas = new Canvas(88, 110),
            Ui = canvas.getContext('2d');
        Ui.patternQuality = 'bilinear';
        Ui.filter = 'bilinear';
        Ui.antialias = 'subpixel';
        Ui.shadowColor = 'rgba(0, 0, 0, 0.4)';
        Ui.shadowOffsetY = 2;
        Ui.shadowBlur = 2;
        fs.readFile(`${w[Math.floor(Math.random() * w.length)]}`, function (err, Background) {
            if (err) return console.log(err);
            let BG = Canvas.Image;
            let ground = new BG;
            ground.src = Background;
            Ui.drawImage(ground, 0, 0, 88, 110); // 0, 0, 207, 176

})

                let url = message.author.displayAvatarURL.endsWith(".webp") ? message.author.displayAvatarURL.slice(5, -20) + ".gif" : message.author.displayAvatarURL;
                jimp.read(url, (err, ava) => {
                    if (err) return console.log(err);
                    ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
                        if (err) return console.log(err);
                        let Avatar = Canvas.Image;
                    /*    Ui.arc(80,80,50,0,2*Math.PI);
                        Ui.clip();*/
                        let ava = new Avatar;
                        ava.src = buf;
                        Ui.drawImage(ava, 19, 3, 52, 50);
                        Ui.font = 'bold 30px Helvetica';
                        Ui.fontSize = '30px';
                        Ui.fillStyle = "#c4bdbd";
                        Ui.textAlign = "center";
                        Ui.fillText(`${row.level}`, 45, 105);
                    message.channel.send(`:up: ** |  ${message.author.username}    Level Up! To ${row.level} ** `, {file: canvas.toBuffer()});
                  });
         });
      }
      sql.run(`UPDATE scores SET points = ${row.points + 1} WHERE userId = ${message.author.id}`);
    }
  }).catch(() => {
    console.error;
    sql.run("CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)").then(() => {
      sql.run("INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)", [message.author.id, 1, 1]);
    });
  });

  if (!message.content.startsWith(prefix)) return;

  if (message.content.startsWith(prefix + "لفل")) {
   if(!message.channel.guild) return;
    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
      if (!row) return message.reply("Your current level is 0");
             const embed32 = new Discord.RichEmbed()
  .setAuthor(` `,client.user.avatarURL)
  .setColor("GRAY")
  .setAuthor(message.user.displayAvatarURL)

  .addField("**Level:**",`${row.level}`,true)
  .setFooter(`${prefix}ترتيبك || `)
  message.reply("Your Level");
 message.channel.sendEmbed(embed32);
 console.log('[level] Send By: ' + message.author.username)
    });
  }

  if (message.content.startsWith(prefix + "هدية")) {
       if(!message.channel.guild) return message.reply('** This command only for servers**');
    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
        if (!row) return message.reply("sadly you do not have any points yet!");
             sql.run(`UPDATE scores SET points = ${row.points + 500} WHERE userId = ${message.author.id}`);
              if(conf.getDaily == false) {
                  row.points + '500';
            message.channel.send(` **:ballot_box_with_check:  |  ${message.author.username} , You Have Add ${'`500$`'} to your account :credit_card:  **`)
                  conf.getDaily = true;
                  const d = new Date();
                 const day = d.getDate()
                  conf.dayClaimed = day;
              } else {
                  sql.run(`UPDATE scores SET points = ${row.points + 0} WHERE userId = ${message.author.id}`);
                  message.channel.send(` **⏰ |  ${message.author.username} , To get Agin come back  ${moment().endOf('day').fromNow()}**`);
              }

              const d = new Date();
              const day = d.getDate();

              if(conf.dayClaimed + 1) {
                  conf.getDaily = true;
              }

              // نجرب ض1؟
                    message.react("💳")

    });
  }

  if(message.content.startsWith(prefix+'تشفير')){
     //  if(!message.channel.guild) return message.reply('** This command only for servers**');
      const hex = require('hex.js');
      const args = message.content.split(' ').slice(1).join(' ');
      message.channel.send('تم التشفير: '+hex.hex(args));
  }

  if(message.content.startsWith(prefix+'فك')){
       if(!message.channel.guild) return message.reply('** This command only for servers**');
      const hex = require('hex.js');
      const args = message.content.split(' ').slice(1).join(' ');

      message.channel.send('تم فك التشفير: '+hex.unHex(args));

  }



    if (message.content.startsWith(prefix + "فلوس")) {
       if(!message.channel.guild) return;
      var ment = message.mentions.members.first();
      var getvalueof;
      if(ment) {
        getvalueof = ment;
      } else {
        getvalueof = message.author;
      }
      sql.get(`SELECT * FROM scores WHERE userId ="${getvalueof.id}"`).then(row => {
        if (!row) return message.reply("sadly you do not have any points yet!");
        message.channel.send(getvalueof.toString()+',** your :credit_card: balance is '+'`$'+`${row.points}`+'`**');
        console.log('[credit] Send By: ' + message.author.username)
      });
    }
    fs.writeFile("./daily.json", JSON.stringify(daily), (err) => {
    if (err) console.error(err)
  });
  });





client.pointsMonitor = (dateformat, message) => {
  if (message.channel.type !=='text') return;
  const settings = client.settings.get(message.guild.id);
  if (message.content.startsWith(settings.prefix)) return;
  const score = client.points.get(message.author.id) || { points: 1, level: 1 };
  score.points++;
  const curLevel = Math.floor(0.2 * Math.sqrt(score.points));
  if (score.level < curLevel) {
        message.channel.send(`حظا جيدا <@!${message.author.id}> لقد وصـلت الـى لفل ${curLevel} `);
    score.level = curLevel;
  }
client.points.set(message.author.id, score);
};
let points = JSON.parse(fs.readFileSync("./points.json", "utf8"));
client.on("message", message => {
  if (!message.content.startsWith(prefix)) return;
  if (message.author.bot) return;

  if (!points[message.author.id]) points[message.author.id] = {
    points: 0,
    level: 0
  };
  let userData = points[message.author.id];
  userData.points++;

  let curLevel = Math.floor(0.1 * Math.sqrt(userData.points));
  if (curLevel > userData.level) {

    userData.level = curLevel;
  //  message.reply(`You"ve leveled up to level **${curLevel}**! Ain"t that dandy?`);
  }

 // if (message.content.startsWith(prefix + "level")) {
    //message.reply(`You are currently level ${userData.level}, with ${userData.points} points.`);

  fs.writeFile("./points.json", JSON.stringify(points), (err) => {
    if (err) console.error(err)
  });

});
client.on("message",  message => {
    if(message.content.startsWith(prefix + 'ترتيبي')) {
         if(!message.channel.guild) return message.reply('** This command only for servers**');
     var ment = message.mentions.users.first();
      var getvalueof;
      if(ment) {
        getvalueof = ment;
      } else {
        getvalueof = message.author;
      }
  let userData = points[message.author.id];
           var Canvas = require('canvas')
var jimp = require('jimp')
const snumber = require('short-number')
         sql.get(`SELECT * FROM scores WHERE userId ="${getvalueof.id}"`).then(row => {
message.channel.startTyping(1)
const w = ['./img/rank.png'];
      let Image = Canvas.Image,
          canvas = new Canvas(360, 100),
          ctx = canvas.getContext('2d');
      ctx.patternQuality = 'bilinear';
      ctx.filter = 'bilinear';
      ctx.antialias = 'subpixel';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 2;
      fs.readFile(`${w[Math.floor(Math.random() * w.length)]}`, function (err, Background) {
          if (err) return console.log(err);
          let BG = Canvas.Image;
          let ground = new Image;
          ground.src = Background;
          ctx.drawImage(ground, 0, 0, 360, 100);
});
              let url = getvalueof.displayAvatarURL.endsWith(".webp") ? getvalueof.displayAvatarURL.slice(5, -20) + ".png" : getvalueof.displayAvatarURL;
              jimp.read(url, (err, ava) => {
                  if (err) return console.log(err);
                  ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
                      if (err) return console.log(err);
                      let Avatar = Canvas.Image;
                      let ava = new Avatar;
                      ava.src = buf;
                      ctx.drawImage(ava, 8, 7, 86, 86);
                      if (!row) return message.reply("**Your Level Is 0 , Try .daily , Then Try This Command **");
                      ctx.font = '20px Cairo';
                      ctx.fontSize = '20px';
                      ctx.fillStyle = "#FFFFFF";
                      ctx.textAlign = "center";
                      ctx.fillText(snumber(row.points), 263, 45);
                      ctx.font = '20px Cairo';
                      ctx.fontSize = '20px';
                      ctx.fillStyle = "#FFFFFF";
                      ctx.textAlign = "center";
                      ctx.fillText(snumber(row.level), 135, 45);
                     ctx.font = '20px Cairo';//xp
                      ctx.fontSize = '28px';
                      ctx.fillStyle = "#FFFFFF";
                      ctx.textAlign = "center";
                      ctx.fillText(userData.points, 330, 46);
                                              //Name
                        ctx.font = "20px Cairo";
                        ctx.fillStyle = "#FFFFFF";
                        ctx.textAlign = "center";
                        ctx.fillText(getvalueof.username, 240, 85);

                      message.channel.send(`**:pencil: |  Here is ${getvalueof.username}'s Rank Card**`,{file : canvas.toBuffer()});
message.channel.stopTyping(1)
                      });
                  });
                });


            console.log('rank is Using');
    }


 if(message.content.startsWith(prefix + 'العنوان')) {
     if(!message.channel.guild) return message.reply('** This command only for servers**');
        var args = message.content.split(" ").join(" ").slice(8)
        if (!args) return;
        db.updateText(`message_${message.author.id}`, args).then(i =>{
            message.channel.send(`Profile Message Changed To ${i.text}`)
        })
    }

    if(!rep[message.author.id]) rep[message.author.id] = {
        reps: 'NOT YET',
        repo: 0,
    }
    if(message.content.startsWith(prefix + 'لايك')) {
      if(!message.channel.guild) return;
                    moment.locale('ar');
        let ment = message.mentions.users.first();
       var getvalueof;
       if(ment) {
           getvalueof = ment;
    } else {
           getvalueof = message.author;
    }
    if(rep[message.author.id].reps != moment().format('L')) {
            rep[message.author.id].reps = moment().format('L');
            rep[getvalueof.id].repo += 1; // يضيف واحد كل مره يستخدم الامر ض1
            message.channel.send(`** :white_check_mark: | Successly Added To ${message.author} rep point ! **`)
        } else {
    const embed = new Discord.RichEmbed()
      .setTitle('خطأ!')
      .setColor('RED')
      .setDescription('**:alarm_clock: | لقد قمت بذالك بالفعل !, للإرسال مرة آخرى حاول ' + moment().endOf('day').fromNow().replace('in ', 'بعد ') + '**')
      message.channel.sendEmbed(embed);
        }
       }

    fs.writeFile('./rep.json', JSON.stringify(rep), (err) => {
     if(err) throw err.message + ' '+err.file;
 })
});

const db = require("quick.db");
let dataPro = JSON.parse(fs.readFileSync('./walls.json', 'utf8'));
client.on("message",  message => {
    let args = message.content.split(' ').slice(1);

var prefix =`!`;
  let command = message.content.split(" ")[0];
      if (command === prefix + "تعيين") {
        if(!args[0]) return message.reply('يجب عليك اختيار رقم الخلفيه')
        if(dataPro[message.author.id].walls[args[0]]) {
        dataPro[message.author.id].ai = true;
        dataPro[message.author.id].wallSrc = dataPro[message.author.id].walls[args[0]].src;
        message.reply('تم بنجاح تغير الخلفيه');
        } else {
            message.reply('انت لا تملك هذه الخلفيه')
        }
    }

    if(message.content.startsWith(prefix + 'خلفيات')) {
        var walls = dataPro[message.author.id].walls;
        for(var wall in walls) {
            console.log(walls[wall]);
            message.channel.send(walls[wall]);// ;(
        }
    }
    var wallpapers = {
                1: {
                    src: 'walls/1414.jpg',
                    price: 1,
                },
                2: {
                    src: 'walls/1515.jpg',
                    price: 2,
                },
                3: {
                    src: 'walls/7777.jpg',
                    price: 3,
                },
                4: {
                    src: 'walls/9999.jpg',
                    price: 4,
                },
                5: {
                    src: 'walls/44444.jpg',
                    price: 5,
                },
            }
    if(!dataPro[message.author.id]) {
            dataPro[message.author.id] = {
                ai: false,
                wallSrc: './walls/default.jpg' ,
                walls: {}
            }
        }
         var prefix=`!`
    if(message.content.startsWith(prefix + 'شراء')) {
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
    if (!row) return message.reply("** Pls Try .daily And Try Agin**");
        if (!row) return message.reply("sadly you do not have any points yet!");
        let points = row.points;
        if(!args[0]) {
            let embed = new Discord.RichEmbed()
.setDescription('**ورقم الخلفية .buy لـشراء خلفية آستخدم آمر  ** ')
.addField('Profile starwars','Price : $1000 Number: 1')
.addField('Profile Sun','Preice: $1800 Number: 2')
.addField('Profile Tree','Price : $2300 Number: 3')
.addField('Profile Mount','Price: $3000 Number: 4')
.addField('Profile Old Tree','Price: $4000 Number: 5')
 .setImage("");
            message.channel.send({embed: embed});
        } else {

            if(wallpapers[args[0]].price > row.points) {
                message.reply('لا يمكنك شراء هذه الخلفيه لانك لا تملك المال الكافي لشرائها ')
            } else {
                if(dataPro[message.author.id].walls == wallpapers[args[0]]) return message.reply('انت تملك هذه الخلفيه مسبقاً');
                else {
                    row.points - wallpapers[args[0]].price;
                    sql.run(`UPDATE scores SET points = ${row.points - wallpapers[args[0]].price} WHERE userId = ${message.author.id}`);
                     dataPro[message.author.id].ai = true;
                     dataPro[message.author.id].walls[args[0]] = wallpapers[args[0]];
                    message.reply('تم بنجاح شراء الخلفيه للاستخدام الخلفيه اكتب .set '+args[0]);
                }

            }

        }

        });
        //message.reply('Hhihihi');
    }

    fs.writeFile('./walls.json', JSON.stringify(dataPro), (err) => {
     if(err) console.log(err.message);
 })
    if(message.content.startsWith(prefix + 'بروفايل')) {
         if(!message.channel.guild) return message.reply('** This command only for servers**');
     var ment = message.mentions.users.first();
      var getvalueof;
      if(ment) {
        getvalueof = ment;
      } else {
        getvalueof = message.author;
      }
  if (!points[message.author.id]) points[message.author.id] = {
    points: 0,
    level: 0
  };
  let userData = points[message.author.id];
  userData.points++;

  let curLevel = Math.floor(0.1 * Math.sqrt(userData.points));
  if (curLevel > userData.level) {

    userData.level = curLevel;
  //  message.reply(`You"ve leveled up to level **${curLevel}**! Ain"t that dandy?`);
  }
           var Canvas = require('canvas')
var jimp = require('jimp')
const snumber = require('short-number')
         sql.get(`SELECT * FROM scores WHERE userId ="${getvalueof.id}"`).then(row => {
message.channel.startTyping(1)
const w = ['./img/wall.png'];
      let Image = Canvas.Image,
          canvas = new Canvas(437, 437),
          ctx = canvas.getContext('2d');
      ctx.patternQuality = 'Cairo';
      ctx.filter = 'Cairo';
      ctx.antialias = 'Cairo';
      ctx.shadowColor = 'Cairo(0, 0, 0, 0.4)';
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 2;



      fs.readFile(`${dataPro[getvalueof.id].wallSrc}`, function (err, Background) {
          fs.readFile(`${w[0]}`, function (err, Background) {
          if (err) return console.log(err);
          let BG = Canvas.Image;
          let ground = new Image;
          ground.src = Background;
          ctx.drawImage(ground, 0, 0, 437, 437);
});
          if (err) return console.log(err);
          let BG = Canvas.Image;
          let ground = new Image;
          ground.src = Background;
          ctx.drawImage(ground, 0, 0, 437, 437);
});



              let url = getvalueof.displayAvatarURL.endsWith(".webp") ? getvalueof.displayAvatarURL.slice(5, -20) + ".png" : getvalueof.displayAvatarURL;
              jimp.read(url, (err, ava) => {
                  if (err) return console.log(err);
                  ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
                      if (err) return console.log(err);
                      let Avatar = Canvas.Image;
                      let ava = new Avatar;
                      ava.src = buf;
                      ctx.drawImage(ava, 11, 47, 116, 116);
                      if (!row) return message.reply("**Your Level Is 0 , Try .daily , Then Try This Command **");
                      ctx.font = '25px Cairo';
                      ctx.fontSize = '55px';
                      ctx.fillStyle = "#FFFFFF";
                      ctx.textAlign = "center";
                      ctx.fillText(snumber(row.level), 395, 75);
                      ctx.font = '25px Cairo';
                      ctx.fontSize = '95px';
                      ctx.fillStyle = "#FFFFFF";
                      ctx.textAlign = "center";
                      ctx.fillText(`$${snumber(row.points)}`, 360, 428);
                                              //Name
                        ctx.font = "25px Cairo";
                        ctx.fillStyle = "#FFFFFF";
                        ctx.textAlign = "center";
                        ctx.fillText(getvalueof.username, 297, 140);
                      ctx.font = "17px Cairo";
                      ctx.fontSize = "12px";
                      ctx.fillStyle = "#FFFFFF";
                      ctx.textAlign = "left";
                      db.fetchObject(`message_${getvalueof.id}`).then(i => {

                          if (!i.text){
                              i.text = "Try .setinfo";
                          };
                      ctx.fillText(i.text, 140,264);
                   ctx.font = "25px  Cairo";
                      ctx.fontSize = "15px";
                      ctx.fillStyle = "#FFFFFF";
                      ctx.textAlign = "center";
                      ctx.fillText('Soon', 1790,1200);
                      // REP
                    ctx.font = "25px  Cairo";
                      ctx.fontSize = "100px";
                      ctx.fillStyle = "#FFFFFF";
                      ctx.textAlign = "center";
                      ctx.fillText(`❤️: ${rep[message.author.id].repo}`, 220,343);
                     ctx.font = '25px Cairo';//xp
                      ctx.fontSize = '28px';
                      ctx.fillStyle = "#FFFFFF";
                      ctx.textAlign = "center";
                      ctx.fillText(userData.points, 80, 428);
                      message.channel.send(`**:pencil: |  Here is ${getvalueof.username}'s Profile**`,{file : canvas.toBuffer()});
message.channel.stopTyping(1)
                      });
                  });
                });
         });

            console.log('ProFile is Using');
    }


      if(message.content == `${prefix}لفل-اب`) {

          try {
             sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
    if (!row) {
      sql.run("INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)", [message.author.id, 2, 0]);
    } else {
      let curLevel = Math.floor(0.2 * Math.sqrt(row.points + 1));
        row.level = curLevel;
        sql.run(`UPDATE scores SET points = ${row.points + 1}, level = ${row.level} WHERE userId = ${message.author.id}`);

        var Canvas = require('canvas')
var jimp = require('jimp')
const w = ['./img/up1.png','./img/up2.png','./img/up.png'];

        let Image = Canvas.Image,
            canvas = new Canvas(88, 110),
            Ui = canvas.getContext('2d');
        Ui.patternQuality = 'bilinear';
        Ui.filter = 'bilinear';
        Ui.antialias = 'subpixel';
        Ui.shadowColor = 'rgba(0, 0, 0, 0.4)';
        Ui.shadowOffsetY = 2;
        Ui.shadowBlur = 2;
        fs.readFile(`${w[Math.floor(Math.random() * w.length)]}`, function (err, Background) {
            if (err) return console.log(err);
            let BG = Canvas.Image;
            let ground = new BG;
            ground.src = Background;
            Ui.drawImage(ground, 0, 0, 88, 110); // 0, 0, 207, 176

})

                let url = message.author.displayAvatarURL.endsWith(".webp") ? message.author.displayAvatarURL.slice(5, -20) + ".gif" : message.author.displayAvatarURL;
                jimp.read(url, (err, ava) => {
                    if (err) return console.log(err);
                    ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
                        if (err) return console.log(err);
                        let Avatar = Canvas.Image;
                    /*    Ui.arc(80,80,50,0,2*Math.PI);
                        Ui.clip();*/
                        let ava = new Avatar;
                        ava.src = buf;
                        Ui.drawImage(ava, 19, 3, 52, 50);
                        Ui.font = 'bold 30px Helvetica';
                        Ui.fontSize = '30px';
                        Ui.fillStyle = "#c4bdbd";
                        Ui.textAlign = "center";
                        Ui.fillText(`${row.level}`, 45, 105);
                    message.channel.send(`:up: ** |  ${message.author.username}    Level Up! To ${row.level} ** `, {file: canvas.toBuffer()});
                  });
         });

      sql.run(`UPDATE scores SET points = ${row.points + 1} WHERE userId = ${message.author.id}`);
    }
  }).catch(() => {
    console.error;
    sql.run("CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)").then(() => {
      sql.run("INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)", [message.author.id, 1, 1]);
    });
  });

          } catch (e) {
              console.log(e.message);
          }
          }



    try{
    let args = message.content.split(' ').slice(1);
  if (message.content.startsWith(prefix + 'OWNER')) {
        if(!message.channel.guild) return message.reply('** This command only for servers**');
    if(message.author.user !== '333239187509870595' && message.author.id !== '415602689100087297') return message.reply('**This Command Just For Admins**')// :|
    console.log(args[0]);
  client.users.get(args[0]).send(args[1]);


    }
    }catch(error){console.log(error)}
});

                        function timeCon(time) {
    let days = Math.floor(time % 31536000 / 86400);
    let hours = Math.floor(time % 31536000 % 86400 / 3600);
    let minutes = Math.floor(time % 31536000 % 86400 % 3600 / 60);
    let seconds = Math.round(time % 31536000 % 86400 % 3600 % 60);
    days = days > 9 ? days : '0' + days;
    hours = hours > 9 ? hours : '0' + hours;
    minutes = minutes > 9 ? minutes : '0' + minutes;
    seconds = seconds > 9 ? seconds : '0' + seconds;
    return `${days > 0 ? `${days}:` : ''}${(hours || days) > 0 ? `${hours}:` : ''}${minutes}:${seconds}`;

}
client.login(process.env.BOT_TOKEN);
