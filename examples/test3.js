const Methods = () =>
{
    const a = 1;

    return {
        b: () => console.log(a)
    }
}

x = Methods()
x.b();
// x.c();
// console.log(this);
// console.log(util.inspect(a()))
// console.log(b()());