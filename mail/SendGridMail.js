const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");

class SendGridMail{

    static async sendHtmlMail(to, from, subject, html){
        const msg = {
            to, from, subject, html
        };
        return await sgMail.send(msg);
    }

    static async sendTextMail(to, from, subject, text){
        const msg = {
            to, from, subject, text
        };
        return await sgMail.send(msg);
    }

}

module.exports = SendGridMail;