const Servlet = require('./../utils/Servlet.js');
const GetConfigs = require('./GetConfigs');

class GetForms extends GetConfigs {

    static get url(){
        return '/GetForms';
    }

    async execute(){
        let collection = 'form';
        let _companyId = this.req.param['_companyId'];
        let columns = await this._getForms('server/configs', collection, _companyId, false);
        this.sendAsJson(Object.values(columns));
    }
}

module.exports = GetForms;

