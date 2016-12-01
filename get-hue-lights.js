var HueApi = require("node-hue-api").HueApi;
 
var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
};
 
var hostname = "192.168.1.9",
    username = "eIT0-68IopbrQWxqYbVkOYAUXqpj1Us5tVrGAnf7",
    api;
 
api = new HueApi(hostname, username);
 
// -------------------------- 
// Using a promise 
api.lights()
    .then(displayResult)
    .done();
 
// -------------------------- 
// Using a callback 
api.lights(function(err, lights) {
    if (err) throw err;
    displayResult(lights);
});