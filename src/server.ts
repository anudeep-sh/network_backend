import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import bodyparser from 'koa-bodyparser';
import { NetworkController } from './controllers/controller';
import { authenticate } from './middleware/middleware';
import cors from '@koa/cors';

const port = process.env.PORT || 8080;

const app = new Koa();
const router = new Router();

app.use(async (ctx, next) => {
    if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    } else {
        await next();
    }
});

app.use(logger());
app.use(bodyparser());

router.get('/', async (ctx) => {
    ctx.body = 'Welcome to Koa';
});

const networkController = new NetworkController();

router.post('/register', networkController.registerController);
router.post('/login', networkController.loginController);
router.get('/wallet', authenticate, networkController.getWalletDetails);
router.get('/wallet-history', authenticate, networkController.getWalletHistoryDetails);
router.post('/add-hub', authenticate, networkController.addHUBController);
router.post('/network', authenticate, networkController.joinController);
router.get('/get-hub', authenticate, networkController.getLevelsController);
router.post('/withdrawal', authenticate, networkController.withdrawalController);
router.patch('/update-withdrawal-request', authenticate, networkController.updateWithDrawalRequest);
router.get('/withdrawals-list/:status', authenticate, networkController.withdrawalList);

app.use(router.routes());
app.listen(port);

console.log(`My Koa server is up and listening on port ${port}`);