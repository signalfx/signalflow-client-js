<p align="center">
  <a href="https://github.com/signalfx/signalflow-client-js/releases">
    <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/signalfx/signalflow-client-js?include_prereleases&style=for-the-badge">
  </a>
  <img alt="GitHub branch checks state" src="https://img.shields.io/github/checks-status/signalfx/signalflow-client-js/main?style=for-the-badge">
  <img alt="npm" src="https://img.shields.io/npm/v/signalflow?style=for-the-badge">
  <img alt="node-current" src="https://img.shields.io/node/v/signalflow?style=for-the-badge">
</p>

# SignalFlow library for JavaScript

## Install the client

To install using npm:

```sh
npm install signalflow
```

### Supported Node.js versions

| Version | Node.js         |
| ------- | --------------- |
| `8.x.x` | `>=12.10.0 <= 20` |
| `7.4.x` | `>=8.0.0 < 18`   |
| `7.3.1` | `>=8.0.0 < 11`   |

## Usage

### Configure the SignalFlow websocket endpoint

The default realm is ``us0``, unless you manually set the websocket endpoint.
If you aren't in the ``us0`` realm, you must explicitly add it to the URL
endpoint. For example, ``https://ingest.us1.signalfx.com``.

To determine which realm you are in:

1. Log in to the SignalFx web application.
2. In the left-side menu, navigate to **Settings**, then **View Profile**.
3. Select the **Organizations** tab to view your realm.

### Example

The following is a complete code example for executing a computation:

```js
var signalflow = require('signalflow');

var wsCallback = function(evt) {
    console.log("Hello, I'm a custom callback: " + evt);
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

The `options` object is an optional map and can contain following fields:

| Field                    | Type     | Description                                                               | Default                                                                                            |
|--------------------------|----------|---------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| `signalflowEndpoint`     | string   | Sets the SignalFlow endpoint.                                             | `wss://stream.us0.signalfx.com`. If you aren't in `us0`, change the realm.                         |
| `apiEndpoint`            | string   | Sets the API endpoint.                                                    | `https://api.us0.signalfx.com`. If you aren't in `us0`, change the realm.                          |
| `webSocketErrorCallback` | function | Sets the callback function that is invoked when a WebSocket error occurs. | Throws the WebSocket error. You can change the behavior to invoke a callback function instead.     |


> **Note**: A token created using the REST API is necessary to use this API. API Access tokens intended for ingest are not allowed.

### API options

The `execute()` method accepts the following parameters:

| Parameter    | Type               | Description                                                                                                     | Default                        | Required |
|--------------|--------------------|-----------------------------------------------------------------------------------------------------------------|--------------------------------|----------|
| `program`    | string             | The signalflow program to be run.                                                                               |                                | Yes      |
| `start`      | int \| string      | A milliseconds-since-epoch number or a string representing a relative time. For example: `-1h`.                 | `now`                          | No       |
| `stop`       | int \| string      | A milliseconds-since-epoch number or a string representing a relative time. For example: `-30m`.                | `infinity`                     | No       |
| `resolution` | int                | The interval across which to calculate, in 1000 millisecond intervals.                                          | `1000`                         | No       |
| `maxDelay`   | int                | The maximum time to wait for a datapoint to arrive, in 10000 millisecond intervals.                             | `dynamic`                      | No       |
| `bigNumber`  | boolean            | Sets whether to return all values in data messages as BigNumber objects. Set to true if you require returned values to have precision beyond `MAX_SAFE_INTEGER`. For more information, see [bignumber.js](https://www.npmjs.com/package/bignumber.js). | `false`                        | No       |
| `immediate`  | boolean            | Sets whether to adjust the stop timestamp so that the computation doesn't wait for future data to be available. |                                | No       |

### Computation object methods

Calls to `execute()` return an object that has the following methods:

| Method            | Parameters              | Description                                                           |
|-------------------|-------------------------|-----------------------------------------------------------------------|
| `stream`          | (function (err, data))  | Accepts a function and calls the function with computation messages when available. Returns multiple types of messages, each of which is detailed below. Following error-first callback conventions, data is returned in the second argument if no errors occurred. |
| `close`           | ()                      | Terminates the computation.                                           |
| `get_known_tsids` | ()                      | Gets all known timeseries IDs for the current computation.            |
| `get_metadata`    | (string)                | Gets the metadata message associated with the specific timeseries ID. |

### Stream message types

**Metadata:**

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

**Data:**

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

**Event:**

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

### Use in a web browser

The signalflow client can be built for use in a browser. 

1. Run the following commands:

   ```
   npm install
   npm run build:browser
   ```

   Expected output:

   ```
   The output can be found at ./build/signalflow.js
   ```

2. Load the client using a `script` tag:

   ```
   <script src="build/signalflow.js" type="text/javascript"></script>
   ```

   Once loaded, a global ``signalfx`` object is available in the browser. Note that the built file only includes the SignalFlow package.

## License

Apache Software License v2 © [Splunk](https://www.splunk.com)
