const {TimeoutError} =require("./errors");

const timeout = (nrSec) => {
    return new Promise(function (resolve, reject) {
        setTimeout(reject, nrSec * 1000, new TimeoutError('TIMEOUT ' + nrSec + "s"));
    });
};
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return undefined;
            }
            seen.add(value);
        }
        return value;
    };
};
const redirectToHttps = (req, res, next) => {
    let url = new URL(req.protocol+"://"+req.headers.host);
    if (req.protocol !== 'http' ||
        (req.headers.host.indexOf('localhost') > -1 ||
            url.hostname.split(".").length >= 4)) {
        /*appengine subdomain doesnt allow https on second level subdomain*/
        // request was via https, so do no special handling
        next();
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + req.headers.host + req.url);
    }
};
function unflat(obj){
    let entry = Object.entries(obj);
    for(let [key,value] of entry){
        if(key.includes(".")){
            let keys = key.split(/[.]+/g);
            let o = obj;
            for (let i = 1; i < keys.length; i++) {
                if (keys[i].match(/[0-9]+/g)) {
                    if (o[keys[i-1]] === undefined) {
                        o[keys[i-1]] = [];
                    }
                    o = o[keys[i-1]];
                }else{
                    if (o[keys[i-1]] === undefined) {
                        o[keys[i-1]] = {};
                    }
                    o = o[keys[i-1]];
                }
            }
            o[keys[keys.length-1]] = value;
        }
    }
    return obj;
}

const requestParam = (req, res, next) => {
    unflat(req.body);
    unflat(req.query);
    unflat(req.params);

    req.param = new Proxy(req, {
        get(target, name) {
            if (target.body[name] !== undefined) {
                return target.body[name]
            }
            if (target.query[name] !== undefined) {
                return target.query[name]
            }
            if (target.params[name] !== undefined) {
                return target.params[name]
            }
            return undefined;
        },
        set(target, name,value) {
            if (target.body[name] !== undefined) {
                target.body[name] = value;
            } else if (target.query[name] !== undefined) {
                target.query[name]= value;
            } else if (target.params[name] !== undefined) {
                target.params[name]= value;
            } else {
                target.body[name] = value;
            }
            return true;
        },
        has(target, name){
            return target.body[name] !== undefined || target.query[name] !== undefined || target.params[name] !== undefined;
        },
        getOwnPropertyDescriptor(target, name) {
            return {
                enumerable: true,
                configurable: true,
            };
        },
        ownKeys(target){
            return [
                ...Object.keys(target.params),
                ...Object.keys(target.query),
                ...Object.keys(target.body)
            ]
        },
    });
    next();
};

const _INDENT     = '    ';
const _WHITESPACE = new Array(512).fill(' ').join('');

const _format_date = function(n) {
    return n < 10 ? '0' + n : '' + n;
};

const _stringify = function(data, indent) {

    indent = typeof indent === 'string' ? indent : '';


    let str = '';

    if (
        typeof data === 'boolean'
        || data === null
        || data === undefined
        || (
            typeof data === 'number'
            && (
                data === Infinity
                || data === -Infinity
                || isNaN(data) === true
            )
        )
    ) {

        if (data === null) {
            str = indent + 'null';
        } else if (data === undefined) {
            str = indent + 'undefined';
        } else if (data === false) {
            str = indent + 'false';
        } else if (data === true) {
            str = indent + 'true';
        } else if (data === Infinity) {
            str = indent + 'Infinity';
        } else if (data === -Infinity) {
            str = indent + '-Infinity';
        } else if (isNaN(data) === true) {
            str = indent + 'NaN';
        }

    } else if (typeof data === 'number') {

        str = indent + data.toString();

    } else if (typeof data === 'string') {

        str = indent + JSON.stringify(data);

    } else if (typeof data === 'function') {

        let body   = data.toString().split('\n');
        let offset = 0;

        let first = body.find(function(ch) {
            return ch.startsWith('\t');
        }) || null;

        if (first !== null) {

            let check = /(^\t+)/g.exec(first);
            if (check !== null) {
                offset = Math.max(0, check[0].length - indent.length);
            }

        }


        for (let b = 0, bl = body.length; b < bl; b++) {

            let line = body[b];
            if (line.startsWith('\t')) {
                str += indent + line.substr(offset);
            } else {
                str += indent + line;
            }

            str += '\n';

        }

    } else if (data instanceof Array) {
        //str += JSON.stringify(data);

        let is_primitive = data.find(function(val) {
            return val instanceof Object || typeof val === 'function';
        }) === undefined;

        let dimension = Math.sqrt(data.length, 2);
        let is_matrix = dimension === (dimension | 0);

        if (data.length === 0) {

            str = indent + '[]';

        } else if (is_primitive === true && is_matrix === true) {

            let max = 0;

            for (let d = 0, dl = data.length; d < dl; d++) {
                max = Math.max(max, (data[d]).toString().length);
            }


            str  = indent;
            str += '[\n';

            for (let y = 0; y < dimension; y++) {

                str += '\t' + indent;

                for (let x = 0; x < dimension; x++) {

                    let tmp = _stringify(data[x + y * dimension]);
                    if (tmp.length < max) {
                        str += _WHITESPACE.substr(0, max - tmp.length);
                    }

                    str += tmp;

                    if (x < dimension - 1) {
                        str += ', ';
                    }

                }

                if (y < dimension - 1) {
                    str += ',';
                }

                str += '\n';

            }

            str += indent + ']';

        } else if (is_primitive === true) {

            str  = indent;
            str += '[';

            for (let d = 0, dl = data.length; d < dl; d++) {

                if (d === 0) {
                    str += ' ';
                }

                str += _stringify(data[d]);

                if (d < dl - 1) {
                    str += ', ';
                } else {
                    str += ' ';
                }

            }

            str += ']';

        } else {

            str  = indent;
            str += '[\n';

            for (let d = 0, dl = data.length; d < dl; d++) {

                str += _stringify(data[d], '\t' + indent);

                if (d < dl - 1) {
                    str += ',';
                }

                str += '\n';

            }

            str += indent + ']';

        }

    } else if (data instanceof Date) {

        str  = indent;

        str += '"';
        str += data.getUTCFullYear()                + '-';
        str += _format_date(data.getUTCMonth() + 1) + '-';
        str += _format_date(data.getUTCDate())      + 'T';
        str += _format_date(data.getUTCHours())     + ':';
        str += _format_date(data.getUTCMinutes())   + ':';
        str += _format_date(data.getUTCSeconds())   + 'Z';
        str += '"';

    } else if (data instanceof Object) {

        let keys = Object.keys(data);
        if (keys.length === 0) {

            str = indent + '{}';

        } else {

            str  = indent;
            str += '{\n';

            for (let k = 0, kl = keys.length; k < kl; k++) {

                let key = keys[k];

                str += '\t' + indent + '"' + key + '": ';
                str += _stringify(data[key], '\t' + indent).trim();

                if (k < kl - 1) {
                    str += ',';
                }

                str += '\n';

            }

            str += indent + '}';

        }

    }


    return str;

};

module.exports = {timeout, getCircularReplacer, requestParam, _stringify, redirectToHttps};