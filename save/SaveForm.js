const GetConfigs = require('../utils/GetConfigs');
const {ValidationError} = require("../utils/errors");

class SaveForm extends GetConfigs {

    static url = '/SaveForm';

    async execute(){
        let collection = 'form';
        let _id = this.req.param['_id'];
        let _companyId = this.req.param['_companyId'];

        //test if the new data has changed. If it didn't change, don't save it
        let columns = await this._getForms('server/configs', collection, _companyId, false);
        let oldCode = JSON.stringify(columns[_id].code);//getForms return the code as an object
        let code = JSON.stringify(JSON.parse(this.req.param['code']));//to remove whitespace
        if (code === oldCode) {
            throw new ValidationError("Setarile formularului nu au fost modificate.")
        }


        let newData = {
            'collection': this.req.param['collection'],
            'code': code,
            '_deleted': null
        };
        return await this.updateDocument(_companyId, collection, _id, newData);
    }

}
module.exports = SaveForm;