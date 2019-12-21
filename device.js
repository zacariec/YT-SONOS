const { remote, ipcRenderer } = require('electron')

function getDevices(){
    var errorContainer = document.getElementById('error_container');
    var domError = document.getElementById('error');
    var loadTitle = document.getElementById('loader_title');
    var loader = document.getElementById('loader');
    
    errorContainer.classList.add('hidden');
    loadTitle.classList.remove('hidden');
    loader.classList.remove('hidden');

    fetch('http://localhost:4000/discover')
    .then((response) =>{
        return response.json();
    })
    .then((data) => {
        data.forEach((device) =>{
            document.getElementById('device_form').classList.remove('hidden');
            document.getElementById('loader').classList.add('hidden');
            document.getElementById('loader_title').classList.add('hidden');
            console.log(device);
            var option = document.createElement('option');
            option.innerHTML = device;
            option.classList.add('device_item');
            console.log(option)

            document.getElementById('device_list').appendChild(option);
        })
    })
    .catch((error) => {
        if(error){
            loadTitle.classList.add('hidden');
            loader.classList.add('hidden');
            domError.innerText = 'Oh oh. We couldn\'t find a device. Please try again.'
            errorContainer.classList.remove('hidden');
            domError.classList.add('error');

        }
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


