const _ = require('lodash');
const test = require('tape');
const Jayson = require('../src/index');
const Errors = require('../src/Errors');
const jwt = require('jsonwebtoken')

const methods =
{
    foo: (...args) =>
    {
        return args;
    },
    bar: (...args) => 'This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string...',
    baz: (context) =>
    {
        return context;
    },
    qux: (context) =>
    {
        return new Promise((resolve, reject) =>
        {
            setTimeout(() => resolve(true), 500);  
        })
    }
};

methods.baz.schema =
{
    requires:
    {
        type: 'object',
        properties:
        {
            authorized:
            {
                type: 'boolean'
            }
        }
    }
};
methods.qux.timeout = 100;

const definitions =
{
    something:
    {
        type: 'string'
    }
};

const config =
{
    server:
    {
        title: 'Test API Server',
        description: 'A description goes here',
        $id: 'https://github.com/mhingston/jayson/blob/master/test/index.js',
        methods,
        definitions,
        logger: false,
        jsonLimit: '1kb',
        timeout: 60000,
        http:
        {
            port: 33333
        },
        ws:
        {
            port: 33334,
            heartbeat: 10000
        },
        jwt:
        {
            secret: 'ssssh'
        }
    },
    client:
    {
        http:
        {
            url: 'http://127.0.0.1:33333'
        },
        ws:
        {
            url: 'ws://127.0.0.1:33334'
        }
    }
};

const server = new Jayson.Server(config.server);
const client =
{
    http: new Jayson.Client(config.client.http),
    ws: new Jayson.Client(config.client.ws)
};
const tests = [];

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should connect to the server (HTTP).', async (t) =>
        {
            try
            {
                await client.http.connect();
                t.pass('Client connected to server.');
            }    

            catch(error)
            {
                t.fail('Client failed to connect to server.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should connect to the server (WS).', async (t) =>
        {
            try
            {
                await client.ws.connect();
                t.pass('Client connected to server.');
            }    

            catch(error)
            {
                t.fail('Client failed to connect to server.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    test('Client should connect to the server (HTTP) using a callback.', (t) =>
    {
        client.http.connect((error, client) =>
        {
            if(error)
            {
                t.fail('Client failed to connect to server.');
            }

            else
            {
                t.pass('Client connected to server.');
            }

            t.end();
        });
    });
});

tests.push(() =>
{
    test('Client should connect to the server (WS) using a callback.', (t) =>
    {
        client.ws.connect((error, client) =>
        {
            if(error)
            {
                t.fail('Client failed to connect to server.');
            }

            else
            {
                t.pass('Client connected to server.');
            }

            t.end();
            return resolve(true)
        });
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Server (HTTP) should return a method schema.', async (t) =>
        {
            try
            {
                const schema = await client.http.discover();
                t.equal('object', typeof schema, 'schema is an object.');
                t.equal(config.server.title, schema.title, `title property is equal to "${config.server.title}"`);
                t.equal(config.server.description, schema.description, `description property is equal to "${config.server.description}"`);
                t.equal(config.server.$id, schema.$id, `$id property is equal to "${config.server.$id}"`);
                t.deepLooseEqual(config.server.definitions, schema.definitions, 'defintions property is equal to server config definitions.');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Server (WS) should return a method schema.', async (t) =>
        {
            try
            {
                const schema = await client.http.discover();
                t.equal('object', typeof schema, 'schema is an object.');
                t.equal(config.server.title, schema.title, `title property is equal to "${config.server.title}"`);
                t.equal(config.server.description, schema.description, `description property is equal to "${config.server.description}"`);
                t.equal(config.server.$id, schema.$id, `$id property is equal to "${config.server.$id}"`);
                t.deepLooseEqual(config.server.definitions, schema.definitions, 'defintions property is equal to server config definitions.');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    test('Server (HTTP) should return a method schema using a callback.', (t) =>
    {
        client.http.discover((error, schema) =>
        {
            if(error)
            {
                t.fail('Client failed to connect to server.');
            }

            else
            {
                t.equal('object', typeof schema, 'schema is an object.');
                t.equal(config.server.title, schema.title, `title property is equal to "${config.server.title}"`);
                t.equal(config.server.description, schema.description, `description property is equal to "${config.server.description}"`);
                t.equal(config.server.$id, schema.$id, `$id property is equal to "${config.server.$id}"`);
                t.deepLooseEqual(config.server.definitions, schema.definitions, 'defintions property is equal to server config definitions.');
            }

            t.end();
            return resolve(true)
        });
    });
});

tests.push(() =>
{
    test('Server (WS) should return a method schema using a callback.', (t) =>
    {
        client.ws.discover((error, schema) =>
        {
            if(error)
            {
                t.fail('Client failed to connect to server.');
            }

            else
            {
                t.equal('object', typeof schema, 'schema is an object.');
                t.equal(config.server.title, schema.title, `title property is equal to "${config.server.title}"`);
                t.equal(config.server.description, schema.description, `description property is equal to "${config.server.description}"`);
                t.equal(config.server.$id, schema.$id, `$id property is equal to "${config.server.$id}"`);
                t.deepLooseEqual(config.server.definitions, schema.definitions, 'defintions property is equal to server config definitions.');
            }

            t.end();
            return resolve(true)
        });
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "foo" on server (HTTP).', async (t) =>
        {
            try
            {
                const response = await client.http.call(
                {
                    method: 'foo'
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal(true, Array.isArray(response.result), '"result" property is an array.');
                t.equal('object', typeof response.result[0], '"result[0]" is an object.');
                t.notEqual('websocket', response.result[0].headers.upgrade, '"result[0].headers.upgrade" is not set.');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "foo" on server (WS).', async (t) =>
        {
            try
            {
                const response = await client.ws.call(
                {
                    method: 'foo'
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal(true, Array.isArray(response.result), '"result" property is an array.');
                t.equal('object', typeof response.result[0], '"result[0]" is an object.');
                t.equal('websocket', response.result[0].headers.upgrade, '"result[0].headers.upgrade" is set.');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    test('Client should call method "foo" on server (HTTP) using a callback.', async (t) =>
    {
        client.http.call(
        {
            method: 'foo',
            callback: (error, result) =>
            {
                if(error)
                {
                    t.fail('Client failed to connect to server.');
                }

                else
                {
                    t.equal(true, Array.isArray(result), 'result is an array.');
                    t.equal('object', typeof result[0], '"result[0]" is an object.');
                    t.notEqual('websocket', result[0].headers.upgrade, '"result[0].headers.upgrade" is not set.');
                }

                t.end();
            }
        });
    });
});

tests.push(() =>
{
    test('Client should call method "foo" on server (WS) using a callback.', async (t) =>
    {
        client.ws.call(
        {
            method: 'foo',
            callback: (error, result) =>
            {
                if(error)
                {
                    t.fail('Client failed to connect to server.');
                }

                else
                {
                    t.equal(true, Array.isArray(result), 'result is an array.');
                    t.equal('object', typeof result[0], '"result[0]" is an object.');
                    t.equal('websocket', result[0].headers.upgrade, '"result[0].headers.upgrade" is set.');
                }

                t.end();
            }
        });
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "bar" on server (HTTP).', async (t) =>
        {
            try
            {
                const response = await client.http.call(
                {
                    method: 'bar'
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('object', typeof response.error, '"error" property is an object.');
                t.equal(Errors.OVERSIZED_RESPONSE, response.error.code, 'Error code is equal to "OVERSIZED_RESPONSE".');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "bar" on server (WS).', async (t) =>
        {
            try
            {
                const response = await client.ws.call(
                {
                    method: 'bar'
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('object', typeof response.error, '"error" property is an object.');
                t.equal(Errors.OVERSIZED_RESPONSE, response.error.code, 'Error code is equal to "OVERSIZED_RESPONSE".');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "baz" on server (HTTP) with valid auth token.', async (t) =>
        {
            try
            {
                const response = await client.http.call(
                {
                    method: 'baz',
                    auth: jwt.sign({authorized: true}, config.server.jwt.secret)
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('object', typeof response.result, '"result" property is an object.');
                t.equal('object', typeof response.result.auth, '"result.auth" property is an object.');
                t.equal(true, response.result.auth.authorized, '"result.auth.authorized" is true.');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "baz" on server (WS) with valid auth token.', async (t) =>
        {
            try
            {
                const response = await client.ws.call(
                {
                    method: 'baz',
                    auth: jwt.sign({authorized: true}, config.server.jwt.secret)
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('object', typeof response.result, '"result" property is an object.');
                t.equal('object', typeof response.result.auth, '"result.auth" property is an object.');
                t.equal(true, response.result.auth.authorized, '"result.auth.authorized" is true.');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "baz" on server (HTTP) with invalid auth token.', async (t) =>
        {
            try
            {
                const response = await client.http.call(
                {
                    method: 'baz',
                    auth: jwt.sign({authorized: true}, 'wrong secret')
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('object', typeof response.error, '"error" property is an object.');
                t.equal(Errors.UNAUTHORIZED, response.error.code, 'Error code is equal to "UNAUTHORIZED".');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "baz" on server (WS) with invalid auth token.', async (t) =>
        {
            try
            {
                const response = await client.ws.call(
                {
                    method: 'baz',
                    auth: jwt.sign({authorized: true}, 'wrong secret')
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('object', typeof response.error, '"error" property is an object.');
                t.equal(Errors.UNAUTHORIZED, response.error.code, 'Error code is equal to "UNAUTHORIZED".');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "qux" on server (HTTP) and timeout', async (t) =>
        {
            try
            {
                const response = await client.http.call(
                {
                    method: 'qux'
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('object', typeof response.error, '"error" property is an object.');
                t.equal(Errors.TIMEOUT, response.error.code, 'Error code is equal to "TIMEOUT".');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should call method "qux" on server (WS) and timeout', async (t) =>
        {
            try
            {
                const response = await client.ws.call(
                {
                    method: 'qux'
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('object', typeof response.error, '"error" property is an object.');
                t.equal(Errors.TIMEOUT, response.error.code, 'Error code is equal to "TIMEOUT".');
            }    

            catch(error)
            {
                t.fail('Request failed.');
            }

            t.end();
            return resolve(true);
        }); 
    });
});

const main = async () =>
{
    for(const t of tests)
    {
        let result = t();

        if(result instanceof Promise)
        {
            await result;
        }
    }

    process.exit();
}

main();