const Errors = require('./Errors');

if(typeof Promise !== 'function')
{
    Promise = require('promise-polyfill');
}

if(typeof fetch !== 'function')
{
    fetch = require('fetch-ponyfill')().fetch;
}

if(typeof WebSocket !== 'function')
{
    WebSocket = require('ws');
}

class Client
{
    constructor(config)
    {
        config.retryDelay = config.retryDelay || 3000;
        config.timeout = config.timeout !== undefined ? config.timeout : 60000;
        config.url = config.url || 'http://127.0.0.1:3000';
        this.config = config;
        
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
        this.id = 0;
        this.requests = [];
    }

    get errors()
    {
        return Errors;
    }

    get readyState()
    {
        return {
            CONNECTING: 0,
            OPEN: 1,
            CLOSING: 2,
            CLOSED: 3
        };
    }

    connect(callback)
    {
        callback = typeof callback === 'function' ? callback : () => {};
        let resolved = false;

        return new Promise((resolve, reject) =>
        {
            const messageFn = (event) => this.handleMessage(event);
            
            const openFn = (event) =>
            {
                this.ws.off('open', openFn);
                this.logger.log('info', `Connection established.`);
                resolved = true;
                callback(null, this);
                return resolve(this);
            };

            const closeFn = (event) =>
            {
                this.ws.off('close', closeFn);
                this.ws.off('error', errorFn);
                this.ws.off('message', messageFn);
                this.handleClose(event);

                if(!resolved)
                {
                    resolved = true;
                    const error = new Error(`Connection closed.`);
                    callback(error)
                    return reject(error);
                }
            };

            const errorFn = (event) =>
            {
                this.ws.off('error', errorFn);
                this.handleError(event);
                
                if(!resolved)
                {
                    resolved = true;
                    const error = new Error(`Connection error.`);
                    callback(error)
                    return reject(error);
                }
            };

            if(!/^wss?:\/\//.test(this.config.url) || (this.ws && this.ws.readyState === this.readyState.OPEN))
            {
                resolved = true;
                callback(null, this);
                return resolve(this);
            }

            else if(!this.ws || this.ws.readyState !== this.readyState.CONNECTING)
            {
                this.reconnect = true;
                this.ws = new WebSocket(this.config.url);

                if(!this.ws.on)
                {
                    this.ws.on = this.ws.addEventListener;
                }

                if(!this.ws.off)
                {
                    this.ws.off = this.ws.removeEventListener;   
                }

                this.ws.on('close', closeFn);
                this.ws.on('error', errorFn);
                this.ws.on('open', openFn);
                this.ws.on('message', messageFn);
            }
        });
    }

    findRequest(id)
    {
        for(let i=this.requests.length-1; i >= 0; i--)
        {
            if(this.requests[i].id === id)
            {
                return this.requests.splice(i, 1)[0];
            }
        }
    }

    timeoutRequest(id)
    {
        const response =
        {
            jayson: this.VERSION,
            error:
            {
                code: this.errors.TIMEOUT,
                message: `Request failed to complete in ${this.config.timeout}ms.`,
            },
            id
        };

        if(id === undefined)
        {
            for(const request of this.requests)
            {
                request.callback(response);
            }

            this.requests = [];
            return;
        }

        const request = this.findRequest(id);

        if(request)
        {
            request.callback(response);
        }
    }

    queueRequest({callback, timeout})
    {
        this.requests.push(
        {
            id: this.id,
            timer: setTimeout(this.timeoutRequest.bind(this, this.id), timeout || this.config.timeout),
            callback
        });

        return this.id++;
    }

    handleClose(event)
    {
        if(this.reconnect)
        {
            this.logger.log('info', `Connection closed.`);
            this.logger.log('info', `Retrying to connect in ${this.config.retryDelay/1000} seconds.`);
            setTimeout(this.connect.bind(this), this.config.retryDelay);
            this.timeoutRequest();
            this.reconnect = false;
        }
    }

    handleError(event)
    {
        this.logger.log('error', `Connection error.`);
    }

    handleMessage(event)
    {
        const message = typeof MessageEvent != 'undefined' ? event.data : event;
        let json;

        try
        {
            json = JSON.parse(message);
        }

        catch(error)
        {
            this.logger.log('error', `Parse error`);
        }

        json = Array.isArray(json) ? json : [json];
        json.forEach((response) =>
        {
            const request = this.findRequest(response.id);

            if(request)
            {
                clearTimeout(request.timer);
                request.callback(response);
            }
        });
    }

    async discover(callback)
    {
        callback = typeof callback === 'function' ? callback : () => {};
        const response = await this.call(
        {
            discover: true
        });

        callback(response.error, response.result);
        return response.result;
    }

    call(args)
    {
        const wrap = (tasks, isArray) =>
        {
            return new Promise(async (resolve, reject) =>
            {
                const results = await Promise.all(tasks);
                return resolve(isArray ? results : results[0]);
            });
        };

        const isArray = Array.isArray(args);
        args = isArray ? args : [args];
        const tasks = args.map((call) =>
        {
            return new Promise(async (resolve, reject) =>
            {
                call.callback = typeof call.callback === 'function' ? call.callback : () => {};
                const body = {};
                body.jayson = this.VERSION;
                body.params = body.params || [];
                
                for(const key in call)
                {
                    if(['notification', 'callback'].indexOf(key) === -1)
                    {
                        body[key] = call[key];
                    }
                }

                if(/^https?:\/\//.test(this.config.url))
                {
                    if(!call.notification)
                    {
                        body.id = this.id++;
                    }

                    const response = await fetch(this.config.url,
                    {
                        method: 'POST',
                        headers:
                        {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    });

                    try
                    {
                        const json = await response.json();

                        if(call.notification)
                        {
                            call.callback();
                            return resolve({jayson: this.VERSION});   
                        }

                        call.callback(json.error, json.result);
                        return resolve(json);
                    }

                    catch(error)
                    {
                        error.description = error.message;
                        error.message = `Could not connect to HTTP server (${this.config.url}) or invalid JSON response.`;
                        call.callback(error);
                        return reject(error);
                    }
                }

                else
                {
                    if(!call.notification)
                    {
                        body.id = this.queueRequest(
                        {
                            callback: (response) =>
                            {
                                if(response.error)
                                {
                                    const error = new Error(response.error.message);

                                    for(const key in response.error)
                                    {
                                        error[key] = response.error[key];
                                    }

                                    call.callback(error);
                                }

                                else if(response.result)
                                {
                                    call.callback(null, response.result);
                                }

                                else
                                {
                                    call.callback();
                                }
    
                                return resolve(response);
                            },
                            timeout: args.timeout
                        })
                    }

                    this.ws.send(JSON.stringify(body));

                    if(call.notification)
                    {
                        call.callback();
                        return resolve();
                    }
                }
            });
        });

        return wrap(tasks, isArray);
    }
}

module.exports = Client;