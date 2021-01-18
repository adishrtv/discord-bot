//var request = require("request");
let fetch = require("node-fetch");
const urlFetcher = async (search) => {
	const url = `https://api.pexels.com/v1/search?query=${search}`;
	var options = {
		method: "GET",
		headers: {
			Authorization: "",
		},
	};
	const body = await fetch(url, options).then((res) => res.json());
	console.log(body);
	if (body.photos.length > 0) return body.photos[0].src.large;
	else
		return "https://images.pexels.com/photos/3573351/pexels-photo-3573351.png?auto=compress&cs=tinysrgb&h=650&w=940";
};
module.exports = urlFetcher;
