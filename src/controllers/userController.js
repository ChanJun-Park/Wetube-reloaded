import User from "../models/User";
import bcrypt from "bcrypt";
import Video from "../models/Video";

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

    const exist = await User.exists({ $or: [{ userName }, { email }] });
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

export const getEdit = (req, res) => {
    return res.render("edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async (req, res) => {
    const {
        session: {
            user: { _id, avatarUrl },
        },
        body: { name, userName, email, location },
        file,
    } = req;
    console.log(file);

    const isUserNameChanged = userName !== req.session.user.userName;
    if (isUserNameChanged) {
        console.log(userName);
        const exist = await User.exists({ $or: [{ userName }] });
        if (exist) {
            return res.status(400).render("edit-profile", {
                pageTitle: "Edit Profile",
                errorMessage: "userName is already taken",
            });
        }
    }

    const isEmailChanged = email !== req.session.user.email;
    if (isEmailChanged) {
        const exist = await User.exists({ $or: [{ email }] });
        if (exist) {
            return res.status(400).render("edit-profile", {
                pageTitle: "Edit Profile",
                errorMessage: "email is already taken",
            });
        }
    }

    const newUser = await User.findByIdAndUpdate(
        _id,
        {
            avatarUrl: file ? file.path : avatarUrl,
            name,
            userName,
            email,
            location,
        },
        { new: true },
    );

    req.session.user = newUser;
    return res.redirect("/users/edit");
};

export const getChangePassword = (req, res) => {
    return res.render("user/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
    const {
        body: { oldPassword, newPassword, confirmPassword },
        session: {
            user: { _id },
        },
    } = req;

    const user = await User.findById(_id);
    if (newPassword != confirmPassword) {
        return res.status(400).render("user/change-password", {
            pageTitle: "Change Password",
            errorMessage: "비밀번호가 일치하지 않습니다.",
        });
    }

    console.log("oldPassword", oldPassword);
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
        return res.status(400).render("user/change-password", {
            pageTitle: "Change Password",
            errorMessage: "기존 비밀번호가 다릅니다.",
        });
    }

    console.log("newPassword", newPassword);
    user.password = newPassword;
    await user.save();

    console.log("user.password", user.password);

    return res.redirect("/users/logout");
};

export const remove = (req, res) => res.send("Delete User");

export const getLogin = (req, res) =>
    res.render("login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
    const { userName, password } = req.body;
    const pageTitle = "Login";
    const user = await User.findOne({ userName: userName, socialOnly: false });

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

export const logout = (req, res) => {
    console.log("logout");
    req.session.destroy();
    return res.redirect("/");
};

export const see = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate("videos");
    if (!user) {
        return res.status(404).render("404", { pageTitle: "User Not Found" });
    }
    return res.render("user/profile", {
        pageTitle: `${user.name} 의 프로필`,
        user,
    });
};
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
    const params = new URLSearchParams(config).toString();
    const finalURL = `${baseURL}?${params}`;
    const data = await fetch(finalURL, {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
    });
    const json = await data.json();

    if ("access_token" in json) {
        const { access_token } = json;
        const apiUrl = "https://api.github.com";
        const userData = await fetch(`${apiUrl}/user`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        const userDataJson = await userData.json();

        const emailData = await fetch(`${apiUrl}/user/emails`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        const emailDataJson = await emailData.json();

        const emailObj = emailDataJson.find(
            (email) => email.primary === true && email.verified === true,
        );
        if (!emailObj) {
            return res.redirect("/login");
        } else {
            // 이미 계정이 있다면 로그인 시켜줄지, 없다면 계정을 생성할지, 패스워드 방식으로 계정을 생성했던 사람은 어떻게 처리할지 등등 결정할 수 있다.
            // 여기서는 이미 계정이 있다면 바로 로그인 시켜주고
            // 계정이 없다면 계정을 생성하고,
            // 소셜 로그인으로 계정을 만들었다면, 패스워드 방식으로 로그인 시도할때 실패 처리를 한다.
            let user = await User.findOne({ email: emailObj.email });
            if (!user) {
                user = await User.create({
                    name: userDataJson.name,
                    userName: userDataJson.login,
                    email: emailObj.email,
                    password: "",
                    socialOnly: true,
                    location: userDataJson.location,
                    avatarUrl: userDataJson.avatar_url,
                });
            }
            req.session.isLoggedIn = true;
            req.session.user = user;
            return res.redirect("/");
        }
    } else {
        return res.redirect("/login");
    }
};
