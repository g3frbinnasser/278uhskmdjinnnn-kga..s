const Discord = require('discord.js');
const client = new Discord.Client();
 
 
 client.on('guildMemberAdd', member => {
const mohamed= member.guild.channels.get("517621662271799307");
if(mohamed) {
setTimeout(() => mohamed.send(`**.. Welcome To, - Future Community. :leaves::tulip: ** `), 4000)        
}
});
client.on('ready',async () => {
  let GUILDID = '517345819406368769'; // اي دي السيرفر
  let CHANNELID = '517597766583713802'; // اي دي الروم
  voiceStay(GUILDID, CHANNELID);
  function voiceStay(guildid, channelid) {
    if(!guildid) throw new Error('Syntax: voiceStay function requires guildid');
    if(!channelid) throw new Error('Syntax: voiceStay function requires channelid');
 
    let guild = client.guilds.get(guildid);
    let channel = guild.channels.get(channelid);
 
    if(channel.type === 'ji.') {
      channel.join().catch(e => {
        console.log(`Failed To Join :: ${e.message}`);
      });
    } else {
      console.log(`Channel Type :: ${channel.type}, It must be Voice.`);
    }
  }
});
client.login(process.env.BOT_TOKEN)
