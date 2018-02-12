const Methods = () =>
{
    const a = () =>
    {
        this.b = 4;
        console.log(this);
    }

    function c()
    {
        this.b = 2;
        console.log('yo', c)
        console.log(this);
    }

    return {a, c}
}

x = Methods.call({})
x.a();
x.c();
// console.log(this);
// console.log(util.inspect(a()))
// console.log(b()());