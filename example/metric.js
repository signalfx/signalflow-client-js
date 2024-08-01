'use strict';

var signalflow = require('../');

var token = process.env['SPLUNK_ACCESS_TOKEN'];
var realm = process.env['SPLUNK_REALM'] || 'us0';

var sfxClient = new signalflow.SignalFlow(token, {
  signalflowEndpoint: 'wss://stream.' + realm + '.signalfx.com',
  apiEndpoint: 'https://api.' + realm + '.signalfx.com'
});

function receive() {
  var program = "data('cpu.utilization').publish()";
  console.log('signalflow: ', program);

  var handle = sfxClient.execute({
    program: program,
    start: Date.now() - 60000,
    stop: Date.now() + 60000,
    resolution: 10000,
    immediate: false,
  });

  handle.stream(function (err, data) {
    if (err) {
      console.log(err);
      return;
    }

    if (data.type === 'data') {
      data.data.forEach(function (dataPoint) {
        console.log('value received: ', dataPoint);
      });
    }
  });
}
receive();
