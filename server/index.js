//Express server
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

//Audio libraries.
const ytdl = require('ytdl-core');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


//TODO get the duration of each mp3 and enable seek on client end.
//TODO Sonos is very finnicky with the way it requests songs, might be hard to implement.
const mp3Duration = require('mp3-duration');

//Sonos libraries
const DeviceDiscovery = require('sonos').AsyncDeviceDiscovery;
const { Sonos } = require('sonos');

//Tools libraries
const internalIp = require('internal-ip');

//Serve /stream directory.
app.use(express.static(__dirname + '/stream'));
//Use bodyParser to get input from Electron
app.use(bodyParser.urlencoded({ extended: false }));

//Find Sonos Device on network. Electron uses a fetch request to this URL.
//gives us a list of device IPs.
app.get('/discover', function(req, res){
    let discovery = new DeviceDiscovery()
    discovery.discoverMultiple({ timeout: 5000 })
    .then((devices) => {
        let sonosDev = [];
        devices.forEach(device => {
            sonosDev.push(device.host);
        });

        res.json(sonosDev);
    })
    .catch((error) => {
        console.log(error);
    });
});

//Devices array
let devices = [];

//Discover route - requests the fetch data from app.get('/discover') and pushes
//to our devices array for use later on.
app.post('/discover', function(req, res){
    console.log(req.body.device);
    devices.push(req.body.device);
})

//Route for electron to request device to stop playing.
app.post('/sonos/stop', function(req, res){
    const sonos = new Sonos(devices[0]);
    sonos.stop()
    .catch((error) => {
        console.log('Oh no, an error has occurred: ', error);
    })
})

//Route for electron to request device to resume playing
//We use .togglePlayback() because .play() restarts the queue.
app.post('/sonos/resume', function(req, res){
    const sonos = new Sonos(devices[0]);
    sonos.togglePlayback()
    .catch((error) => {
        console.log('Oh no, an error has occurred: ', error);
    })
})

//Route for electron to request device state e.g. 'playing', 'paused' & 'stopped'
app.get('/sonos/state', function(req, res){
    const sonos = new Sonos(devices[0]);
    sonos.getCurrentState().then(state => {
        console.log(state);
        res.json(state);
    });
})

//Route for electron to load volume integer and force slider state onload.
app.get('/sonos/volume', function(req, res){ 
    const sonos = new Sonos(devices[0]);
    sonos.getVolume()
    .then((volume) => {
        res.json(volume);
    });
});

//Route for electron to change volume on device, use .setVolume() over .adjustVolume()
//As .adjustVolume() only allows volume to go upwards not downwards.
app.post('/sonos/volume', function(req, res){
    const sonos = new Sonos(devices[0]);
    console.log(req.body.volume);
    sonos.setVolume(req.body.volume)
})

//Route for electron to send Youtube URL to our server, which inturn
//uses ytdl to convert the .mp4/.flv/whatever video
//to a .mp3 and pipes the song to the Sonos device when fluent-ffmpeg
//starts its process.

//TODO
//I do believe that this is causing the songs to stop and start over and over.
//This instantly executes the song request to the sonos device though.
//.on('progress') doesn't work as there are too many progressions.
//Causing it to do the same thing.
app.post('/song', function(req, res) {
    const sonos = new Sonos(devices[0]);
    var url = req.body.url;

    ytdl.getInfo(url, (err, info) => {
        if (err) {
            console.log(err);
        };
        app.set('songInfo', info.title)
    });

    var stream = ytdl(url)
    .on('close', function(){
        console.log('finished downloading yt video');
    });

    //We pass the YTDL function to ffmpeg, cuts down on processing time.
    ffmpeg(stream)
    .audioBitrate(320)
    .saveToFile(`${__dirname}/stream/1.mp3`)
    .on('start', function(){
        console.log('started converting, piping to Sonos.');
        var serverIp = internalIp.v4.sync();
        console.log(serverIp);
        sonos.play(`http://${serverIp}:4000/1.mp3`)
        .catch((error) => {
            console.log('Oh no, an error has occurred: ', error);
            res.json(error);
        });
    })
    .on('progress', function(p){
        console.log(`${p.targetSize} converted`);
    })
    .on('end', function(){
        console.log('finished converting video to audio');
    });
});

app.get('/song/info', function(req, res){
    res.json({ data: app.get('songInfo')});
})

//This serves the .mp3 file to our url which Sonos REQUIRES the url to
//end in .mp3 regardless, otherwise it will not play. >:(
//We also have to write the head with what it is, and the content-length.
//This helps Sonos understand what's playing... This took too long to figure out.
app.get('/', function(req, res){
    var fPath = `${__dirname}/stream/1.mp3`;
    var stat = fs.statSync(fPath);

    res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    console.log(stat.size);
    
    var readStream = fs.createReadStream(fPath);

    readStream.pipe(res);
});

app.listen(4000, console.log('listening on 4000'));
