<p align="center">
  <a href="https://github.com/signalfx/signalflow-client-js/releases">
    <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/signalfx/signalflow-client-js?include_prereleases&style=for-the-badge">
  </a>
  <img alt="GitHub branch checks state" src="https://img.shields.io/github/checks-status/signalfx/signalflow-client-js/main?style=for-the-badge">
  <img alt="npm" src="https://img.shields.io/npm/v/signalflow?style=for-the-badge">
  <img alt="node-current" src="https://img.shields.io/node/v/signalflow?style=for-the-badge">
</p>

# SignalFlow library for JavaScript

## Installation

To install using npm:

```sh
$ npm install signalflow
```

### Supported Node.js versions

| Version | Node.js         |
| ------- | --------------- |
| `8.x.x` | `>=12.10.0 <=20` |
| `7.4.x` | `>=8.0.0 <18`   |
| `7.3.1` | `>=8.0.0 <11`   |

## Usage

### Configuring the Signalflow websocket endpoint

If the websocket endpoint is not set manually, this library uses the `us0` realm by default.
If you are not in this realm, you will need to explicitly set the
endpoint urls above. To determine if you are in a different realm and need to
explicitly set the endpoints, check your profile page in the SignalFx
web application.

### Examples

Complete code example for executing a computation

```js
var signalflow = require('signalflow');

var wsCallback = function(evt) {
    console.log('Hello, I'm a custom callback: ' + evt);
}

var myToken = '[ACCESS_TOKEN]';
var options = {'signalflowEndpoint': 'wss://stream.{REALM}.signalfx.com',
               'apiEndpoint': 'https://api.{REALM}.signalfx.com',
               'webSocketErrorCallback': wsCallback
              };

var client = new signalflow.SignalFlow(myToken, options);

var handle = client.execute({
            program: "data('cpu.utilization').mean().publish()",
            start: Date.now() - 60000,
            stop: Date.now() + 60000,
            resolution: 10000,
            immediate: false});

handle.stream(function(err, data) { console.log(data); });
```

Object `options` is an optional map and may contains following fields:

- **signalflowEndpoint** - string, `wss://stream.us0.signalfx.com` by default. Override this if you are in a different realm than `us0`.
- **apiEndpoint** - string, `https://api.us0.signalfx.com` by default. Override this if you are in a different realm than `us0`.
- **webSocketErrorCallback** - function, Throws an Error event by default. Override this if you want to handle a websocket error differently.

**Note**: A token created via the REST API is necessary to use this API. API Access tokens intended for ingest are not allowed.

#### API Options

Parameters to the execute method are as follows :

- **program** (string) - Required field. The signalflow to be run.
- **start** (int | string) - A milliseconds since epoch number or a string representing a relative time : e.g. -1h. Defaults to now.
- **stop** (int | string) - A milliseconds since epoch number or a string representing a relative time : e.g. -30m. Defaults to infinity.
- **resolution** (int) - The interval across which to calculate, in 1000 millisecond intervals. Defaults to 1000.
- **maxDelay** (int) - The maximum time to wait for a datapoint to arrive, in 10000 millisecond intervals. Defaults to dynamic.
- **bigNumber** (boolean) - True if returned values require precision beyond MAX_SAFE_INTEGER. Returns all values in data messages as bignumber objects as per https://www.npmjs.com/package/bignumber.js Defaults to false.
- **immediate** (boolean) - Whether to adjust the stop timestamp so that the computation doesn't wait for future data to be available.

#### Computation Objects

The returned object from an execute call possesses the following methods:

- **stream** (function (err, data)) - accepts a function and will call the function with computation messages when available. It returns multiple types of messages, detailed below. This follows error first callback conventions, so data is returned in the second argument if no errors occurred.
- **close** () - terminates the computation.
- **get_known_tsids** () - gets all known timeseries ID's for the current computation
- **get_metadata** (string) - gets the metadata message associated with the specific timeseries ID.

#### Stream Message Types

- Metadata

```js
{
  type : "metadata",
  channel : "<CHID>",
  properties : {
    sf_key : [<String>]
    sf_metric: <String>
    ...
  },
  tsId : "<ID>"
}
```

- Data

```js
{
  type : "data",
  channel : "<CHID>",
  data : [
    {
      tsId : "<ID>",
      value : <Number>
    },
    ...
  ],
  logicalTimestampMs : <Number>
}
```

- Event

```js
{
  tsId : "<ID>",
  timestampMs: 1461353198000,
  channel: "<CHID>",
  type: "event",
  properties: {
    incidentId: "<ID>",
    "inputValues" : "{\"a\":4}",
    was: "ok",
    is: "anomalous"
  }
}
```

#### Usage in a Web Browser

The signalflow client can be built for usage in a browser. This is accomplished via the following commands.

```
$ npm install
$ npm run build:browser
The output can be found at ./build/signalflow.js
```

It can then be loaded as usual via a script tag

```
<script src="build/signalflow.js" type="text/javascript"></script>
```

Once loaded, signalfx global will be created(window.signalfx). Note that only the SignalFlow package is included in this built file.

## License

Apache Software License v2 © [Splunk](https://ww.splunk.com)
