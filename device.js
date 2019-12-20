const { remote, ipcRenderer } = require('electron')

function getDevices(){
    fetch('http://localhost:4000/discover')
    .then((response) =>{
        return response.json();
    })
    .then((data) => {
        data.forEach((device) =>{
            console.log(device);
            var option = document.createElement('option');
            option.innerHTML = device;
            option.classList.add('device_item');
            console.log(option)

            document.getElementById('device_list').appendChild(option);
        })
    })
}

async function submitDevice(){
    document.getElementById('device_form').addEventListener('submit', function(){
        submit();
    });
}

document.getElementById('device_submit').addEventListener('click', function(){
    submitDevice()
    .then(() =>{
        ipcRenderer.send('createBrowserWindow');
        var curWin = remote.getCurrentWindow();
        curWin.hide();
    });
})


