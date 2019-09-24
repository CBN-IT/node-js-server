const Servlet = require('./../utils/Servlet.js');
const fs = require("fs");

class GetForms extends Servlet {

    static get url(){
        return '/GetForms';
    }

    async execute(){
        let collection = 'form';
        let _companyId = this.req.param['_companyId'];
        let forms = await this._getForms('server/configs', collection, _companyId, false);
        this.sendAsJson(Object.values(forms));
    }

    async _getForms(folderName, collection, _companyId, justJSON){
        let formsFromFile = this._getConfigs(folderName);
        let snapshotDefault = await this.db.collection(collection).where('_deleted', '==', null).get();
        let formsDefault = this.processDocuments(snapshotDefault);
        let forms = [];

        if(_companyId !== 'default'){
            let snapshot = await this.db.collection(`company/${_companyId}/${collection}`).where('_deleted', '==', null).get();
            forms = this.processDocuments(snapshot);
        }

        return this._mergeForms(formsFromFile, formsDefault, forms, justJSON);
    }

    _getConfigs(folderName){
        let configs = {};
        let folderPath = global.projectRoot+`${folderName}`;
        fs.readdirSync(folderPath).forEach(file => {
            configs[file.split('.')[0]] = new Function("return " + fs.readFileSync(`${folderPath}/${file}`, 'utf8'))();
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
            formsFromFile[form.collection] = justJSON ? form.code : form;
        });
        forms.forEach(form => {
            formsFromFile[form.collection] = justJSON ? form.code : form;
        });

        return formsFromFile;
    }
}

module.exports = GetForms;

