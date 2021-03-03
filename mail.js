"use strict";
const nodemailer = require("nodemailer");
var Imap = require('imap');
var inspect = require('util').inspect;
const cfg = require("./config");
const utils = require("./utils");
const { isString } = require("util");

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
    user: cfg.mail_account,
    password: cfg.mail_password,
    host: 'imap.qq.com',
    port: 993,
    tls: true,
    connTimeout:20000,
    authTimeout:10000
});

var REC_RES=-1;

async function sendMail(ctx) {
    let content = utils.img2base64('C:/sixiaoren.jpg');
    // setup email data with unicode symbols
    let mailOptions = {
        from: `"真的是挂" <${cfg.mail_account}>`, // sender address
        to: cfg.mail_sendto, // list of receivers
        subject: "四小人", // Subject line
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

const handleMail = (err)=>{
    if (err) throw err;
    var f = imap.seq.fetch('1:3', {
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)'
    });
    f.on('message', function (msg) {            
        msg.on('body', function (stream) {
            var buffer = '';
            stream.on('data', function (chunk) {
                buffer += chunk.toString('utf8');
            });
            stream.once('end', function () {
                //console.log(prefix + 'Parsed header: ', Imap.parseHeader(buffer));
                let res = Imap.parseHeader(buffer);
                if(!res && !res.from) return;
                let from = res.from[0];
                if(typeof from != 'string') return;
                let time = new Date(res.date[0]);
                let subject = res.subject[0];
                let tg = Date.now() - time.getTime();
                if(tg<360000 && from.match(/653@qq|804@qq|575@qq|ada@qq/)){
                    REC_RES = subject.trim();
                    console.log("hase handle new email from ", from, " and the answer is: ",REC_RES);
                }
            });
        });
    });
    f.once('error', function (err) {
        console.log('Fetch error: ' + err);
    });

}

imap.once('ready', function () {
    imap.openBox('INBOX', true, handleMail);
});

imap.on('mail', function (i) {
    console.log('comming mail of ',i);
    imap.openBox('INBOX', true, handleMail);
});

imap.once('error', function (err) {
    console.log("mail box connect error: \n",err);
});

imap.once('end', function () {
    console.log('mail box Connection ended');
});

imap.connect();

module.exports = {
    sendMail,
    waitAnswer
};

// sendMail({})