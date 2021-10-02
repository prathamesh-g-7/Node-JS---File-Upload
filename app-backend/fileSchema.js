import mongoose from "mongoose";

const fileSchema = mongoose.Schema({
  imageName: String,
  image: String,
  id: String,
});

export default mongoose.model("images", fileSchema);
