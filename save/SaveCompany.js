const SaveForm = require('./../utils/SaveForm.js');

class SaveCompany extends SaveForm {

    static get url(){
        return '/SaveCompany';
    }

    async execute(){
        this.req.param['_companyId'] = 'default';
        this.req.param['collection'] = 'company';
        let oldCompany = this.getDocument('', 'company', this.req.param._id);
        let newCompany = await this.save();
        await this.updateAccounts(oldCompany, newCompany);
        this.sendAsJson({message: 'Saved Company'});

    }

    async updateAccounts(oldCompany, newCompany){
        let promises = [];
        if(oldCompany && oldCompany.blockedAccessCompany !== newCompany.blockedAccessCompany){
            let accounts = await this.runQuery('', 'account', [['_companyId', '==', this._companyId]]);
            promises = accounts.map(account => this.updateDocument('', 'account', account._id, {blockedAccessCompany: newCompany.blockedAccessCompany}, true));
        }
        return Promise.all(promises);
    }

}
module.exports = SaveCompany;