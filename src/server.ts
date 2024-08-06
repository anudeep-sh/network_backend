import * as Koa from 'koa';
import * as Router from 'koa-router'
import logger=require('koa-logger');
import bodyparser=require('koa-bodyparser')
import { NetworkController } from './controllers/controller';
import { authenticate } from './middleware/middleware';
import cors = require('@koa/cors');

const port=process.env.PORT || 8080

const app=new Koa();
const router=new Router();
app.use(logger());
app.use(cors({
    origin: (ctx) => {
        if (ctx.request.header.origin === 'http://localhost:3000') {
            return ctx.request.header.origin; // Allow requests from localhost:3000
        }
        return ''; // Disallow all other origins
    }
}));
app.use(bodyparser());

router.get('/',async (ctx)=>{
    ctx.body='Welcome to Koa';
});

const networkController = new NetworkController()

router.post('/register',networkController.registerController);
router.post('/login',networkController.loginController);
router.get('/wallet', authenticate, networkController.getWalletDetails);
router.get('/wallet-history',authenticate,networkController.getWalletHistoryDetails);
router.post('/add-hub',authenticate, networkController.addHUBController);
router.post('/network',authenticate,networkController.joinController);
router.get('/get-hub',authenticate,networkController.getLevelsController);
router.post('/withdrawal',authenticate,networkController.withdrawalController)
router.patch('/update-withdrawal-request',authenticate,networkController.updateWithDrawalRequest)
router.get('/withdrawals-list/:status',authenticate,networkController.withdrawalList)

app.use(router.routes());
app.listen(port);

console.log(` My koa server is up and listening on port ${port}`)