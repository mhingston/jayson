const methods =
{
    returnsObject: (args) =>
    {
        return {
                a: 1,
                b: ['a', 'b', 'c'],
                c: true
            };
    }
}

methods.returnsObject.schema =
{
    returns:
    {
        '$ref': '#/definitions/foo'
    }
}

module.exports = methods;