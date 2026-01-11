import Video from "../models/Video";

export const trending = async (req, res) => {
    try {
        const videos = await Video.find({}).sort({
            createdAt: "desc",
        });
        return res.render("home", { pageTitle: "Home", videos });
    } catch (error) {
        console.log(`Error: ${error}`);
    }
};
export const watch = async (req, res) => {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
        return res.status(404).render("404", { pageTitle: "Video not found" });
    }
    return res.render("watch", {
        pageTitle: video.title,
        video,
    });
};
export const getEdit = async (req, res) => {
    const { id } = req.params;
    const video = await Video.findById(id);
    console.log("getEdit!!");
    if (!video) {
        return res.status(404).render("404", { pageTitle: "Video not found" });
    }

    return res.render("edit", { pageTitle: `Editing: ${video.title}`, video });
};
export const postEdit = async (req, res) => {
    const { id } = req.params;
    const { title, description, hashtags } = req.body;

    const exists = await Video.exists({ _id: id });
    if (!exists) {
        return res.status(404).render("404", { pageTitle: "Video not found" });
    }

    try {
        await Video.findByIdAndUpdate(id, {
            title,
            description,
            hashtags: Video.formatHashtags(hashtags),
        });
        return res.redirect(`/videos/${id}`);
    } catch (error) {
        console.log(`Error: ${error}`);
        return res.status(400).render("edit", {
            errorMessage: error.message,
        });
    }
};
export const getUpload = (req, res) => {
    return res.render("upload", { pageTitle: "Upload Video" });
};

export const postUpload = async (req, res) => {
    const { title, description, hashtags } = req.body;

    try {
        const video = new Video({
            title,
            description,
            hashtags: Video.formatHashtags(hashtags),
        });
        await video.save();
        return res.redirect("/");
    } catch (error) {
        console.log(`Error: ${error}`);
        return res.status(400).render("upload", {
            pageTitle: "Upload Video",
            errorMessage: error.message,
        });
    }
};

export const deleteVideo = async (req, res) => {
    const { id } = req.params;
    console.log(id);
    console.log("delete video controller");
    try {
        await Video.findByIdAndDelete(id);
    } catch (error) {
        console.log(`Error: ${error}`);
    }

    return res.redirect("/");
};

export const searchVideo = async (req, res) => {
    console.log(req.query);
    const { keyword } = req.query;
    let videos = [];
    if (keyword) {
        videos = await Video.find({
            title: {
                $regex: new RegExp(`${keyword}`, "i"),
            },
        });
    }

    return res.render("search", { pageTitle: "Search Video", videos });
};
