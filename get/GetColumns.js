const Servlet = require('./../utils/Servlet.js');
const GetConfigs = require('./GetConfigs');

class GetColumns extends GetConfigs {

    static get url(){
        return '/GetColumns';
    }

    async execute(){
        let collection = 'column';
        let _companyId = this.req.param['_companyId'];
        let columns = await this._getForms('server/columns', collection, _companyId, false);
        this.sendAsJson(Object.values(columns));
    }
}

module.exports = GetColumns;

