const Servlet = require('./../utils/Servlet.js');
const SaveForm = require('./../utils/SaveForm.js');
class SaveAccount extends Servlet {

    static get url(){
        return '/SaveAccount';
    }

    async execute(){
        let _companyId = this.req.param['_companyId'];
        this.req.param['_companyId'] = 'default';
        let saveForm = new SaveForm(this);
        let newData = await saveForm.getUpdatedData();
        newData._companyId = _companyId;
        let company = await this.db.collection('company').doc(_companyId).get();
        newData._companyName = company.data().companyName;
        await saveForm.save(newData);
        this.sendAsJson({message: 'Saved Account'});

    }
}
module.exports = SaveAccount;