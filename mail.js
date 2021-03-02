"use strict";
const nodemailer = require("nodemailer");
var Imap = require('imap');
var inspect = require('util').inspect;
const cfg = require("./config");
const utils = require("./utils")

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: "smtp.qq.com",
    port: 25,
    secure: false, // true for 465, false for other ports
    auth: {
        user: cfg.mail_account, // generated ethereal user
        pass: cfg.mail_password // generated ethereal password
    }
});


var imap = new Imap({
    user: 'mygmailname@gmail.com',
    password: 'mygmailpassword',
    host: 'imap.gmail.com',
    port: 993,
    tls: true
});

var REC_RES=-1;

async function sendMail(ctx) {
    let content = utils.img2base64('C:/sixiaoren.jpg');
    // setup email data with unicode symbols
    let mailOptions = {
        from: '"zhendeshigua" <jass.ada@qq.com>', // sender address
        to: toaddress, // list of receivers
        subject: "Help", // Subject line
        //   text: ecode, // plain text body
        html: `<img src="data:image/jpeg;base64,${content}">`// html body
    };
    REC_RES=-1;
    // send mail with defined transport object
    await transporter.sendMail(mailOptions);
    return ctx.body='ok';
}

async function waitAnswer(ctx){    
    for(let i=0;i<10000;i++){
        if(REC_RES!=-1){
            return ctx.body = REC_RES;
        }
        await utils.wait(10);
    }
    return ctx.body = REC_RES;
}


function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

imap.once('ready', function () {
    openInbox(function (err, box) {
        if (err) throw err;
        var f = imap.seq.fetch('1:3', {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            struct: true
        });

        f.on('message', function (msg, seqno) {
            console.log('Message #%d', seqno);
            var prefix = '(#' + seqno + ') ';

            msg.on('body', function (stream, info) {
                var buffer = '';
                stream.on('data', function (chunk) {
                    buffer += chunk.toString('utf8');
                });
                stream.once('end', function () {
                    console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                });
            });

            msg.once('attributes', function (attrs) {
                console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
            });

            msg.once('end', function () {
                console.log(prefix + 'Finished');
            });

        });

        f.once('error', function (err) {
            console.log('Fetch error: ' + err);
        });

        f.once('end', function () {
            console.log('Done fetching all messages!');
            imap.end();
        });

    });
});

imap.once('error', function (err) {
    console.log(err);
});

imap.once('end', function () {
    console.log('Connection ended');
});

imap.connect();

module.exports = {
    sendMail,
    waitAnswer
};