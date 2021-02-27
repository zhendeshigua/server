const tencentcloud = require("tencentcloud-sdk-nodejs");
const cfg = require("./config");
const utils = require('./utils');


const client = new tencentcloud.ocr.v20181119.Client({
    credential: cfg.tc_credential[cfg.tc_credential_index],
    region: "ap-shanghai",
    profile: {
      signMethod: "TC3-HMAC-SHA256",
      httpProfile: {
        reqMethod: "POST",
        reqTimeout: 30
        //endpoint: "cvm.ap-shanghai.tencentcloudapi.com",
      },
    },
})


const zhuogui = async ctx=>{
    let qs=ctx.request.querystring;
    console.log(" The parameter is: "+qs);
    if(!qs){
        return ctx.body="WrongPara";
    }
    qs=qs.split('=')[1];
    if(qs.indexOf('&')>-1 || qs.indexOf('=')>-1){
        return ctx.body="WrongPara";
    }
    let guess = utils.zhuoguiDict();
    let result_list=[];
    let base64str = utils.img2base64('C:/'+qs+'.jpg');
    let req ={
        ImageBase64: base64str
    }
    const data = await client.GeneralAccurateOCR(req)
    // console.log('tencen rec data is:\n',data);
    let concat_str='';
    data.TextDetections.map(x=>concat_str=concat_str+x.DetectedText);
    console.log(concat_str);    
    let rec = utils.recognize(concat_str, guess);
    ctx.body = rec.where + ','+rec.axis;
}
  

const zuobiao = async ctx =>{
    let qs=ctx.request.querystring;
    console.log(" The parameter is: "+qs);
    if(!qs){
        return ctx.body="WrongPara";
    }
    qs=qs.split('=')[1];
    if(qs.indexOf('&')>-1 || qs.indexOf('=')>-1){
        return ctx.body="WrongPara";
    }
    let base64str = utils.img2base64('C:/'+qs+'.bmp');
    let req ={
        ImageBase64: base64str
    }
    const data = await client.GeneralAccurateOCR(req);
    let concat_str='';
    data.TextDetections.map(x=>concat_str=concat_str+x.DetectedText);
    console.log(concat_str); 
    let res=concat_str.match(/\d+[,:.]\d+/,',')
    if(res) res = ''+res;
    else return ctx.body = "-1,-1";

    if(res.indexOf(',')!=-1){
        return ctx.body = res;
    }else if(res.indexOf('.')!=-1){
        res=res.replace('.',',');
        return ctx.body = res;
    }else if(res.indexOf(':')!=-1){
        res=res.replace(':',',');
        return ctx.body = res;
    }else{
        return ctx.body = "-1,-1";
    }

}

const wzwz = async ctx =>{
    let qs=ctx.request.querystring;
    console.log(" The parameter is: "+qs);
    if(!qs){
        return ctx.body="WrongPara";
    }
    qs=qs.split('=')[1];
    if(qs.indexOf('&')>-1 || qs.indexOf('=')>-1){
        return ctx.body="WrongPara";
    }    
    let base64str = utils.img2base64('C:/'+qs+'.jpg');
    let req ={
        ImageBase64: base64str
    }
    const data = await client.GeneralAccurateOCR(req)
    let res='';
    const extract = e=>{
        let text=e.DetectedText;
        if(!text.endsWith('鬼')) return;
        if(e.ItemPolygon){
            let posx = e.ItemPolygon.X + parseInt(e.ItemPolygon.Width/2);
            let posy = e.ItemPolygon.Y + parseInt(e.ItemPolygon.Height/2);
            res+= text+'$'+posx+'$'+posy+'|';
        }else{
            res+= text+'$'+-1+'$'+-1+'|';
        }        
    }
    data.TextDetections.map(extract);
    if(res.endsWith('|')) res = res.slice(0,-1);
    console.log("extract result is: ",res);
    return ctx.body = res;
}


module.exports={
    zhuogui,
    zuobiao,
    wzwz
}