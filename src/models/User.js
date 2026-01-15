import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    socialOnly: { type: Boolean, default: false },
    avartarUrl: String,
    location: String,
});

userSchema.pre("save", async function () {
    this.password = await bcrypt.hash(this.password, 5);
});

const User = mongoose.model("User", userSchema);
export default User;
