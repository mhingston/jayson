# ResPeCt

[JSON-RPC](http://www.jsonrpc.org/specification) 2.0 server over WebSockets.

For a JSON-RPC 2.0 client check out [CyPRus](https://github.com/mhingston/cyprus).

## Installation

    npm install mhingston/respect
    
## Usage

```javascript
// Import the module
const Respect = require('respect');

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

You can optionally include a `schema` object within `methods` for defining [JSON schemas](http://json-schema.org/) for `methods` which expect named (i.e. destructured) parameters.

```javascript
methods.schema =
{
    baz:
    {
        properties:
        {
            name:
            {
                type: 'string'
            }
        },
        minProperties: 1,
        additionalProperties: false
    }
}
```

Define your config:

```javascript
const config =
{
    instance: methods,
    logger: true,
    wsOptions:
    {
        port: 33333
    }
}
```
* `instance` {Object} Object containing the methods exposed to the RPC server.
* `logger` {Boolean|Function} Set to true to have debug log written to the console or pass a function to receive the log messages. Default = `false`.
* `wsOptions` {Object} Options passed to [ws](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback).


Instantiate a new RPC server
```javascript
const rpc = new Respect(config);
```

## Notes

* Supports JSON-RPC 2.0 **only**.
* Calls to methods without named parameters must have the same number of arguments as the method signature.
* Supports async methods, i.e. returning a promise. Callbacks are not supported as functions don't "JSONify".
* You can access the client headers sent with the upgrade request from within a method by accessing the property `<methodName>._requestHeaders` or `this._requestHeaders` depending on whether your method has a lexical `this`.
* Check out the [tests](https://github.com/mhingston/respect/blob/master/test/index.js) for more examples.
