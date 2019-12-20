function prevent(e){
    e.preventDefault();
}
setInterval(function getState(){
    fetch('http://localhost:4000/sonos/state', {
        method: 'GET'
    })
    .then((response) =>{
        return response.json()
    })
    .then((state) => {
        var text = JSON.stringify(state);
        text.replace('/"', '.');
        document.getElementById('device_state').innerHTML = `${text}`;
    })
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