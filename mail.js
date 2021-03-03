"use strict";
const nodemailer = require("nodemailer");
const notifier = require('./notifier');
const cfg = require("./config");
const utils = require("./utils");
const { isString } = require("util");
const global = require('./global');
const n = notifier(imap);
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


var imap = {
    user: cfg.mail_account,
    password: cfg.mail_password,
    host: 'imap.qq.com',
    port: 993,
    tls: true,
    connTimeout:20000,
    authTimeout:10000
};

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
    var it = setInterval(() => {
        n.scan(x=>x);        
    }, 10000);
    
    for(let i=0;i<10000;i++){
        if(REC_RES!=-1){
            clearInterval(it);
            return ctx.body = REC_RES;
        }
        await utils.wait(10);
    }
    clearInterval(it);
    return ctx.body = REC_RES;
}

const handleMail = (res)=>{
    console.log('res uid  is',res.uid);
    if(res.uid>global.mail_uid) global.mail_uid=res.uid;

    let from = res.from[0].address;
    let time = new Date(res.date);
    let subject = res.subject;
    let tg = Date.now() - time.getTime();
    if(tg<360000 && from.match(/653@qq|804@qq|575@qq|ada@qq/)){
        REC_RES = subject.trim();
        console.log("hase handle new email from ", from, " and the answer is: ",REC_RES);
    }
}

n.on('end', () => n.start()) // session closed
  .on('mail', handleMail)
  .on('error',e=>{console.log(e);})
  .start();

module.exports = {
    sendMail,
    waitAnswer
};

// sendMail({})