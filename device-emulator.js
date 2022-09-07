//Requires node.js and mqtt library installed.
var mqtt = require('mqtt');
require('dotenv').config();

const host = process.env.SERVER || 'localhost';
// Reads the access token from arguments
const accessToken = process.env.ACCESS_TOKEN || 'TOKEN';
const minStatus = 0, maxStatus = 1;

// Initialization of temperature and humidity data with random values
var data = {
    // status: minStatus + (maxStatus - minStatus) * Math.random()
    status: true,
    timeStamp: new Date().toISOString(),
    deviceID: 'Device#1',
    messageID: 123,
    battLevel: 75,
    signalLevel:85,
    temperature: 25,

};

// Initialization of mqtt client using Thingsboard host and device access token
console.log('Connecting to: %s using access token: %s', host, accessToken);
var client  = mqtt.connect('mqtt://'+ host, { username: accessToken });

// Triggers when client is successfully connected to the Thingsboard server
client.on('connect', function () {
    console.log('Client connected!');
    // Uploads firmware version as device attribute using 'v1/devices/me/attributes' MQTT topic
    client.publish('v1/devices/me/attributes', JSON.stringify({"firmware_version":"1.0.1"}));
    // Schedules telemetry data upload once per second
    console.log('Sending data...');
    setInterval(publishTelemetry, 10000);
});

// Uploads telemetry data using 'v1/devices/me/telemetry' MQTT topic
function publishTelemetry() {
    data.status = genNextValue(data.status, minStatus, maxStatus);
    console.log(data)
    client.publish('v1/devices/me/telemetry', JSON.stringify(data));
}

// Generates new random value that is within 3% range from previous value
function genNextValue(prevValue, min, max) {
    var value = prevValue + ((max - min) * (Math.random() - 0.5)) * 0.03;
    value = Math.max(min, Math.min(max, value));
    return Math.round(value * 10) / 10;
}

//Catches ctrl+c event
process.on('SIGINT', function () {
    console.log();
    console.log('Disconnecting...');
    client.end();
    console.log('Exited!');
    process.exit(2);
});

//Catches uncaught exceptions
process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    process.exit(99);
});