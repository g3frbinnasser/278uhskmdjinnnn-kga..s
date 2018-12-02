const Discord = require('discord.js');
const client = new Discord.Client();
 
 
 client.on('guildMemberAdd', member => {
const mohamed= member.guild.channels.get("517621662271799307");
if(mohamed) {
setTimeout(() => mohamed.send(`**.. Welcome To, - Future Community. :leaves::tulip: ** `), 4000)        
}
});
   client.on('message', message => {
const yt = require('ytdl-core');
  if (message.content.startsWith('ji.')) {
              if(!message.channel.guild) return message.reply('** This command only for servers **');

    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) {
      return message.reply(`من فضلك ادخل روم صوتي `);
    }
    voiceChannel.join()
      .then(connnection => {
        let stream = yt('https://www.youtube.com/watch?v=Ktync4j_nmA', {audioonly: true});
        const dispatcher = connnection.playStream(stream);
        dispatcher.on('end', () => {
          voiceChannel.leave();
        });
      });
  }
  
  if (message.content.startsWith('lv.')) {
              if(!message.channel.guild) return message.reply('** This command only for servers **');

    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) {
      return message.reply(`من فضلك ادخل روم صوتي `);
    }
voiceChannel.leave();
  }

});
client.login(process.env.BOT_TOKEN)
