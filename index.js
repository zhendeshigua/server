const Koa = require('koa');
const route = require('koa-route');
const charset = require('koa-charset');
const baidu = require('./baidu')
const tencent = require('./tencent');

//pkg -t win index.js -o server.exe 
const app = new Koa();
app.use(charset());

app.use(async (ctx,next)=> {
    ctx.acceptsCharsets('utf8');
    await next();
});



app.use(route.get('/bd_zhuogui', baidu.zhuogui));
app.use(route.get('/bd_zuobiao', baidu.zuobiao));
app.use(route.get('/bd_findword',baidu.findword));

app.use(route.get('/tc_zhuogui', tencent.zhuogui));
app.use(route.get('/tc_zuobiao', tencent.zuobiao));
app.use(route.get('/tc_wzwz',    tencent.wzwz));


console.log("sever run at port 8888");
baidu.get_token();
app.listen(8888);

