import { Router } from "express";
import ctrl from '../controllers/controllers'
import multer, { memoryStorage } from "multer";
import rateLimiter from  '../middlewares/rateLimiter';

const app: Router = Router();
const upload = multer({ storage: memoryStorage() });



app.post('/input',upload.single("file"),rateLimiter,ctrl.input)
app.post('/balance',rateLimiter,ctrl.balance)

export default app