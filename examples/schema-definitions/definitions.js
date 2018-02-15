const definitions =
{
    foo:
    {
        type: 'object',
        properties:
        {
            a:
            {
                type: 'number'
            },
            b:
            {
                type: 'array',
                items:
                {
                    type: 'string'
                }
            },
            c:
            {
                type: 'boolean'
            }
        }
    }
}

module.exports = definitions;