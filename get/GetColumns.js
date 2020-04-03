const GetConfigs = require('../utils/GetConfigs');

class GetColumns extends GetConfigs {

    static get url(){
        return '/GetColumns';
    }

    async execute(){
        let collection = 'column';
        let _companyId = this.req.param['_companyId'];
        let columns = await this._getForms('server/columns', collection, _companyId, false);
        if (this.req.param._id) {
            this.sendAsJson(columns[this.req.param._id]);
        } else {
            this.sendAsJson(Object.values(columns));
        }
    }
}

module.exports = GetColumns;

