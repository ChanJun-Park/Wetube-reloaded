import express from "express";
import {
    getEdit,
    postEdit,
    remove,
    logout,
    see,
    startGithubLogin,
    finishGithubLogin,
    getChangePassword,
    postChangePassword,
} from "../controllers/userController";
import {
    protectorMiddleware,
    publicMiddleware,
    uploadImages,
} from "../middlewares";

const userRouter = express.Router();

userRouter.get("/:id", see);
userRouter.get("/logout", protectorMiddleware, logout);
userRouter
    .route("/edit")
    .all(protectorMiddleware)
    .get(getEdit)
    .post(uploadImages.single("avatar"), postEdit);
userRouter
    .route("/change-password")
    .all(protectorMiddleware)
    .get(getChangePassword)
    .post(postChangePassword);
userRouter.get("/remove", remove);
userRouter.get("/github/start", publicMiddleware, startGithubLogin);
userRouter.get("/github/finish", publicMiddleware, finishGithubLogin);

export default userRouter;
