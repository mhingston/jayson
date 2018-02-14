# Jayson

[JSON-RPC](http://www.jsonrpc.org/specification) inspired server and client with HTTP and WebSocket transports and JSON Schema IDL.

## Installation

```
npm install mhingston/jayson
```

## Introduction

### Format 

Jayson uses a custom version of JSON-RPC for messages. The specification is based on [JSON-RPC 2.0](http://www.jsonrpc.org/specification) with the following changes:

* The `request` and `response` objects **must** contain the property `jayson` with the value set to the version of the API being used. This property **replaces** the `jsonrpc` property.

  e.g.

  ```json
  {
      "jayson": "1.0"
  }
  ```

* A `response` object without an `error` property and without a `result` property indicates that the remote method returned `undefined`.

* The following additional properties can be defined within a `request` object:

    * `auth` {String} A JWT providing the authentication context.

The reason for baking auth into JSON-RPC was that I felt it should be part of the protocol and not reliant on the different authentication mechanisms available within the transport layers (i.e. HTTP, WebsSocket).

### Method Properties

Remote methods may have attached to them the following properties:

* `schema` {Object} A JSON schema which is used as the IDL. The schema must verify against the [method schema](https://github.com/mhingston/jayson/blob/master/schemas/1.0/method.json). If a method doesn't provide a full schema then any calls to the method won't have their `auth` or `params` properties validated. Similarly if the `returns` schema isn't defined then the return value won't be validated.

    #### Example

    ```javascript
    function hello(name)
    {
        return 'Hello ' + name;
    }

    hello.schema =
    {
        params:
        {
            type: 'string'
        },
        returns:
        {
            type: 'string'
        }
    }
    ```

    If you need to reference schema definitions you should pass in your `definitions` schema to the server config. [Example](https://github.com/mhingston/jayson/blob/master/examples/schema-definitions).

* `timeout` {Number} How long to wait (in milliseconds) before timing out the request. If not provided then the `timeout` value will be used from the server config. If that's `undefined` then calls won't timeout.
    
## Usage

### Server

Note: The server is intended to be run behind a reverse proxy.

```javascript
// Import the module
const Jayson = require('jayson');

// Declare an object literal with all the methods you want to expose...
const methods =
{
    foo: () => 'hello',
    bar: (a, b) => a + b,
    baz: ({name}) => 'hello ' + name 
};

// ...or pass in an instance of a class with the methods you want to expose.
class Method
{
    foo()
    {
        return 'hello';
    }

    bar(a, b)
    {
        return a + b
    }

    baz({name})
    {
        return 'hello ' + name;
    }
}

const methods = new Method();
```

Define your config (default values shown below):

```javascript
const config =
{
    title: 'Jayson Server API',
    methods,
    logger: false,
    jsonLimit: '1mb',
    http:
    {
        port: 3000,
        cors: {},
        helmet: {noCache: true},
        compress: {}
    },
    ws:
    {
        port: 3001,
        heartbeat: 30000
    },
    jwt:
    {
        secret: 'sauce'
    }
}
```
* `title` {String} Name of the API instance. Default = `Jayson Server API`.
* `methods` {Object} **(Required)** Object containing the methods exposed to the RPC server.
* `logger` {Boolean|Function} Set to true to have debug log written to the console or pass in a function to receive the log messages. Default = `false`.
* `jsonLimit` {String} Maximum size of the message payload. Default = `'1mb'`.
* `http` {Object}.
  * `port` {Number} Port to listen to HTTP connections on. Default = `3000`.
  * `cors` {Object} CORS options, see [koa2-cors](https://github.com/zadzbw/koa2-cors#options). Default = `{}`.
  * `helmet` {Object} Helmet options, see [koa-helmet](https://github.com/venables/koa-helmet). Default = `{noCache: true}`.
  * `compress` {Object} Compress options, see [compress](https://github.com/koajs/compress#options). Default = `{}`. 
* `ws` {Object}.
  * `port` {Number} Port to listen to WebSocket connections on. Default = `3001`.
  * `heartbeat` {Number} How often to send pings to clients (in milliseconds). Default = `30000`.
* `jwt` {Object}.
  * `secret` {String|Buffer|Object} See [jwt.sign](https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback). Default = `'sauce'`.
  * `options` {Object} See [jwt.sign](https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback).

Note: The config must include a `http` and/or a `ws` property.

Instantiate a new RPC server:
```javascript
new Jayson.Server(config);
```