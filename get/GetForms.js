const Servlet = require('./../utils/Servlet.js');
const path = require('path');
const fs = require("fs");
const {_stringify} = require('./../utils/Utils.js');
class GetForms extends Servlet {

    static get url(){
        return '/GetForms';
    }

    async execute(){
        let collection = 'form';
        let _firmId = this.req.param['_firmId'];
        let forms = await this._getForms('server/configs', collection, _firmId, false);
        this.sendAsJson(Object.values(forms));
    }

    async _getForms(folderName, collection, _firmId, justJSON){
        let formsFromFile = this._getConfigs(folderName);
        let snapshotDefault = await this.db.collection(collection).where('_deleted', '==', null).get();
        let formsDefault = this.processDocuments(snapshotDefault);
        let forms = [];

        if(_firmId !== 'default'){
            let snapshot = await this.db.collection(`firm/${_firmId}/${collection}`).where('_deleted', '==', null).get();
            forms = this.processDocuments(snapshot);
        }

        return this._mergeForms(formsFromFile, formsDefault, forms, justJSON);
    }

    _getConfigs(folderName){
        let configs = {};
        let folderPath = `../../../${folderName}`;
        fs.readdirSync(path.join(__dirname, folderPath)).forEach(file => {
            configs[file.split('.')[0]] = new Function("return " + fs.readFileSync(path.join(__dirname, `./${folderPath}/${file}`), 'utf8'))();
        });
        return configs;
    }

    _mergeForms(formsFromFile, formsDefault, forms, justJSON){
        Object.keys(formsFromFile).forEach(key => {
            formsFromFile[key] = justJSON ?
                formsFromFile[key] :
                {
                    code: formsFromFile[key],
                    collection: key
                }

        });


        formsDefault.forEach(form => {
            form.code = justJSON ? JSON.parse(form.code) : form.code;
            formsFromFile[form.collection] = justJSON ? form.code : form;
        });
        forms.forEach(form => {
            form.code = justJSON ? JSON.parse(form.code) : form.code;
            formsFromFile[form.collection] = justJSON ? form.code : form;
        });

        return formsFromFile;
    }
}

module.exports = GetForms;

