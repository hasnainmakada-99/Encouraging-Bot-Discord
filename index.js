const { Client, GatewayIntentBits } = require("discord.js");

require("dotenv").config();
const mySecret = process.env['TOKEN']
const keepAlive = require("./server");
const Database = require("@replit/database");

const myUrl = "https://zenquotes.io/api/random"

const db = new Database();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const sadWords = ["sad", "depressed", "unhappy", "angry"];

const starterEncouragements = [
  "Cheer up!",
  "Hang in there.",
  "You are a great person / bot!",
];

db.get("encouragements").then((encouragements) => {
  if (!encouragements || encouragements.length < 1) {
    db.set("encouragements", starterEncouragements);
  }
});

db.get("responding").then((value) => {
  if (value == null) {
    db.set("responding", true);
  }
});

async function getQuote() {
  const res = await fetch(myUrl);
  const data = await res.json();
  return data[0]["q"] + " -" + data[0]["a"];
}

function updateEncouragements(encouragingMessage) {
  db.get("encouragements").then((encouragements) => {
    encouragements.push([encouragingMessage])
    db.set("encouragements", encouragements)
  });
}

function deleteEncouragements(index) {
  db.get("encouragements").then((encouragements) => {
    if (encouragements.length > index) {
      encouragements.splice(index, 1);
      db.set("encouragements", encouragements);
    }
  });
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "$inspire") {
    getQuote().then((quote) => message.channel.send(quote));
  }

  db.get("responding").then((responding) => {
    if (responding && sadWords.some((word) => message.content.includes(word))) {
      db.get("encouragements").then((encouragements) => {
        const encouragement =
          encouragements[Math.floor(Math.random() * encouragements.length)];
        message.reply({
          content: `${encouragement}`,
        });
      });
    }
  });

  if (message.content.startsWith("$new")) {
    encouragingMessage = message.content.split("$new ")[1]
    updateEncouragements(encouragingMessage)
    message.channel.send("New encouraging message added.")
  }

  if (message.content.startsWith("$del")) {
    index = parseInt(message.content.split("$del ")[1])
    deleteEncouragements(index)
    message.channel.send("Encouraging message deleted.")
  }

  if (message.content.startsWith("$list")) {
    db.get("encouragements").then((encouragements) => {
      if (encouragements && encouragements.length > 0) {
        const messageText = encouragements.join("\n");
        message.channel.send(`List of encouragements:\n${messageText}`);
      } else {
        message.channel.send("No encouragements found.");
      }
    });
  }


  if (message.content.startsWith("$responding")) {
    value = message.content.split("$responding ")[1]
    if (value && value.toLowerCase() === "true") {
      db.set("responding", true)
      message.channel.send("Responding is On")
    } else {
      db.set("responding", false)
      message.channel.send("Responding is Off")
    }
  }

});

keepAlive();

client.login(mySecret);
