import multer from "multer";

export const localsMiddleware = (req, res, next) => {
    res.locals.loggedIn = Boolean(req.session.isLoggedIn);
    res.locals.loggedInUser = req.session.user || {};
    next();
};

export const protectorMiddleware = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect("/login");
    } else {
        return next();
    }
};

export const publicMiddleware = (req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect("/");
    } else {
        return next();
    }
};

export const uploadImages = multer({
    dest: "uploads/image/",
    limits: {
        fileSize: 3000,
    },
});
export const uploadVideos = multer({
    dest: "uploads/video/",
    limits: {
        fileSize: 10000000,
    },
});
