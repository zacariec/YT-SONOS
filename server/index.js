//Express server
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

//Audio libraries.
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const mp3Duration = require('mp3-duration');

//Sonos libraries
const DeviceDiscovery = require('sonos').AsyncDeviceDiscovery;
const { Sonos } = require('sonos');

//Tools libraries
const internalIp = require('internal-ip');
const chokidar = require('chokidar');

//Serve /stream directory.
app.use(express.static(__dirname + '/stream'));
//Use bodyParser to get input from Electron
app.use(bodyParser.urlencoded({ extended: false }));
//Find Sonos Device on network

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
});

let devices = [];

app.post('/discover', function(req, res){
    console.log(req.body.device);
    devices.push(req.body.device);
            
        /*chokidar.watch(`${__dirname}/stream`).on('change', (event, path) => {
            const song = `http://${internalIp.v4()}:4000/1.mp3`;
            sonos.play(`${song}`)
            .then(() => {
                console.log(`Now playing to Sonos Device on: ${sonos.host}`);
            })
            .catch((error) => {
                console.log(error);
            });
        });*/
})

app.post('/sonos/stop', function(req, res){
    const sonos = new Sonos(devices[0]);
    sonos.stop()
    .catch((error) => {
        console.log('Oh no, an error has occurred: ', error);
    })
})

app.post('/sonos/resume', function(req, res){
    const sonos = new Sonos(devices[0]);
    sonos.togglePlayback()
    .catch((error) => {
        console.log('Oh no, an error has occurred: ', error);
    })
})

app.get('/sonos/state', function(req, res){
    const sonos = new Sonos(devices[0]);
    sonos.getCurrentState().then(state => {
        console.log(state);
        res.json(state);
    });
})

app.get('/sonos/volume', function(req, res){ 
    const sonos = new Sonos(devices[0]);
    sonos.getVolume()
    .then((volume) => {
        res.json(volume);
    });
});

app.post('/sonos/volume', function(req, res){
    const sonos = new Sonos(devices[0]);
    console.log(req.body.volume);
    sonos.setVolume(req.body.volume)
})

app.post('/song', function(req, res){
    const sonos = new Sonos(devices[0]);
    var stream = ytdl(req.body.url)
    .on('close', function(){
        console.log('finished downloading yt video');
    });

    ffmpeg(stream)
    .audioBitrate(128)
    .saveToFile(`${__dirname}/stream/1.mp3`)
    .on('progress', function(p){
        console.log(`${p.targetSize} converted`);
    })
    .on('end', function(){
        console.log('finished converting video to audio');
        sonos.play(`http://${internalIp.v4()}:4000/stream/1.mp3`)
        .catch((error) => {
            console.log('Oh no, an error has occurred: ', error);
        });
    });
});


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
