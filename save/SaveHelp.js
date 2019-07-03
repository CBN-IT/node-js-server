const Servlet = require('./../utils/Servlet');
const SaveForm = require('./../utils/SaveForm');
const SendGrid = require('./../mail/SendGridMail.js');
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
        this.sendHelpMail();
        this.sendAsJson(response);
    }

    sendHelpMail(){
        let html = `
            <div>Proiect: ${process.env.GOOGLE_CLOUD_PROJECT}</div>
            <div>Firma: ${this.req.param._firmId}</div>
            <div>User: ${this.getAccount()['emailCont']}</div>
        `;
        SendGrid.sendHtmlMail(['octavianvoloaca@gmail.com', 'bogdan.noureescu@cbn-it.ro'], 'office@cbn-it.ro', `Solicitare ajutor - ${this.req.param._firmId}`, html);
    }

}
module.exports = SaveHelp;