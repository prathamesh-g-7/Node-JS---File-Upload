import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { v4 } from "uuid";
import fileSchema from "./fileSchema.js";

const app = express();
app.use(express.json());

// DB config
const mongoURI =
  "mongodb+srv://admin:AtHaoRroNldFmHr7@cluster0.ghi5h.mongodb.net/users?retryWrites=true&w=majority";
mongoose.connect(mongoURI, {
  // useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("DB connected");
});

// middleware for Multer
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, "./images");
  },
  filename: (req, file, callBack) => {
    callBack(null, Date.now() + "-" + file.originalname);
  },
});

let fileFilter = function (req, file, callBack) {
  var allowedMimes = ["image/jpeg", "image/png"];
  if (allowedMimes.includes(file.mimetype)) {
    callBack(null, true);
  } else {
    callBack(
      {
        success: false,
        message: "Invalid file type. Only jpeg, png images are Allowed.",
      },
      false
    );
  }
};

let obj = {
  storage: fileStorageEngine,
  limits: {
    fileSize: 1 * 1024 * 1024,
  },
  fileFilter: fileFilter,
};

const upload = multer(obj).single("image");

// route for uploading image
app.post("/single", async (req, res) => {
  const id = v4();

  await upload(req, res, function (error) {
    const details = {
      imageName: req.file.originalname,
      image: req.file.filename,
      id: id,
    };

    if (error) {
      res.status(500);
      if (error.code == "LIMIT_FILE_SIZE") {
        error.message = "File Size is too large. Allowed file size is 1 MB";
        error.success = false;
      }
      return res.json(error);
    } else {
      if (!req.file) {
        res.status(500);
        res.json("file not found");
      }

      fileSchema.create(details, (err, data) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.status(201).send(data);
        }
      });

      res.json({
        success: true,
        message: "File uploaded successfully!",
        imageID: details.id,
      });
    }
  });
});

// route for deleteing image
app.delete("/delete-image", (req, res) => {
  //
  MongoClient.connect(mongoURI, (err, db) => {
    if (err) throw err;

    const idToDelete = req.body.id;

    const dbo = db.db("users");

    dbo.collection("images").deleteOne({ id: idToDelete }, (err, result) => {
      if (err) throw err;
      console.log(result);
      res.status(202).send(`Image Delted Successfully with id=${idToDelete}`);
    });
  });
});

// route to Rename image
app.put("/rename-image/:id", (req, res) => {
  MongoClient.connect(mongoURI, (err, db) => {
    if (err) throw err;

    const idToRename = req.params.id;
    const updatedName = req.body.name;

    const dbo = db.db("users");

    dbo.collection("images").findOne({ id: idToRename }, (err, result) => {
      if (err) throw err;

      result.imageName = updatedName;
      res.status(201).send(result);
    });
  });
});

// listen
app.listen(4200);
