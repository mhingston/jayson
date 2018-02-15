const _ = require('lodash');
const test = require('tape');
const Jayson = require('../src/index');

const singleton =
{
    foo: () => 'hello',
    bar: ({a = 1, b = 2, c = 3}) => a + b + c,
    baz: 'Not callable',
    qux: () => new Date(),
    quux: () => () => {},
    quuz: () => new Promise((resolve, reject) => resolve(true)),
    corge: ({a = 'world'}) => new Promise((resolve, reject) => resolve('hello ' + a)),
    wibble:
    {
        wobble:
        {
            wubble:
            {
                flib: (a) => new Date(),
                flob: () => new Promise((resolve, reject) => reject(false)),
                flub: (a, b, c) => a + b + c 
            }
        }
    },
    schema:
    {
        bar:
        {
            properties:
            {
                a:
                {
                    type: 'number'
                },
                b:
                {
                    type: 'number'
                },
                c:
                {
                    type: 'number'
                }
            },
            minProperties: 3,
            additionalProperties: false
        }
    }
}

class Instance
{
    foo()
    {
        return 'bar';
    }
}

const config1 =
{
    instance: singleton,
    logger: true,
    wsOptions:
    {
        port: 33332
    }
}

const config2 =
{
    instance: new Instance(),
    logger: true,
    wsOptions:
    {
        port: 33333
    }
}

// const rpc1 = new Respect(config1);
// const rpc2 = new Respect(config2);
// const ws1 = new WebSocket(`ws://127.0.0.1:${config1.wsOptions.port}`);
// const ws2 = new WebSocket(`ws://127.0.0.1:${config2.wsOptions.port}`);

// ws1.on('open', () =>
// {
//     test('should return parse error with invalid JSON', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.PARSE_ERROR, _.get(json, 'error.code'));    
//             t.end();
//         });

//         ws1.send('Non JSON'); 
//     });

//     test('should return invalid request with incorrect jsonrpc version', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INVALID_REQUEST, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '1.1',
//             method: 'foo',
//             params: [1,2,3],
//             id: 1
//         }));
//     });

//     test('should return invalid request with missing method', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INVALID_REQUEST, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             params: [1,2,3],
//             id: 1
//         }));
//     });

//     test('should return invalid request with invalid method type', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INVALID_REQUEST, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: null,
//             params: [1,2,3],
//             id: 1
//         }));
//     });

//     test('should return method not found when method is not a function', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.METHOD_NOT_FOUND, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'baz',
//             params: [1,2,3],
//             id: 1
//         }));
//     });

//     test('should return invalid params if params does not match schema (request with no params)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INVALID_PARAMS, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'bar',
//             id: 1
//         }));
//     });

//     test('should return result for valid request (no params)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.notEqual(json.result, undefined);
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'foo',
//             id: 1
//         }));
//     });

//     test('should return internal error for a method (no params) that returns an invalid type (Date)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INTERNAL_ERROR, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'qux',
//             id: 1
//         }));
//     });

//     test('should return internal error for a method (no params) that returns an invalid type (Function)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INTERNAL_ERROR, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'quux',
//             id: 1
//         }));
//     });

//     test('should return a value for a method (no params) that returns a resolvable Promise', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.notEqual(json.result, undefined);
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'quuz',
//             id: 1
//         }));
//     });

//     test('should return internal error for a method (no params) that returns a rejectable Promise', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INTERNAL_ERROR, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'wibble.wobble.wubble.flob',
//             id: 1
//         }));
//     });

//     test('should return invalid params if params does not match schema (request with object params)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INVALID_PARAMS, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'bar',
//             params:
//             {
//                 a: 1,
//                 b: 2
//             },
//             id: 1
//         }));
//     });

//     test('should return a value if params matches schema (request with object params)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.notEqual(json.result, undefined);
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'bar',
//             params:
//             {
//                 a: 1,
//                 b: 2,
//                 c: 3
//             },
//             id: 1
//         }));
//     });

//     test('should return a value if no schema is provided (request with object params)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.notEqual(json.result, undefined);
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'corge',
//             params:
//             {
//                 a: 'world'
//             },
//             id: 1
//         }));
//     });

//     test('should return internal error for a method (with object params) that returns an invalid type (Date)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INTERNAL_ERROR, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'qux',
//             params:
//             {
//                 a: 1
//             },
//             id: 1
//         }));
//     });

//     test('should return internal error for a method (with object params) that returns an invalid type (Function)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INTERNAL_ERROR, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'quux',
//             params:
//             {
//                 b: ''
//             },
//             id: 1
//         }));
//     });

//     test('should return a value for a method (with object params) that returns a resolvable Promise', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.notEqual(json.result, undefined);
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'quuz',
//             params:
//             {
//                 c: true
//             },
//             id: 1
//         }));
//     });

//     test('should return internal error for a method (with object params) that returns a rejectable Promise', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INTERNAL_ERROR, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'wibble.wobble.wubble.flob',
//             params:
//             {
//                 d: [1, 2, 3, 4]
//             },
//             id: 1
//         }));
//     });

//     test('should return a value for a valid request (request with array params)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.notEqual(json.result, undefined);
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'wibble.wobble.wubble.flub',
//             params: ['wibble', 'wobble', 'wubble'],
//             id: 1
//         }));
//     });

//     test('should return internal error for a method (with array params) that returns an invalid type (Date)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INTERNAL_ERROR, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'wibble.wobble.wubble.flib',
//             params: ['a'],
//             id: 1
//         }));
//     });

//     test('should return invalid params if params does not match method signature (request with array params)', (t) =>
//     {
//         ws1.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.equal(rpc1.status.INVALID_PARAMS, _.get(json, 'error.code'));
//             t.end();
//         });

//         ws1.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'quux',
//             params: [true, false],
//             id: 1
//         }));
//     });
// });

// ws2.on('open', () =>
// {
//     test('should return result for valid request (no params)', (t) =>
//     {
//         ws2.once('message', (message) =>
//         {
//             const json = JSON.parse(message);
//             t.notEqual(json.result, undefined);
//             t.end();
//             process.exit();
//         });

//         ws2.send(JSON.stringify(
//         {
//             jsonrpc: '2.0',
//             method: 'foo',
//             id: 1
//         }));
//     });
// });