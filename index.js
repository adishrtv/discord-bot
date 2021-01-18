//const { executionAsyncResource } = require('async_hooks');
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const urlFetcher = require("./players");
const { YTSearcher } = require("ytsearcher");
const { Key } = require("./config");

const searcher = new YTSearcher({
	key: Key.ytKey,
	revealed: true,
});

const client = new Discord.Client();

const queue = new Map();

client.on("ready", () => {
	console.log("Bot is Online");
});

client.on("message", async (message) => {
	const prefix = "#";

	const serverQueue = queue.get(message.guild.id);

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	switch (command) {
		case "play":
			execute(message, serverQueue);
			break;
		case "stop":
			stop(message, serverQueue);
			break;
		case "skip":
			skip(message, serverQueue);
			break;
		case "replay":
			replay(message, serverQueue);
			break;
		case "images":
			fetchImages(message);
	}
	async function fetchImages(message) {
		const result = await urlFetcher(args.join("%20"));
		console.log(result);
		const attachment = new Discord.MessageAttachment(result);
		message.channel.send("Here are your Photos", attachment);
	}

	async function execute(message, serverQueue) {
		let vc = message.member.voice.channel;
		if (!vc) {
			return message.channel.send("Please join a voice chat first");
		} else {
			let result = await searcher.search(args.join(" "), {
				type: "video",
			});
			const songInfo = await ytdl.getInfo(result.first.url);

			let song = {
				title: songInfo.videoDetails.title,
				url: songInfo.videoDetails.video_url,
			};

			if (!serverQueue) {
				const queueConstructor = {
					txtChannel: message.channel,
					vChannel: vc,
					connection: null,
					songs: [],
					volume: 10,
					playing: true,
				};
				queue.set(message.guild.id, queueConstructor);

				queueConstructor.songs.push(song);

				try {
					let connection = await vc.join();
					queueConstructor.connection = connection;
					play(message.guild, queueConstructor.songs[0]);
				} catch (err) {
					console.error(err);
					queue.delete(message.guild.id);
					return message.channel.send(
						`Unable to join the voice chat ${err}`
					);
				}
			} else {
				serverQueue.songs.push(song);
				return message.channel.send(
					`The song has been added ${song.url}`
				);
			}
		}
	}
	function play(guild, song) {
		const serverQueue = queue.get(guild.id);
		if (!song) {
			serverQueue.vChannel.leave();
			queue.delete(guild.id);
			return;
		}
		const dispatcher = serverQueue.connection
			.play(ytdl(song.url))
			.on("finish", () => {
				serverQueue.songs.shift();
				play(guild, serverQueue.songs[0]);
			});
		serverQueue.txtChannel.send(`Now playing ${serverQueue.songs[0].url}`);
	}
	function stop(message, serverQueue) {
		if (!message.member.voice.channel)
			return message.channel.send(
				"You need to join the voice chat first!"
			);
		if (!serverQueue) {
			return message.channel.send("Stopped Already!");
		} else {
			serverQueue.songs = [];
			serverQueue.connection.dispatcher.end();
		}
	}
	function skip(message, serverQueue) {
		if (!message.member.voice.channel)
			return message.channel.send(
				"You need to join the voice chat first"
			);
		if (!serverQueue)
			return message.channel.send("There is nothing to skip!");
		serverQueue.connection.dispatcher.end();
	}
	function replay(message, serverQueue) {
		if (!message.member.voice.channel)
			return message.channel.send(
				"You need to join the voice chat first"
			);
		if (!serverQueue)
			return message.channel.send("There is nothing to replay!");
		serverQueue.songs.unshift(serverQueue.songs[0]);
		serverQueue.connection.dispatcher.end();
	}
});

client.login(Key.dKey);
