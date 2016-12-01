var request = require("request")
var express = require('express');
var _ = require("underscore");
var app = express();
var exec = require('child_process').exec;

var lifx_token='asdasdasdasdasdasd';
var lifx_api='https://api.lifx.com/v1/lights'

var hue_token='eIT0-68IopbrQWxqYbVkOYAUXqpj1Us5tVrGAnf7'
var hue_api='http://192.168.1.9/api/'+hue_token;

function send_lifx(method,selector,cmd,body,cb) {
    var opt = {
        method:method,
        url: lifx_api+"/"+selector+cmd,
        headers: { "Authorization":"Bearer "+lifx_token }
    }
    if (body) opt.body = JSON.stringify(body);
    console.log("LIFX: ",opt.url,opt.body);
    request(opt,function(error,response,body) {
        if (error) {
            console.log("ERROR: ",error);
        } 
        if (cb) cb(error,response,body);
    });
}

function send_hue(method,selector,cmd,body,cb) {
    var opt = {
        method:method,
        url: hue_api+"/"+selector+cmd,
    }
    if (body) opt.body = JSON.stringify(body);
    console.log("HUE: ",opt.url,opt.body);
    request(opt,cb);
}

var lights = [];

function setColor(light,hue,brightness,duration) {
    duration = duration || 1.0;

    brightness = brightness || 100;
    var brightnessLifx = (brightness / 100.0)/2.0;
    var brightnessHue = 255 * (brightness / 100.0);

    if (light.type === "hue") {
        hue = Math.floor(hue * (65535.0/360.0));
        send_hue("PUT","lights/"+light.id,"/state",{"sat":254,"bri":brightnessHue,"hue":hue,"transitiontime":duration*10});
    } else {
        send_lifx("PUT","id:"+light.id,"/state",{power:"on",color:"hue:"+hue+" saturation:1.0",brightness:brightnessLifx.toFixed(2),"duration":duration});
    }
}

function off(light,duration) {
    duration = duration || 1.0;

    if (light.type === "hue") {
        send_hue("PUT","lights/"+light.id,"/state",{"bri":0,"transitiontime":duration*10});
    } else {
        send_lifx("PUT","id:"+light.id,"/state",{"power":"off","duration":duration});
    }
}

function setWhite(light,k,brightness,duration) {
    brightness = brightness || 100;
    duration = duration || 1.0;
    var brightness1 = brightness / 100.0;
    var brightness256 = Math.floor(255 * brightness1);
    if (light.type === "hue") {
        var ct = Math.floor((1/k)*1000000);
        send_hue("PUT","lights/"+light.id,"/state",{"ct":ct, bri:brightness256,transitiontime:Math.floor(duration*10)});
    } else {
        send_lifx("PUT","id:"+light.id,"/state",{power:"on",color:"kelvin:"+k,duration:duration,brightness:brightness1});
    }
}

function assignRandomColor(light) {
    var hue = Math.floor(360*Math.random())
    setColor(light,hue);
}

function setRandomRange(lights,color,range) {
    _.each(lights,function(light) {
        var hue = Math.floor(color + (Math.random() * range) - range/2.0);
        setColor(light,hue);
    });
}

function partyLights() {
    var index = -1;
    while(index < 0 || lights[index].power != "on") {
        index = Math.floor(Math.random()*lights.length);
    }
    assignRandomColor(lights[index]);
}

function colorsTick() {
    setRandomRange(lights,Math.floor(360*Math.random()),40);
}

function setMode(mode) {
    console.log("MODE: ",mode);

    if (modeTick) {
        clearInterval(modeTick);
        modeTick = null;
    }

    if (mode == "off") {
        _.each(lights,function(light) {
            off(light);
        });
    } else if (mode == "full") {
        _.each(lights,function(light) {
            setWhite(light,3500);
        });
    } else if (mode == "dim") {
        _.each(lights,function(light) {
            setWhite(light,3500,20);
        });
    } else if (mode == "party") {
        _.each(lights,assignRandomColor);
        modeTick = setInterval(partyLights,3000);
    }

    currentMode = mode;
}

var currentMode = "off";

app.get('/party/toggle', function (req, res) {
    if (currentMode == "party") {
        setMode("full");
    } else {
        setMode("party");
    }
    res.send('OK');
});

app.get('/toggle', function (req, res) {
    if (currentMode == "off") {
        setMode("full");
    } else {
        setMode("off");
    }
    res.send('OK');
});


var modeTick = null;
app.get('/mode/:value',function(req,res) {
    var mode = req.params.value.toLowerCase();
    setMode(mode);
    res.send("OK");
});

app.get('/status', function (req, res) {
    res.send('OK');
});

app.listen(8084, function () {
    lights.push({
        type:"hue",
        id:"8",
        power:"on",
    });
    // send_lifx("GET","group:Living Room","",null,function(error,response,body) {
    //     lights = JSON.parse(body);
    //     lights.push({
    //         type:"hue",
    //         id:"3",
    //         power:"on",
    //     });
    //     console.log("Found "+lights.length+" lights.");
    // });
});
