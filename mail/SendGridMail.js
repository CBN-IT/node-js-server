const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");

class SendGridMail{

    static async sendHtmlMail(to, from, subject, html){
        return this.send({to, from, subject, html});
    }

    static async sendTextMail(to, from, subject, text){
        return this.send({to, from, subject, text});
    }
    static async send({to, from, replyTo, cc, bcc, sendAt, subject, text, html, content,attachments}){
        return sgMail.send({to, from, replyTo, cc, bcc, sendAt, subject, text, html, content, attachments});
    }
}

module.exports = SendGridMail;