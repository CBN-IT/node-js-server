const SaveForm = require('./../utils/SaveForm.js');

class SaveCompany extends SaveForm {

    static url = '/SaveCompany';

    async execute() {
        this.req.param['_companyId'] = 'default';
        this.req.param['collection'] = 'company';
        let oldCompany = this.getDocument('', 'company', this.req.param._id);
        let newCompany = await this.save();
        await this.updateAccounts(oldCompany, newCompany);
        return newCompany;

    }

    async updateAccounts(oldCompany, newCompany) {
        let promises = [];
        if (oldCompany &&
            (oldCompany.blockedAccessCompany !== newCompany.blockedAccessCompany ||
                oldCompany.blockedAccessCompanyDate !== newCompany.blockedAccessCompanyDate)
        ) {
            let accounts = await this.runQuery('', 'account', [['_companyId', '==', newCompany._id]]);
            promises = accounts.map(account => this.updateDocument('', 'account', account._id, {
                blockedAccessCompany: newCompany.blockedAccessCompany,
                blockedAccessCompanyDate: newCompany.blockedAccessCompanyDate
            }, true));
        }
        return Promise.all(promises);
    }

}

module.exports = SaveCompany;