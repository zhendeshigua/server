const tencentcloud = require("tencentcloud-sdk-nodejs");
const cfg = require("./config");
const utils = require('./utils');
const global = require('./global');

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
    global.ghost = utils.recGhost(concat_str);   
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
    let res=concat_str.match(/\d+[，,.:\s]+\d+/)
    if(res) res = ''+res;
    else return ctx.body = "-1,-1";
    res = res.replace(' ','');
    res = res.replace(':',',');
    res = res.replace('.',',');
    res = res.replace('，',','); 
    return ctx.body = res;
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
    let ghost_arr=utils.parseGhost();

    const extract = e=>{
        let text=''+e.DetectedText;
        let filter = ghost_arr.filter(x=>{
            let a = text.indexOf(x[0]);
            let b = text.indexOf(x[1]);
            if(a<b && a>=0) return true;
            return false;
        });
        if(filter.length>0){
            // text = global.ghost;
            if(e.ItemPolygon){
                let posx = e.ItemPolygon.X + parseInt(e.ItemPolygon.Width/2);
                let posy = e.ItemPolygon.Y + parseInt(e.ItemPolygon.Height/2);
                res+= text+'$'+posx+'$'+posy+'|';
            }else{
                res+= text+'$'+-1+'$'+-1+'|';
            }    
        }            
    }
    data.TextDetections.map(extract);
    if(res.endsWith('|')) res = res.slice(0,-1);
    res+='->' + global.ghost;
    console.log("extract result is: ",res);
    return ctx.body = res;
}


module.exports={
    zhuogui,
    zuobiao,
    wzwz
}