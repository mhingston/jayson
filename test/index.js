const _ = require('lodash');
const test = require('tape');
const Jayson = require('../src/index');
const Errors = require('../src/Errors');

const methods =
{
    foo: (...args) => 'hello',
    bar: (...args) => 'This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string... This is a really long string...'
};

const definitions =
{
    something:
    {
        type: 'string'
    }
};

const config =
[
    {
        server:
        {
            title: 'Test API Server',
            description: 'A description goes here',
            $id: 'https://github.com/mhingston/jayson/blob/master/test/index.js',
            methods,
            definitions,
            logger: false,
            jsonLimit: '512b',
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
        [
            {
                url: 'http://127.0.0.1:33333'
            },
            {
                url: 'ws://127.0.0.1:33334'
            }
        ]
    }
];

const server = new Jayson.Server(config[0].server);
const client =
[
    new Jayson.Client(config[0].client[0]),
    new Jayson.Client(config[0].client[1])
];
const tests = [];

tests.push(() =>
{
    return new Promise((resolve, reject) =>
    {
        test('Client should connect to the server (HTTP).', async (t) =>
        {
            try
            {
                await client[0].connect();
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
                await client[1].connect();
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
        test('Server (HTTP) should return a method schema.', async (t) =>
        {
            try
            {
                const schema = await client[0].discover();
                t.equal('object', typeof schema, 'schema is an object.');
                t.equal(config[0].server.title, schema.title, `title property is equal to "${config[0].server.title}"`);
                t.equal(config[0].server.description, schema.description, `description property is equal to "${config[0].server.description}"`);
                t.equal(config[0].server.$id, schema.$id, `$id property is equal to "${config[0].server.$id}"`);
                t.deepLooseEqual(config[0].server.definitions, schema.definitions, 'defintions property is equal to server config definitions.');
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
                const schema = await client[0].discover();
                t.equal('object', typeof schema, 'schema is an object.');
                t.equal(config[0].server.title, schema.title, `title property is equal to "${config[0].server.title}"`);
                t.equal(config[0].server.description, schema.description, `description property is equal to "${config[0].server.description}"`);
                t.equal(config[0].server.$id, schema.$id, `$id property is equal to "${config[0].server.$id}"`);
                t.deepLooseEqual(config[0].server.definitions, schema.definitions, 'defintions property is equal to server config definitions.');
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
        test('Client should call method "foo" on server (HTTP).', async (t) =>
        {
            try
            {
                const response = await client[0].call(
                {
                    method: 'foo'
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('hello', response.result, '"result" property is equal to "hello".');
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
                const response = await client[1].call(
                {
                    method: 'foo'
                });
                t.equal('object', typeof response, 'response is an object.');
                t.equal('1.0', response.jayson, 'valid jayson response.');
                t.equal('hello', response.result, '"result" property is equal to "hello".');
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
        test('Client should call method "bar" on server (HTTP).', async (t) =>
        {
            try
            {
                const response = await client[0].call(
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
                const response = await client[1].call(
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

const main = async () =>
{
    for(const t of tests)
    {
        await t();
    }

    process.exit();
}

main();