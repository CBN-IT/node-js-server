const Servlet = require('./../utils/Servlet.js');
const GetConfigs = require('../utils/GetConfigs');

class GetForms extends GetConfigs {

    static get url(){
        return '/GetForms';
    }

    async execute() {
        let collection = 'form';
        let _companyId = this.req.param['_companyId'];
        let forms = await this._getForms('server/configs', collection, _companyId, false);
        if (this.req.param._id) {
            this.sendAsJson(forms[this.req.param._id]);
        } else {
            this.sendAsJson(Object.values(forms));
        }
    }
}

module.exports = GetForms;

