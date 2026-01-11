import express from 'express';
import { trending, searchVideo } from '../controllers/videoController';
import { getJoin, postJoin, getLogin, postLogin } from '../controllers/userController';

const rootRouter = express.Router();


rootRouter.get("/", trending);
rootRouter.route("/join").get(getJoin).post(postJoin);
rootRouter.route("/login").get(getLogin).post(postLogin);
rootRouter.get("/search", searchVideo);

export default rootRouter;