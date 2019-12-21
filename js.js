const { remote, ipcRenderer, app } = require('electron');

function submitSong(){
    var input = document.getElementById('video_input');
    var inpVal = input.value
    if(inpVal.includes('youtube')){
            document.getElementById('input_container').submit()
            return false;
    } else {
        var error = document.getElementById('error');
        error.innerText = 'Please enter a valid Youtube video.';
        error.classList.remove('hidden');
        error.classList.add('error');

        setTimeout(() => {
            error.classList.add('hidden');
            error.classList.remove('shake');
        }, 4000)
        return false;
    }
}

function submitStop(){
    document.getElementById('form_stop').submit()
    return false;
}

function submitPlay(){
    document.getElementById('form_play').submit()
    var playBut = document.getElementById('play');
    
    if(playBut.classList == 'fas fa-play') {
        playBut.classList = 'fas fa-pause';
    } else {
        playBut.classList = 'fas fa-play';
    }

    return false;
}

function getInfo(){
    fetch('http://localhost:4000/song/info')
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        console.log(data.data)
        document.getElementById('device_state').innerHTML = `Now playing: ${data.data}`;
    })
}


setInterval(function getState(){
    fetch('http://localhost:4000/sonos/state', {
        method: 'GET'
    })
    .then((response) => {
        return response.json()
    })
    .then((state) => {
        var text = JSON.stringify(state);
        text.replace('/"', '.');
        if(text.includes('playing')) {
            document.getElementById('play').classList = 'fas fa-pause';
        } else if (text.includes('paused' || text.includes('stopped'))) {
            document.getElementById('play').classList = 'fas fa-play';
        }
    });

    getInfo()
}, 1000);


function setVol(){
    document.getElementById('volume_form').submit();
    console.log(document.getElementById('volume_slider').value)
}

function getVol(){
    fetch('http://localhost:4000/sonos/volume', {
        method: 'GET'
    })
    .then((response) => {
        return response.json();
    })
    .then((vol) => {
        document.getElementById('volume_slider').value = vol
    })
}

function closeWin(){
    console.log('closing')
    var win = remote.getCurrentWindow();
    fetch('http://localhost:4000/close',{
        method: 'POST'
    }).then(() => {
        win.destroy();
    })


}

function minimize(){
    var win = remote.getCurrentWindow();
    win.minimize();
}