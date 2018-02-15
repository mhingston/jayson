const methods = () =>
{
    const _private =
    {
        status: null
    };

    const returnsUndefined = (context, a, b, c) =>
    {
        console.log(`Sum of: ${a} + ${b} + ${c} = ${a + b + c}`);
    }

    returnsUndefined.schema =
    {
        params:
        {
            type: 'array',
            items:
            {
                type: 'number'
            }
        }
    }

    const returnsNull = (...args) =>
    {
        console.log(...args);
        return _private.status;
    }

    returnsNull.schema =
    {
        params:
        {
            type: 'array'
        },
        returns:
        {
            type: 'null'
        }
    }

    const returnsString = (args) =>
    {
        return 'hello ' + args.context.headers['x-forwarded-for'];
    }

    returnsString.schema =
    {
        params:
        {
            type: 'object'
        },
        returns:
        {
            type: 'string'
        }
    }

    const returnsNumber = (context, a, b) =>
    {
        return new Promise((resolve, reject) =>
        {
            setTimeout(() => resolve(a ** b), 2000)  
        });
    }

    returnsNumber.schema =
    {
        params:
        {
            type: 'array',
            items:
            {
                type: 'number'
            }
        },
        returns:
        {
            type: 'number'
        }
    }

    const returnsNumberTimesOut = (context, a, b) =>
    {
        return new Promise((resolve, reject) =>
        {
            setTimeout(() => resolve(a ** b), 2000)  
        });
    }

    returnsNumberTimesOut.schema =
    {
        params:
        {
            type: 'array',
            items:
            {
                type: 'number'
            }
        },
        returns:
        {
            type: 'number'
        }
    }
    returnsNumberTimesOut.timeout = 1000;

    const returnsBoolean = (context) =>
    {
        if(context.auth.UserID === 1)
        {
            return true;
        }

        else
        {
            return false;
        }
    }

    returnsBoolean.schema =
    {
        requires:
        {
            type: 'object',
            properties:
            {
                UserID:
                {
                    type: 'number',
                    enum: [1]
                }
            }
        },
        returns:
        {
            type: 'boolean'
        }
    }

    const returnsArray = (args) =>
    {
        const kvPairs = Object.keys(args)
        .filter((key) => key !== 'context')
        .map((key) => [key, args[key]])
        return kvPairs;
    }

    returnsArray.schema =
    {
        params:
        {
            type: 'object'
        },
        returns:
        {
            type: 'array'
        }
    }

    const returnsObject = (context) =>
    {
        return {
            a: 1,
            b: ['a', 'b', 'c'],
            c: true
        }
    }

    returnsObject.schema =
    {
        returns:
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
                },
                d:
                {
                    type: 'null'
                }
            },
            required: ['a', 'b', 'c']
        }
    }

    return {
        returnsUndefined,
        returnsNull,
        returnsString,
        returnsNumber,
        returnsNumberTimesOut,
        returnsBoolean,
        returnsArray,
        returnsObject
    }
}

module.exports = methods();