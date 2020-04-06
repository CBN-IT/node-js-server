const SaveForm = require('./SaveForm');
const SendGrid = require('../mail/SendGridMail.js');
const moment = require('moment');

/**
 * @abstract
 * @todo
 */
class SaveHelp extends SaveForm {

    static url = '/SaveHelp';

    requiredLogin=false;
    /**
     *
     * @type {string[]}
     */
    emailTo = ['octavianvoloaca@gmail.com', 'bogdan.nourescu@cbn-it.ro'];
    /**
     *
     * @type {string}
     */
    emailFrom = 'office@cbn-it.ro';

    async execute() {
        let newData = {
            ...await this.getUpdatedData(),
            date: moment().format("YYYY-MM-DD"),
            companyId: this.req.param._companyId
        };
        let response = await this.updateDocument('default', "help", this.req.param._id, newData, false);
        await this.sendHelpMail(newData);
        return response;
    }

    async sendHelpMail(document){
        let html = `
            <div>Proiect: ${process.env.GOOGLE_CLOUD_PROJECT}</div>
            <div>Firma: ${this.req.param._companyId}</div>
            <div>User: ${(await this.getAccount())['accountEmail']}</div>
            <div>Mesaj: ${document.message}</div>
        `;
        return SendGrid.sendHtmlMail(
            this.emailTo,
            this.emailFrom,
            `Solicitare ajutor - ${this.req.param._companyId}`,
            html
        );
    }

}
module.exports = SaveHelp;