const fs = require('fs');
const cfg = require('./config');
const global = require('./global');

const img2base64 = (path)=>{
    console.log('rec file path is: ',path);
    let bitmap,base64str;
    try {
        bitmap = fs.readFileSync(path);        
    } catch (error) {
        return {error:1,data:'cant open file'};
    }
    base64str = Buffer.from(bitmap, 'binary').toString('base64'); // base64编码
    return base64str;
}


const zhuoguiDict = ()=>{
    let wheres = cfg.zhuogui_place;

    const matchFun = x=>{
        let arr = x.match(/./ig);
        return arr.map(e=>x.replace(e,''))        
    }
    //maybes will be two dimensions array.
    let maybes = wheres.map(matchFun)

    // console.log(maybes)

    let guess={}
    for(let i=0, l=wheres.length; i<l;i++){
        maybes[i].push(wheres[i]);
        guess[wheres[i]] = maybes[i]; 
    } 
    for(var k in cfg.zhuogui_place_add){
        guess[k]=cfg.zhuogui_place_add[k];
    } 
    // console.log(guess); 
    return guess;
}

/**
 * 
 * @param {String} concat_str string gona to be recgnize.
 * @param {JSON} guess match for the guess substring.
 * @return {JSON} {where:'place in guess', axis: '0,0'}
 */
const recognize = (concat_str, guess)=>{
    let where='_'
    for(let e in guess){
        let k = guess[e].filter(x=>concat_str.includes(x));
        if(k.length>0){
            where=e;
            break;
        }
    }

    console.log('Rec string: ',concat_str);
    let pt = /\d+[,.:]\d+/ig
    let axis = concat_str.match(pt);
    
    if(axis){
        axis = ''+axis;
        axis = axis.replace(':',',');
        axis = axis.replace('.',',');
    }else{
        let ifcase = concat_str.match(/\d{6}/);
        if(ifcase){
            ifcase=''+ifcase;
            axis = ifcase.substr(0,3) + ',' + ifcase.substr(-3)
        }else{
            axis = '0,0'
        }
        
    } 
    console.log('where is: ',where, " axis: ",axis); 
    return {where: where, axis:axis} 
} 

const parseGhost=()=>{
    let res=[]
    for(let i=0;i<global.ghost.length;i++){
        for(let j=i+1;j<global.ghost.length;j++){
            res.push(global.ghost[i]+global.ghost[j]);
        }
    }
    return res;
}

const recGhost = concat_str =>{
    let pt = /\d[处抓]+.+[鬼。\.]$/
    let res = concat_str.match(pt);    
    res=''+res;
    // console.log('first match: ',res);
    res = res.replace(/\d[处抓]+/,'')
    res = res.replace(/[。\.]/,'')
    res = ''+res;
    if(!res.endsWith('鬼')) res+='鬼'
    console.log('the ghost is: ',res)
    return res;
}

module.exports={
    img2base64,
    zhuoguiDict,
    recognize,
    parseGhost,
    recGhost
}
