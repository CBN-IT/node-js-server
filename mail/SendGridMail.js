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
