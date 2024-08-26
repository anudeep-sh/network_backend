import * as Koa from 'koa';
import * as Router from 'koa-router';
import logger = require('koa-logger');
import bodyparser = require('koa-bodyparser');
import { NetworkController } from './controllers/controller';
import { authenticate } from './middleware/middleware';
import cors = require('@koa/cors');
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client'; // Import prom-client

const port = process.env.PORT || 8080;

const app = new Koa();
const router = new Router();

// Create a Registry to register the metrics
const register = new Registry();
collectDefaultMetrics({ register }); // Collect default metrics

// Custom metrics
const httpRequestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

app.use(logger());
app.use(cors());
app.use(bodyparser());

// Middleware to track requests
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const duration = (Date.now() - start) / 1000;

    // Increment request counter
    httpRequestCounter.labels(ctx.method, ctx._matchedRoute || ctx.path, ctx.status.toString()).inc();

    // Observe request duration
    httpRequestDuration.labels(ctx.method, ctx._matchedRoute || ctx.path, ctx.status.toString()).observe(duration);
});

router.get('/', async (ctx) => {
    ctx.body = 'Welcome to Koa';
});

const networkController = new NetworkController();

router.post('/register', networkController.registerController);
router.post('/login', networkController.loginController);
router.patch('/update-bank-details',authenticate,networkController.patchUserDetailsController);


router.get('/wallet', authenticate, networkController.getWalletDetails);
router.get('/wallet-history', authenticate, networkController.getWalletHistoryDetails);
router.post('/add-hub', authenticate, networkController.addHUBController);
router.post('/network', authenticate, networkController.joinController);
router.get('/get-hub', authenticate, networkController.getLevelsController);
router.post('/withdrawal', authenticate, networkController.withdrawalController);
router.get('/withdrawal', authenticate, networkController.getWithdrawals);

// Admin routes
router.patch('/update-withdrawal-request', authenticate, networkController.updateWithDrawalRequest);
router.get('/withdrawals-list/:status', authenticate, networkController.withdrawalList);
router.patch('/update-quota', authenticate, networkController.updateQuotaController);
router.post('/post-quota', authenticate, networkController.postQuotaController);


router.get('/api/network', authenticate, networkController.networkController);
router.get('/get-quotas', authenticate, networkController.getQuotasController);
router.get('/get-quota/:userId', authenticate, networkController.getQuotaByUserIdController);

// Expose metrics endpoint
router.get('/metrics', async (ctx) => {
    ctx.set('Content-Type', register.contentType);
    ctx.body = await register.metrics();
});

app.use(router.routes());
app.listen(port);

console.log(`My Koa server is up and listening on port ${port}`);
