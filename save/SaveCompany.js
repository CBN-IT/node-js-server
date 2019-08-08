const Servlet = require('./../utils/Servlet');
class SaveCompany extends Servlet {

    static get url(){
        return '/SaveCompany';
    }

    async execute(){
        this.req.param['_companyId'] = 'default';
        await this.save();
        /*this.sendAsJson({message: 'Execute method implemented'})

        let firmName = this.req.param['firmName'];
        let document = await this.db.collection('firm').doc(firmName).set({
            firmName: firmName,
            _deleted: null
        });*/
        this.sendAsJson({message: 'Saved Company'});

    }
}
module.exports = SaveCompany;