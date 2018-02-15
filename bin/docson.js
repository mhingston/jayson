#!/usr/bin/env node

const program = require('commander');
const docson = require('node-docson')();
let Jayson;

try
{
    Jayson = require('jayson');
}

catch(error)
{
    Jayson = require('../src/index');
}

const fs = require('fs');

program
.version('1.0.0')
.option('-s, --server <server>', 'Server URL')
.option('-o, --output <output>', 'Output file')
.parse(process.argv);

if(!program.server && !program.output)
{
    program.outputHelp();
    process.exit();
}

const client = new Jayson.Client(
{
    url: program.server
});
client.connect()
.then(() => client.discover())
.then((response) =>
{
    const schema = response.result;
    const element = docson.doc(schema);
    fs.writeFileSync(program.output, element.ownerDocument.documentElement.outerHTML);
})
.catch((error) => console.log(error.message))