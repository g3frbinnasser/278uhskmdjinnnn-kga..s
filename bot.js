const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});


client.on('guildMemberAdd',async member => {
  const Canvas = require('canvas');
  const jimp = require('jimp');
  const w = ['./welcome22.png'];
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
 
          ctx.font = '36px Arial';
          ctx.fontSize = '72px';
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(member.user.username, 545, 177);
         
          ctx.font = '16px Arial Bold';
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
           
          const c = client.channels.get("509766900117536791");
          c.sendFile(canvas.toBuffer());
 
});
});
});

var dat = JSON.parse("{}");
function forEachObject(obj, func) {
    Object.keys(obj).forEach(function (key) { func(key, obj[key]) });
}
client.on("ready", () => {
    var guild;
    while (!guild)
        guild = client.guilds.get("491686948130521112");
    guild.fetchInvites().then((data) => {
        data.forEach((Invite, key, map) => {
            var Inv = Invite.code;
            dat[Inv] = Invite.uses;
        });
    });
});
var dat = JSON.parse(fs.readFileSync('./invite.json', 'utf8'));
function forEachObject(obj, func) {
    Object.keys(obj).forEach(function (key) { func(key, obj[key]) })
}
client.on("ready", () => {
    var guild;
    while (!guild)
        guild = client.guilds.get("491686948130521112")
    guild.fetchInvites().then((data) => {
        data.forEach((Invite, key, map) => {
            var Inv = Invite.code;
            dat[Inv] = Invite.uses;
        })
    })
})
client.on("guildMemberAdd", (member) => {
    let channel = member.guild.channels.find('name', 'stranger');
    if (!channel) {
        console.log("!channel fails");
        return;
    }
    if (member.id == client.user.id) {
        return;
    }
    console.log('made it till here!');
    var guild;
    while (!guild)
        guild = client.guilds.get("491686948130521112")
    guild.fetchInvites().then((data) => {
        data.forEach((Invite, key, map) => {
            var Inv = Invite.code;
            if (dat[Inv])
                if (dat[Inv] < Invite.uses) {
                    console.log(3);
channel.send(`**Welcome To Śtranger Server :champagne_glass:**`)
 channel.send(`**invited by** ${Invite.inviter}`)
 }
            dat[Inv] = Invite.uses;
        })
    })
});
var prefix = "#";
client.on("message", message => {

            if (message.content.startsWith(prefix + "bc")) {
                         if (!message.member.hasPermission("ADMINISTRATOR"))  return;
  let args = message.content.split(" ").slice(1);
  var argresult = args.join(' '); 
  message.guild.members.filter(m => m.presence.status !== 'all').forEach(m => {
 m.send(`${argresult}\n ${m}`);
})
 message.channel.send(`\`${message.guild.members.filter(m => m.presence.status !== 'all').size}\` : عدد الاعضاء المستلمين`); 
 message.delete(); 
};     
});
client.on("message", (message) => {
    /// DREAM
   if (message.content.startsWith("#new")) {     /// DREAM
        const reason = message.content.split(" ").slice(1).join(" ");     /// DREAM
        if (!message.guild.roles.exists("name", "• Support")) return message.channel.send(`لازم تسوي رتبة اسمها \`Support Team\` وتنطي البوت ادمنيتر حتا يقدر يسوي الرومات ويعدل برمشنات`);
        if (message.guild.channels.exists("name", "ticket-{message.author.id}" + message.author.id)) return message.channel.send(`You already have a ticket open.`);    /// ALPHA CODES
        message.guild.createChannel(`ticket-${message.author.username}`, "text").then(c => {
            let role = message.guild.roles.find("name", "• Support");
            let role2 = message.guild.roles.find("name", "@everyone");
            c.overwritePermissions(role, {
                SEND_MESSAGES: true,
                READ_MESSAGES: true
            });    /// ALPHA CODES
            c.overwritePermissions(role2, {
                SEND_MESSAGES: false,
                READ_MESSAGES: false
            });
            c.overwritePermissions(message.author, {
                SEND_MESSAGES: true,
                READ_MESSAGES: true
            });
            message.channel.send(`:white_check_mark: تم انشاء تذكرتك, #${c.name}.`);
            const embed = new Discord.RichEmbed()
                .setColor(0xCF40FA)
                .addField(`Hey ${message.author.username}!`, `تم فتح تذكرة الرجاء انتظار الى حين يأتي مشرف ويقوم بلرد عليك`)
                .setTimestamp();
            c.send({
                embed: embed
            });
        }).catch(console.error);
    }
 
 
  if (message.content.startsWith("#close")) {
        if (!message.channel.name.startsWith(`ticket-`)) return message.channel.send(`You can't use the close command outside of a ticket channel.`);
 
       message.channel.send(`هل انت متأكد من اقفالك للتذكرة اذا متأكد اكتب #confirm`)
           .then((m) => {
               message.channel.awaitMessages(response => response.content === '#confirm', {
                       max: 1,
                       time: 10000,
                       errors: ['time'],
                   })    /// DREAM
                   .then((collected) => {
                       message.channel.delete();
                   })    /// DREAM
                   .catch(() => {
                       m.edit('Ticket close timed out, the ticket was not closed.').then(m2 => {
                           m2.delete();
                       }, 3000);
                   });
           });
   }
 
});
	client.login(process.env.BOT_TOKEN); 
