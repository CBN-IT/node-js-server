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