const _ = require('lodash');
const test = require('tape');
const Jayson = require('../src/index');
const methods =
{
    foo: () => 'bar'
}
const definitions =
{
    something:
    {
        type: 'string'
    }
}

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
            jsonLimit: '1mb',
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

// tests.push(() =>
// {
//     return new Promise((resolve, reject) =>
//     {
//         test('Server (WS) should return a method schema.', async (t) =>
//         {
//             try
//             {
//                 const schema = await client[1].discover();
//                 console.log(schema)
//                 t.equal('object', typeof schema, 'schema is an object.');
//                 t.equal(config[0].server.title, schema.title, `title property is equal to "${config[0].server.title}"`);
//                 t.equal(config[0].server.description, schema.description, `description property is equal to "${config[0].server.description}"`);
//                 t.equal(config[0].server.$id, schema.$id, `$id property is equal to "${config[0].server.$id}"`);
//                 t.deepLooseEqual(config[0].server.definitions, schema.definitions, 'defintions property is equal to server config definitions.');
//             }    

//             catch(error)
//             {
//                 t.fail('Request failed.');
//             }

//             t.end();
//             return resolve(true);
//         }); 
//     });
// });

const main = async () =>
{
    for(const t of tests)
    {
        await t();
    }

    process.exit();
}

main();