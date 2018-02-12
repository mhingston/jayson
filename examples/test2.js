class Methods
{
    constructor()
    {
        this.foo = 1;
    }

    a()
    {
        console.log(this.a);
        return this.foo;
    }
}

x = new Methods()
x.a();