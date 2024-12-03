function unflat(obj) {
    let entry = Object.entries(obj);
    for (let [key, value] of entry) {
        if (key.includes(".")) {
            let keys = key.split(/[.]+/g);
            let o = obj;
            for (let i = 1; i < keys.length; i++) {
                if (keys[i].match(/[0-9]+/g)) {
                    if (o[keys[i - 1]] === undefined) {
                        o[keys[i - 1]] = [];
                    }
                    o = o[keys[i - 1]];
                } else {
                    if (o[keys[i - 1]] === undefined) {
                        o[keys[i - 1]] = {};
                    }
                    o = o[keys[i - 1]];
                }
            }
            o[keys[keys.length - 1]] = value;
        }
    }
    return obj;
}

module.exports = {unflat};