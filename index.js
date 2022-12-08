require("dotenv").config();

const { guildId, userId } = require("./config.json");
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.GuildPresences] });
const { Octokit } = require("octokit");
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

let presence = { status: "offline", activities: [] };

const { join } = require("path");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

client.on("presenceUpdate", (_, n) => {
  if (n.userId == "445035187370328066") {
    let activities = [];

    for (let i = 0; i < n.activities.length; i++) {
      let activity = n.activities[i];

      if (activity.assets) {
        activity.assets = {
          large:
            activity.assets.largeImage &&
            activity.assets.largeImage.startsWith("spotify:")
              ? activity.assets.largeImage.replace(
                  "spotify:",
                  "https://i.scdn.co/image/"
                )
              : activity.assets.largeImageURL
              ? activity.assets.largeImageURL()
              : undefined,
          small: activity.assets.smallImageURL
            ? activity.assets.smallImageURL()
            : undefined,
        };
      } else {
        if (activity.emoji) {
          activity.assets = {
            large: activity.emoji.url || activity.emoji.identifier,
          };
        }
      }

      activities.push(
        Object.assign(activity, {
          url: undefined,
          applicationId: undefined,
          party: undefined,
          flags: undefined,
          emoji: undefined,
          buttons: undefined,
          createdTimestamp: undefined,
        })
      );
    }

    presence = { status: n.status, activities };

    io.emit("presence.update", presence);
  }
});

app.set("etag", false);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/f", express.static("public"));

app.get("/", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// let friendUses = 0;
// let friendCode;

// app.get('/friend-me', (_, res) => {

//   if (!friendCode || friendUses >= 5) {
//     // generate friend link https://canary.discord.com/api/v9/users/@me/invites
//   }

// })

let repos = [];

client.once("ready", async () => {
  const guild = await client.guilds.fetch(guildId);

  await guild.members.fetch(userId);

  await fetchGithub();

  setInterval(async () => {
    await fetchGithub();
  }, 60000);

  server.listen(process.env.PORT || 8000, () => {
    console.log("READY");
  });
});

async function fetchGithub() {
  const repo_data = await octokit.request(
    "GET /user/repos?visibility=public&sort=pushed"
  );

  if (repo_data.status == 200) {
    repos = [];

    for (let i = 0; i < Math.min(10, repo_data.data.length); i++) {
      repos.push({
        name: repo_data.data[i].name,
        url: repo_data.data[i].html_url,
        description: repo_data.data[i].description,
        pushed_at: repo_data.data[i].pushed_at,
      });
    }
  }
}

io.on("connection", (socket) => {
  socket.emit("app.initiate", { projects: repos, presence });
});

client.login(process.env.DISCORD_TOKEN);
