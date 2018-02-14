if(process.env.NODE_ENV === 'browser')
{
    regeneratorRuntime = require('regenerator-runtime');
}

const Client = require('./Client');

if(process.env.NODE_ENV !== 'browser')
{
    const Server = require('./Server');
    module.exports = {Client, Server};
}

else
{
    module.exports = global.Jayson = {Client};
}