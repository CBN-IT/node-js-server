const SaveForm = require('./../utils/SaveForm.js');

class SaveAccount extends SaveForm {

    static url = '/SaveAccount';
    get requiredUserType(){
        return ["Admin"];
    }
    get requiredLogin(){
        return true;
    }
    async execute(){
        let _companyId = this.req.param['_companyId'];
        this.req.param['_companyId'] = 'default';
        let newData = await this.getUpdatedData();
        newData._companyId = _companyId;
        let company = await this.db.collection('company').doc(_companyId).get();
        newData._companyName = company.data().companyName;
        await this.save(newData);
        return newData;
    }

}
module.exports = SaveAccount;