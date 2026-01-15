import express from 'express';
import { trending, searchVideo } from '../controllers/videoController';
import { getJoin, postJoin, getLogin, postLogin } from '../controllers/userController';
import {
    protectorMiddleware,
    publicMiddleware,
} from "../middlewares";

const rootRouter = express.Router();


rootRouter.get("/", trending);
rootRouter.route("/join").all(publicMiddleware).get(getJoin).post(postJoin);
rootRouter.route("/login").all(publicMiddleware).get(getLogin).post(postLogin);
rootRouter.get("/search", searchVideo);

export default rootRouter;