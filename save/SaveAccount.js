const SaveForm = require('./../utils/SaveForm.js');

class SaveAccount extends SaveForm {

    static get url(){
        return '/SaveAccount';
    }
    get requiredUserType(){
        return ["Admin"];
    }
    get requiredLogin(){
        return true;
    }
    async execute(){

        let _companyId = this.req.param['_companyId'];
        this.logger.d(_companyId);
        this.req.param['_companyId'] = 'default';
        let newData = await this.getUpdatedData();
        newData._companyId = _companyId;
        let company = await this.db.collection('company').doc(_companyId).get();
        this.logger.d(company);
        newData._companyName = company.data().companyName;
        await this.save(newData);
        this.sendAsJson({message: 'Saved Account'});

    }

}
module.exports = SaveAccount;