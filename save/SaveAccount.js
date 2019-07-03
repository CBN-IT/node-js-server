const Servlet = require('./../utils/Servlet.js');
const SaveForm = require('./SaveForm.js');
class SaveAccount extends Servlet {

    static get url(){
        return '/SaveAccount';
    }

    async execute(){
        let _firmId = this.req.param['_firmId'];
        this.req.param['_firmId'] = 'default';
        let saveForm = new SaveForm(this);
        let newData = await saveForm.getUpdatedData();
        newData._firmId = _firmId;
        let firm = await this.db.collection('firm').doc(_firmId).get();
        newData._firmName = firm.data().firmName;
        await saveForm.save(newData);
        this.sendAsJson({message: 'Saved Firm'});

    }
}
module.exports = SaveAccount;