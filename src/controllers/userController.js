import User from "../models/User";
import bcrypt from "bcrypt";

export const getJoin = (req, res) =>
    res.render("join", { pageTitle: "Join Hear" });

export const postJoin = async (req, res) => {
    const { name, userName, email, password, password2, location } = req.body;
    if (password !== password2) {
        return res.status(400).render("join", {
            pageTitle: "Join Hear",
            errorMessage: "Password confirmation failed",
        });
    }

    const exist = User.exists({ $or: [{ userName }, { email }] });
    if (exist) {
        return res.status(400).render("join", {
            pageTitle: "Join Hear",
            errorMessage: "userName or email is already taken",
        });
    }
    try {
        await User.create({ name, userName, email, password, location });
        return res.redirect("/login");
    } catch (error) {
        console.log(`Error: ${error}`);
        return res.status(400).render("join", {
            errorMessage: error.message,
        });
    }
};

export const edit = (req, res) => res.send("Edit User");

export const remove = (req, res) => res.send("Delete User");

export const getLogin = (req, res) =>
    res.render("login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
    const { userName, password } = req.body;
    const pageTitle = "Login";
    const user = await User.findOne({ userName });

    if (!user) {
        return res.status(400).render("login", {
            pageTitle,
            errorMessage: "An account with this userName does not exists",
        });
    }

    // 소셜 로그인인 경우 처리 추가해야 함.
    const correct = await bcrypt.compare(password, user.password);
    if (!correct) {
        return res.status(400).render("login", {
            pageTitle,
            errorMessage: "Wrong password",
        });
    }

    req.session.isLoggedIn = true;
    req.session.user = user;

    return res.redirect("/");
};

export const logout = (req, res) => res.send("Logout User");

export const see = (req, res) => res.send("See User Profile");

export const startGithubLogin = (req, res) => {
    const baseURL = "https://github.com/login/oauth/authorize";
    const config = {
        client_id: process.env.GH_CLIENT_ID,
        scope: "read:user user:email",
    };
    const params = new URLSearchParams(config).toString();
    const finalURL = `${baseURL}?${params}`;
    return res.redirect(finalURL);
};

export const finishGithubLogin = async (req, res) => {
    const baseURL = "https://github.com/login/oauth/access_token";
    const config = {
        client_id: process.env.GH_CLIENT_ID,
        client_secret: process.env.GH_CLIENT_SECRET,
        code: req.query.code,
    };
    console.log(config);
    const params = new URLSearchParams(config).toString();
    const finalURL = `${baseURL}?${params}`;
    const data = await fetch(finalURL, {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
    });
    const json = await data.json();
    console.log(json);

    if ("access_token" in json) {
        const { access_token } = json;
        const apiUrl = "https://api.github.com";
        const userData = await fetch(`${apiUrl}/user`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        const userDataJson = await userData.json();
        console.log(userDataJson);

        const emailData = await fetch(`${apiUrl}/user/emails`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        const emailDataJson = await emailData.json();
        console.log(emailDataJson);

        const emailObj = emailDataJson.find(
            (email) => email.primary === true && email.verified === true
        );
        if (!emailObj) {
            return res.redirect("/login");
        } else {
            // 이미 계정이 있다면 로그인 시켜줄지, 없다면 계정을 생성할지, 패스워드 방식으로 계정을 생성했던 사람은 어떻게 처리할지 등등 결정할 수 있다.
            // 여기서는 이미 계정이 있다면 바로 로그인 시켜주고
            // 계정이 없다면 계정을 생성하고,
            // 소셜 로그인으로 계정을 만들었다면, 패스워드 방식으로 로그인 시도할때 실패 처리를 한다.
            const existingUser = await User.findOne({ email: emailObj.email });
            if (existingUser) {
                req.session.isLoggedIn = true;
                req.session.user = existingUser;
                return res.redirect("/");
            } else {
                const newUser = await User.create({
                    name: userDataJson.name,
                    userName: userDataJson.login,
                    email: emailObj.email,
                    password: "",
                    socialOnly: true,
                    location: userDataJson.location,
                });
                req.session.isLoggedIn = true;
                req.session.user = newUser;
                return res.redirect("/");
            }
        }
    } else {
        return res.redirect("/login");
    }
};
