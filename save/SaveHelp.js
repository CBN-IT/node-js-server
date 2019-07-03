const Servlet = require('./../utils/Servlet');
const SaveForm = require('./../utils/SaveForm');
const moment = require("moment");
class SaveHelp extends Servlet {

    static get url(){
        return '/SaveHelp';
    }

    get requiredLogin(){
        return false;
    }

    async execute(){
        let saveForm = new SaveForm(this);
        let newData = {date: moment().format("YYYY-MM-DD"), ...await saveForm.getUpdatedData()};
        let response = await saveForm._updateDocument(this.req.param._firmId, this.req.param.collection, this.req.param._id, newData, false);
        this.sendAsJson(response);
    }

}
module.exports = SaveHelp;