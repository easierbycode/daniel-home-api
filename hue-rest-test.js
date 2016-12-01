var HUE_TOKEN='eIT0-68IopbrQWxqYbVkOYAUXqpj1Us5tVrGAnf7';
var HUE_IP="192.168.1.9";


var request = require( 'request' );

request({
    uri: "http://"+HUE_IP+"/api/"+HUE_TOKEN+"/lights/8/state",
    method: "PUT",
    body: JSON.stringify({"on":true,"sat":254,"bri":254,"hue":52792}),
});