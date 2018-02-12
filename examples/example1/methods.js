const methods =
{
    hello: (...args) =>
    {
        return new Promise((resolve, reject) =>
        {
            return setTimeout(() =>
            {
                return resolve('hi');
            }, 1000);
        });
    }
}

methods.hello.timeout = 5000;

module.exports = methods;