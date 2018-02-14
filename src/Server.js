const Errors = require('./Errors');
const _ = require('lodash');
const {format} = require('date-fns');
const fnArgs = require('fn-args');
const Ajv = require('ajv');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const Koa = require('koa');
const Router = require('koa-router');
const cors = require('koa2-cors');
const helmet = require('koa-helmet');
const compress = require('koa-compress');
const bodyParser = require('koa-bodyparser');
const HttpStatus = require('http-status-codes');
const bytes = require('bytes');
const path = require('path');
const methodSchema = require(path.join(__dirname, '..', 'schemas', '1.0', 'method.json'));

class Server
{
    constructor(config)
    {
        if(config.logger && typeof config.logger.log === 'function')
        {
            this.logger = config.logger;
        }

        else if(typeof config.logger === 'function')
        {
            this.logger = {log: config.logger};
        }

        else if(config.logger === true)
        {
            this.logger = {log: (...args) => console.log(...args)};
        }

        else
        {
            this.logger = {log: () => {}};
        }

        this.VERSION = '1.0';
        this.methods = config.methods;
        config.title = config.title || 'Jayson Server API'
        config.jwt = config.jwt || {};
        config.jwt.secret = config.jwt.secret || 'sauce';
        this.config = {};
        
        for(const key in config)
        {
            if(key !== 'methods')
            {
                this.config[key] = config[key];
            }
        }
        
        if(config.http)
        {
            config.http.port = config.http.port || 3000;
            const router = new Router();

            router.post('/', async (ctx, next) =>
            {
                const headers = ctx.request.headers;
                headers['x-forwarded-for'] = ctx.ip.replace(/^::ffff:/, '');

                ctx.body = await this.handleMessage(
                {
                    message: ctx.request.body,
                    headers
                });
            });

            this.http = new Koa();
            this.http.proxy = true;
            this.http.use(cors(config.http.cors || {}));
            this.http.use(helmet(config.http.helmet || {noCache: true}));
            this.http.use(compress(config.http.compress || {}));
            this.http.use(bodyParser(
            {
                jsonLimit: config.jsonLimit || '1mb',
                onerror: (error, ctx) =>
                {
                    ctx.status = HttpStatus.UNPROCESSABLE_ENTITY;
                    ctx.body =
                    {
                        jayson: this.VERSION,
                        error:
                        {
                            code: this.errors.PARSE_ERROR,
                            message: 'Unable to parse request body.'
                        },
                    };
                }
            }));
            this.http.use(router.routes());
            this.http.use(router.allowedMethods());
            this.http.listen(config.http.port, () => this.logger.log('info', `Listening on http://127.0.0.1:${config.http.port}`));
        }

        if(config.ws)
        {   
            config.ws.port = config.ws.port || 3001;
            config.ws.heartbeat = config.ws.heartbeat || 30000;
            
            this.wss = new WebSocket.Server(config.ws);
            this.wss.on('connection', (ws, req) =>
            {
                ws.isAlive = true;
                req.headers['x-forwarded-for'] = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                req.headers['x-forwarded-for'] = req.headers['x-forwarded-for'].replace(/^::ffff:/, '');
                this.logger.log('info', `${req.headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Connection established`);
                ws.on('message', (message) => this.handleMessage({message, ws, headers: req.headers}));
                ws.on('error', (error) => this.handleError({error, headers: req.headers}));
                ws.on('close', (code) => this.handleClose({code, headers: req.headers}));
                ws.on('pong', () => ws.isAlive = true);
            });

            this.timer = setInterval(() =>
            {
                this.wss.clients.forEach((ws) =>
                {
                    if(ws.isAlive === false)
                    {
                        return ws.terminate();
                    }
            
                    ws.isAlive = false;
                    ws.ping(() => {});
                });
            }, config.ws.heartbeat);
        }
    }

    get errors()
    {
        return Errors;
    }

    discover(id)
    {
        const schema =
        {
            $schema: 'http://json-schema.org/schema#',
            title: this.config.title,
            description: this.config.description,
            type: 'object',
            properties: {}
        };

        if(this.config.$id)
        {
            schema.$id = this.config.$id;
        }

        if(this.config.definitions)
        {
            schema.definitions = this.config.definitions;
        }

        const traverse = (root, namespace, paths) =>
        {
            const keys = Object.keys(namespace);
            
            for(const key of keys)
            {
                if(typeof namespace[key] === 'function')
                {
                    if(namespace[key].schema)
                    {
                        root.properties[key] =
                        {
                            type: 'function',
                            properties: namespace[key].schema
                        }
                    }

                    else
                    {
                        root.properties[key] =
                        {
                            type: 'function',
                            properties: {}
                        };
                    }

                    if(namespace[key].timeout)
                    {
                        root.properties[key].properties.timeout =
                        {
                            type: 'number',
                            minimum: namespace[key].timeout,
                            maximum: namespace[key].timeout
                        }
                    }

                    const ajv = new Ajv();

                    if(!ajv.validate(methodSchema, root.properties[key]))
                    {
                        const ns = paths.length ? `${paths.join('.')}.${key}` : key;
                        const error = new Error(`The schema provided for '${ns}' doesn't validate against the method schema (${methodSchema.$id})`);
                        error.description = ajv.errors;
                        throw error;
                    }
                }

                else if(typeof namespace[key] === 'object')
                {
                    root.properties[key] =
                    {
                        type: 'object',
                        properties: {}
                    };

                    paths.push(key);
                    traverse(root.properties[key], namespace[key], paths);
                }
            }
        }

        traverse(schema, this.methods, []);
        
        return {
            jayson: this.VERSION,
            id,
            result: schema
        }
    }

    async handleCall({json, headers})
    {
        let schema;
        let result;
        const id = (typeof json.id === 'string' || typeof json.id === 'number' || json.id === null) ? json.id : undefined;
        const ajv = new Ajv();

        const errorCheck = () =>
        {
            if(!['string', 'number', 'boolean'].includes(typeof result) && result != null && !Array.isArray(result) && !_.isPlainObject(result))
            {
                throw new Error(`Method: ${json.method} returned an invalid value. Expected [String|Number|Boolean|Null|Undefined|Array|Object].`);
            }

            else if(_.get(schema, 'properties.returns') && !ajv.validate(schema, {returns: result}))
            {
                throw new Error(`Method: ${json.method} returned an invalid value.`);
            }
        }

        const errorResponse = (error) =>
        {
            return {
                jayson: this.VERSION,
                error:
                {
                    code: this.errors.INTERNAL_ERROR,
                    message: `Internal error. ${error.message}`,
                    data:
                    {
                        columnNumber: process.env.NODE_ENV === 'production' ?  undefined : error.columnNumber,
                        description: process.env.NODE_ENV === 'production' ?  undefined : error.description,
                        fileName: process.env.NODE_ENV === 'production' ?  undefined : error.fileName,
                        lineNumber: process.env.NODE_ENV === 'production' ?  undefined : error.lineNumber,
                        message: error.message,
                        name: error.name,
                        number: error.number,
                        stack: process.env.NODE_ENV === 'production' ?  undefined : error.stack
                    }
                },
                id
            };
        }

        const createTimer = (timeout) =>
        {
            return setTimeout(() =>
            {
                return resolve(
                {
                    jayson: this.VERSION,
                    error:
                    {
                        code: this.errors.TIMEOUT,
                        message: `Request failed to complete in ${timeout}ms.`,
                    },
                    id
                }); 
            }, timeout)
        }
        
        if(json.jayson !== this.VERSION)
        {
            this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Invalid request`);

            return {
                jayson: this.VERSION,
                error:
                {
                    code: this.errors.INVALID_REQUEST,
                    message: 'Invalid or missing "jayson" property.',
                    data:
                    {
                        expected: {jayson: this.VERSION}
                    }
                },
                id
            };
        }

        else if(json.discover)
        {
            return this.discover(id);
        }

        else if(!json.method || typeof json.method !== 'string')
        {
            this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Invalid request`);

            return {
                jayson: this.VERSION,
                error:
                {
                    code: this.errors.INVALID_REQUEST,
                    message: 'Invalid or missing "method" property.'
                },
                id
            };
        }

        const method = _.get(this.methods, json.method);
        
        if(typeof method !== 'function')
        {
            this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Method not found`);

            return {
                jayson: this.VERSION,
                error:
                {
                    code: this.errors.METHOD_NOT_FOUND,
                    message: `Method not found: ${json.method}`
                },
                id
            };
        }

        const context = {};
        context.headers = headers;

        this.logger.log('info', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Call method: ${method.name}`);

        if(_.isPlainObject(method.schema))
        {
            schema =
            {
                type: 'object',
                properties: {}
            }

            if(this.config.definitions)
            {
                schema.definitions = this.config.definitions
            }

            for(const key in method.schema)
            {
                schema.properties[key] = method.schema[key];
            }

            if(method.timeout)
            {
                schema.properties.timeout = method.timeout;
            }

            if(schema.requires)
            {
                try
                {
                    context.auth = jwt.verify(json.auth, this.config.jwt.secret, this.config.jwt.options);

                    if(!ajv.validate(schema, {requires: context.auth}))
                    {
                        throw new Error(`Authorization context doesn't validate against method requirement.`);
                    }
                }

                catch(error)
                {
                    return {
                        jayson: this.VERSION,
                        error:
                        {
                            code: this.errors.UNAUTHORIZED,
                            message: error.message
                        },
                        id
                    };
                }
            }

            if(!ajv.validate(schema, {params: json.params}))
            {
                this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Invalid params`);
            
                return {
                    jayson: this.VERSION,
                    error:
                    {
                        code: this.errors.INVALID_PARAMS,
                        message: `Supplied parameters do not match schema for method: ${json.method}`,
                        data:
                        {
                            expected: method.schema.params
                        }
                    },
                    id
                };
            }
        }

        if(!json.params)
        {
            return new Promise(async (resolve, reject) =>
            {
                const timeout = method.timeout || this.config.timeout;
                let timerID;

                if(timeout)
                {
                    timerID = createTimer(timeout);
                }

                try
                {
                    result = method(context);
                    
                    if(result instanceof Promise)
                    {
                        result = await result;
                    }

                    errorCheck();
                }

                catch(error)
                {
                    this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Internal error`);
                    return resolve(errorResponse(error));
                }

                clearTimeout(timerID);
                return resolve(
                {
                    jayson: this.VERSION,
                    result,
                    id
                }); 
            });
        }

        else if(_.isPlainObject(json.params))
        {
            return new Promise(async (resolve, reject) =>
            {
                const timeout = method.timeout || this.config.timeout;
                let timerID;

                if(timeout)
                {
                    timerID = createTimer(timeout);
                }

                try
                {
                    result = method(Object.assign(json.params, {context: context}));
                    
                    if(result instanceof Promise)
                    {
                        result = await result;
                    }

                    errorCheck();
                }

                catch(error)
                {
                    this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Internal error`);
                    return resolve(errorResponse(error));
                }

                clearTimeout(timerID);
                return resolve(
                {
                    jayson: this.VERSION,
                    result,
                    id
                });
            });
        }

        else
        {
            const params = json.params.slice();
            const args = fnArgs(method);
            const hasRestParams = !!args.filter((arg) => arg.startsWith('...')).length;

            if(args.length !== params.length && !hasRestParams)
            {
                this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Invalid params`);

                return {
                    jayson: this.VERSION,
                    error:
                    {
                        code: this.errors.INVALID_PARAMS,
                        message: `Supplied parameters do not match signature for method: ${json.method}`,
                        data:
                        {
                            expected: args
                        }
                    },
                    id
                };
            }

            return new Promise(async (resolve, reject) =>
            {
                const timeout = method.timeout || this.config.timeout;
                let timerID;

                if(timeout)
                {
                    timerID = createTimer(timeout);
                }

                try
                {
                    params.unshift(context);
                    result = method(...params);
                    
                    if(result instanceof Promise)
                    {
                        result = await result;
                    }

                    errorCheck();
                }

                catch(error)
                {
                    this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Internal error`);
                    return resolve(errorResponse(error));
                }

                return resolve(
                {
                    jayson: this.VERSION,
                    result,
                    id
                });
            });
        }
    }

    handleError({error, headers})
    {
        this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Error: ${error.message}`);
    }

    handleClose({code, headers})
    {
        this.logger.log('debug', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Connection closed (${code})`);
    }

    async handleMessage({message, ws, headers})
    {
        const oversizedMessage = (id) =>
        {
            return {
                jayson: this.VERSION,
                error:
                {
                    code: this.errors.OVERSIZED_RESPONSE,
                    message: `Response body exceeds jsonLimit (${this.jsonLimit}).`
                },
                id
            }
        }

        let json = message;

        if(ws)
        {
            try
            {
                if(this.config.jsonLimit && message.length > bytes.parse(this.config.jsonLimit))
                {
                    throw new Error(`JSON request body exceeds maximum size of ${this.config.jsonLimit}.`);
                }

                json = JSON.parse(message);
            }

            catch(error)
            {
                this.logger.log('error', `${headers['x-forwarded-for']} - - [${format(new Date(), 'DD/MMM/YYYY HH:mm:ss ZZ')}] Parse error`);

                return ws.send(JSON.stringify(
                {
                    jayson: this.VERSION,
                    error:
                    {
                        code: this.errors.PARSE_ERROR,
                        message: `Unable to parse JSON. ${error.message}`,
                        data:
                        {
                            stack: process.env.NODE_ENV === 'production' ?  undefined : error.stack
                        }
                    },
                    id: null
                }));
            }
        }

        if(!Array.isArray(json))
        {
            const response = await this.handleCall({json, headers});
            const body = JSON.stringify(response);
            const isOversized = this.config.jsonLimit && body.length > bytes.parse(this.config.jsonLimit);

            if(ws && response.id !== undefined)
            {
                if(isOversized)
                {
                    ws.send(JSON.stringify(oversizedMessage(response.id)));
                }

                else
                {
                    ws.send(body);
                }
            }

            if(isOversized)
            {
                return oversizedMessage(response.id);
            }
            
            else
            {
                return response;
            }
        }

        else
        {
            const items = _.map(json, (item) => this.handleCall({json: item, headers}));
            let batch = await Promise.all(items);
            batch = _.filter(batch, (response) => response.id !== undefined);
            const body = JSON.stringify(batch);
            const isOversized = this.config.jsonLimit && body.length > bytes.parse(this.config.jsonLimit);
            
            if(ws && batch.length)
            {
                if(isOversized)
                {
                    ws.send(JSON.stringify(oversizedMessage()));
                }

                else
                {
                    ws.send(body);
                }
            }

            if(isOversized)
            {
                return oversizedMessage();
            }

            else
            {
                return batch;
            }
        }
    }
}

module.exports = Server;