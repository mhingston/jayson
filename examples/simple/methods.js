const methods =
{
    hello: (context, name) =>
    {
        return 'Hello ' + name + ' from: ' + context.headers['x-forwarded-for']
    }
}

methods.hello.schema =
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

module.exports = methods;