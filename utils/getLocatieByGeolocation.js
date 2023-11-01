const {fetch} = require("./fetch.js");

async function processRO(tari, locSuperior, locInferior, judete, judetePrescurtare) {
    let localitatiToFetch = [];
    for (let tara of tari) {
        for (let locSup of locSuperior) {
            for (let locInf of locInferior) {
                let j = new Set([...judete, ...judetePrescurtare]);
                for (let judet of Array.from(j)) {
                    localitatiToFetch.push({
                        tara: tara,
                        nume_judet: judet,
                        nume_superior: locSup,
                        nume_localitate: locInf
                    })
                }
            }
        }
    }

    let localitati = (await Promise.all(Object.values(localitatiToFetch).map(async ({nume_localitate, nume_judet, nume_superior}) => {
        const myURL = new URL('https://siruta-v2-dot-cbn-adresa.appspot.com/searchAddress');
        myURL.searchParams.append('query', nume_localitate);
        myURL.searchParams.append('ancestor', `${nume_superior} ${nume_judet}`);
        myURL.searchParams.append('onlyOwnNames', '2');
        return JSON.parse(await fetch(myURL))
    }))).flat();

    localitati = localitati.map(value => {
        if (value.rank === 1) {
            console.log(value);
            return {
                nume_localitate: "",
                nume_superior: value.name,
                nume_judet: value.ancestors[0].name,
                prescurtare_judet: value.ancestors[0].metaData.shortCountyName,
                siruta: value.id,
                ancestor: value.ancestors[0] ? value.ancestors[0].id : "",
            }
        } else if (value.rank === 2) {
            return {
                nume_localitate: value.name,
                nume_superior: value.ancestors[0].name,
                nume_judet: value.ancestors[1] ? value.ancestors[1].name : "",
                prescurtare_judet: value.ancestors[1] ? value.ancestors[1].metaData.shortCountyName : "",
                siruta: value.id,
                ancestor: value.ancestors[1] ? value.ancestors[1].id : "",
            }
        }else{
            return {
                nume_localitate: "",
                nume_superior: "",
                nume_judet: value.name,
                prescurtare_judet: value.metaData.shortCountyName,
                siruta: value.id,
                ancestor: "",
            }
        }
    });
    localitati = localitati.reduce((obj, loc) => {
        obj[loc.siruta] = loc;
        return obj
    }, {});
    localitati = Object.values(localitati);
    let tara = ""
    let nume_judet = ""
    let nume_superior = ""
    let nume_localitate = ""
    let prescurtare_judet = "";


    if (localitati.length > 0) {
        tara = tari[0];
        nume_judet = localitati[0].nume_judet;
        nume_superior = localitati[0].nume_superior;
        nume_localitate = localitati[0].nume_localitate;
        prescurtare_judet = localitati[0].prescurtare_judet;
    }
    return {tara, nume_judet, nume_superior, nume_localitate, prescurtare_judet};
}

async function getLocalitateByGeolocation(lat, long) {
    let tara = ""
    let nume_judet = ""
    let nume_superior = ""
    let nume_localitate = ""
    let prescurtare_judet = ""
    let generatedLabel = ""

    if (!lat || !long) {
        return {
            tara,
            nume_judet,
            nume_superior,
            nume_localitate,
            prescurtare_judet,
            generatedLabel
        }
    }
    let r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyBUkVpMio7rApKgr9xJHcP1QS_4uz8ifnQ&address=${lat},${long}`);
    let json = JSON.parse(r);
    let results = json.results;
    let tariSet = new Set();
    let judeteSet = new Set();
    let judetePrescurtareSet = new Set();
    let locSuperiorSet = new Set();
    let locSuperiorPrescurtareSet = new Set();
    let locInferiorSet = new Set();
    if (results !== null && results !== undefined) {
        for (let {address_components} of results) {
            for (let {long_name, short_name, types} of address_components) {
                if (types[0] === "country") {
                    tariSet.add(short_name);
                }
                if (types[0] === "administrative_area_level_1") {
                    judetePrescurtareSet.add(short_name);
                    judeteSet.add(long_name);
                }
                if (types[0] === "administrative_area_level_2") {
                    locSuperiorSet.add(long_name.replace(/Orașul/g, "").trim());
                    locSuperiorPrescurtareSet.add(short_name.replace(/Orașul/g, "").trim());
                }
                if (types[0] === "locality") {
                    locInferiorSet.add(long_name);
                    locInferiorSet.add(short_name);
                }
            }
        }
    }
    let tari = Array.from(tariSet);
    let judete = Array.from(judeteSet);
    let locSuperior = Array.from(locSuperiorSet);
    let judetePrescurtare = Array.from(judetePrescurtareSet);
    let locInferior = Array.from(locInferiorSet);
    if (tari[0] === "RO") {
        const __ret = await processRO(tari, locSuperior, locInferior, judete, judetePrescurtare, tara, nume_judet, nume_superior, nume_localitate, prescurtare_judet);
        tara = __ret.tara;
        nume_judet = __ret.nume_judet;
        nume_superior = __ret.nume_superior;
        nume_localitate = __ret.nume_localitate;
        prescurtare_judet = __ret.prescurtare_judet;
    } else {
        tara = tari[0] || "";
        nume_judet = judete[0] || "";
        nume_superior = locSuperior[0] || "";
        nume_localitate = locInferior[0] || "";
        prescurtare_judet = judetePrescurtare[0] || "";
    }
    return {
        tara,
        nume_judet,
        nume_superior,
        nume_localitate,
        prescurtare_judet,
        generatedLabel:`${tara} ${prescurtare_judet} ${nume_superior} ${nume_localitate}`.trim()
    }
}


module.exports.getLocalitateByGeolocation = getLocalitateByGeolocation;