const Jayson = require('../../src/index');
const methods = require('./methods');

const main = async () =>
{
    const server = new Jayson.Server(
    {
        methods,
        http:
        {
            port: 3000
        }
    });
    
    const client = new Jayson.Client(
    {
        url: 'http://127.0.0.1:3000'
    })
    
    try
    {
        await client.connect();
        await client.discover();
        const response = await client.call(
        {
            method: 'hello',
            params: 'Jayson User'
        });
        console.log(response);
    }

    catch(error)
    {
        console.log(error.message);
    }
}

main();