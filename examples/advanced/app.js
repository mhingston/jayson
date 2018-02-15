const Jayson = require('../../src/index');
const methods = require('./methods');
const jwt = require('jsonwebtoken');
const SECRET = 'sauce';

const main = async () =>
{
    const server = new Jayson.Server(
    {
        methods,
        ws:
        {
            port: 3001
        },
        jwt:
        {
            secret: SECRET
        }
    });
    
    const client = new Jayson.Client(
    {
        url: 'ws://127.0.0.1:3001'
    })
    
    try
    {
        await client.connect();
        await client.discover();
        let response;
        
        response = await client.call(
        {
            method: 'returnsUndefined',
            params: [1, 2, 3]
        });
        console.log(response);

        response = await client.call(
        {
            method: 'returnsNull',
            params: ['a', 'b', 'c']
        });
        console.log(response);

        response = await client.call(
        {
            method: 'returnsString',
            params: {}
        });
        console.log(response);

        response = await client.call(
        {
            method: 'returnsNumber',
            params: [3, 4]
        });
        console.log(response);

        response = await client.call(
        {
            method: 'returnsNumberTimesOut',
            params: [4, 5]
        });
        console.log(response);

        response = await client.call(
        {
            method: 'returnsBoolean',
            auth: jwt.sign(
            {
                UserID: 1
            }, SECRET)
        });
        console.log(response);

        response = await client.call(
        {
            method: 'returnsArray',
            params:
            {
                foo: '1',
                bar: '2',
                baz: '3'
            }
        });
        console.log(JSON.stringify(response));

        response = await client.call(
        {
            method: 'returnsObject',
        });
        console.log(JSON.stringify(response));
    }

    catch(error)
    {
        console.log(error.message);
    }
}

main();