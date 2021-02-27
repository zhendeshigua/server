const request = require('request');
const fs = require('fs');
const images = require("images");
const utils = require('./utils');
const cfg = require('./config');
const global = require('./global');

var count=0;
var Access_Token="";

let get_token = ()=>{
    const grant_type = "client_credentials";    
    const apikey = cfg.bd_credential[cfg.bd_credential_index].apikey;
    const secretkey=cfg.bd_credential[cfg.bd_credential_index].secretkey;
    const url = 'https://aip.baidubce.com/oauth/2.0/token?grant_type='+grant_type+'&client_id='+apikey+'&client_secret='+secretkey;
    request(url,function(e,r,b){
        //console.log(b);
        if(!e){
            let re = JSON.parse(b);
            Access_Token=re.access_token;
            console.log(Access_Token);
        }
    })
}


let baiduRec = async (path, rectype='general')=>{
    let base64str = utils.img2base64(path);
    // console.log('sfasjfkasjdfkja',base64str);
    let resp;    
    try {        
        resp = await async_post(rectype, base64str);
    }catch(e){
        return {error:2, data:'cant recognize'};
    }
    // console.log('baidu rec result: ',resp);
    return {error:0,data:resp};
}

let intervalRec = async (path, sec)=>{
    return new Promise(function(resolve,reject){
        setTimeout(async function(){
            let rs =  await baiduRec(path);
            // console.log(rs)
            resolve(rs);
        },sec);
    })
}


let intervalAccurateRec = async (path, sec)=>{
    return new Promise(function(resolve,reject){
        setTimeout(async function(){
            let rs =  await baiduRec(path,'accurate');
            // console.log(rs)
            resolve(rs);
        },sec);
    })
}

let async_post = (rec_type,base64str)=> {
    let options = {
        url: 'https://aip.baidubce.com/rest/2.0/ocr/v1/'+rec_type+'_basic?access_token='+Access_Token,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        method: "POST",
        json: true,  
        body: "image="+ encodeURIComponent(base64str)
    };
    return new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}

const parseRecString = data=>{
    let concat_str='';
    // console.log('dd',data)
    if(!Array.isArray(data)){
        return 0;
    }
    data.forEach(el => {        
        concat_str += el.words;       
    });
    return concat_str;
}


let zhuogui = async ctx => { 
    const loop = 3;
    count=count+1;   
    let qs=ctx.request.querystring;
    console.log("have requested "+count+" times."+" The parameter is: "+qs);
    if(!qs){
        return ctx.body="WrongPara";
    }
    qs=qs.split('=')[1];
    if(qs.indexOf('&')>-1 || qs.indexOf('=')>-1){
        return ctx.body="WrongPara";
    }
    
    try{        
        for(let i=0;i<loop;i=i+1){
            let im = images('C:/'+qs+'.jpg');                    //Load image from file 
            let w= im.width();
            im.size(parseInt(w*(1+i*0.2)))
            im.save(`./outs/output${i}.jpg`, {               //Save the image to a file,whih quality 50
                quality : 100                    //保存图片到文件,图片质量为100
            });
        }        
    }catch(e){
        console.log(e)
        return ctx.body="Can'tOpenOrResizeImage "+qs;
    } 

    let guess = utils.zhuoguiDict();
    let result_list=[];

    let path='';
    path = 'C:/'+qs+'.bmp'
    let tres = await intervalAccurateRec(path,350);  
    // console.log('res is: ',tres);
    let tconcat_str = parseRecString(tres.data.words_result)
    // console.log('%%%%%%%',concat_str);
    let tout = utils.recognize(tconcat_str, guess);
    result_list.push(tout)
    global.ghost = utils.recGhost(tconcat_str);
    for(let i=0;i<loop;i=i+1){        
        path = `./outs/output${i}.jpg`
        let res = await intervalAccurateRec(path,350);  
        console.log('res is: ',res);
        let concat_str = parseRecString(res.data.words_result)
        let out = utils.recognize(concat_str, guess);
        result_list.push(out)
    } 
    console.log(result_list);
    let where='_'
    let axis='0,0';
    let len = 3;
    for(let i=0,ll=result_list.length;i<ll;i=i+1){
        let dt = result_list[i];
        if(where == '_' && dt.where.length>1) where = dt.where;
        if(dt.axis.length>len){
            axis = dt.axis;
            len = dt.axis.length;
            continue;
        }
        if(dt.axis.length==len && dt.axis[0]!='0' && axis[0]=='0'){
            axis=dt.axis;
        }

    }
    let last_res = where+','+axis; 
    console.log('at last, we get: ',last_res)
    return ctx.body = last_res;    
}

let zuobiao = async ctx => { 
    count=count+1;   
    let qs=ctx.request.querystring;
    console.log("have requested "+count+" times."+" The parameter is: "+qs);
    if(!qs){
        return ctx.body="WrongPara";
    }
    qs=qs.split('=')[1];
    if(qs.indexOf('&')>-1 || qs.indexOf('=')>-1){
        return ctx.body="WrongPara";
    }
    let bitmap,base64str;
    try {
        bitmap = fs.readFileSync('C:/'+qs+'.bmp');        
    } catch (error) {
        console.log("Can'tOpenImage "+qs+"!!!!!!!!!!!!!!!!!!!!!!!!!");
        return ctx.body='-1,-1'
    }
    base64str = Buffer.from(bitmap, 'binary').toString('base64'); // base64编码
    let resp;    
    try {        
        resp = await async_post('accurate',base64str);
    }catch(e){
        console.log('WWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRRRRRRRRRRRRRRROOOOOOOOOOOOOOOOOOOOOWWWWWWWWWWWWWWWWWWWWWW')
        return ctx.body="-1,-1";
    }
    
    console.log('resp is: ',resp);
    let res = parseRecString(resp.words_result)
    //let res = resp.words_result;
    // if(!res){
    //     console.log("no result in resp!");
    //     return ctx.body='-1,-1';
    // }
    console.log('res gonna to be RecExg is: ',res);
    res=res.match(/\d+[,:.]\d+/,',')
    if(res) res = ''+res;
    else {
        resp = await async_post('general',base64str);
        res = parseRecString(resp.words_result);
        res=res.match(/\d+[,:.]\d+/,',');
        console.log('second rec of resp is: ',resp,' recExg res is: ',res);
        if(res) res= ''+res;
        else return ctx.body = "-1,-1";
    }
    
    console.log('after RecExg res is: ',res);
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

let parseData = (data, str)=>{
    let concat_str='';
    // console.log('dd',data)
    if(!Array.isArray(data)){
        return 0;
    }
    data.forEach(el => {        
        concat_str += el.words+',';       
    });
    console.log('baidu rec string is: ',concat_str);
    let strA = str.match(/./g);
    let rA = strA.filter(e=>concat_str.indexOf(e)!=-1);
    return rA.length;
}

let findword =async ctx => {
    let qs=ctx.query;
    console.log(" The parameter is: ",qs);
    if(!qs){
        return ctx.body="-1,-1,wrong parameters";
    }
    console.log(" The parameter is: ",qs);
    if(!qs.nx || !qs.ny || !qs.str){
        return ctx.body='-1,-1,wrong parameters'
    }
    if(qs.str=='0') qs.str=ghost;
    
    let path;
    for(let y=0;y<qs.ny;y++){
        for(let x=0;x<qs.nx;x++){            
            path=`C:/screens_${y}_${x}.jpg`;
            let res = await intervalRec(path,350);   //await baiduRec(path);
            if(!res.error){
                let n = parseData(res.data.words_result, qs.str)
                if(n>=2 || n/qs.str.length>0.3){
                    console.log('return is: ',y,',',x);
                    return ctx.body=''+y+','+x;
                }
            }
        }
    }
    return ctx.body='-1,-1'
    
}

module.exports={
    zhuogui,
    zuobiao,
    findword,
    get_token,
}