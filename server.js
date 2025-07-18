const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const cors = require('cors');
const multer = require('multer');

// HTML 
app.use(cors());
app.use(express.json());

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get('/upload', function (req, res) {
    res.sendFile(__dirname + "/upload.html")
})

// video endpoint
app.get("/video/:name", function (req, res) {
  const videoName = req.params.name;
  const videoPath = path.join(__dirname, "videos", videoName);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Video not found");
  }
// --------------

// infos
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // tarayıcı range istiyorsa video chunk halinde gönderilir
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 10 ** 6, fileSize - 1); // 1MB chunk

    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);
    const stream = fs.createReadStream(videoPath, { start, end });
    stream.pipe(res);
  } else {
    // tarayıcı range istemediyse tüm video gönderilir
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'videos/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); 
  }
});

const upload = multer({ storage });

app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya yüklenemedi' });
  }
  res.json({
    message: 'Yükleme başarılı',
    filename: req.file.filename
  });
});

// port
app.listen(8888, function () {
  console.log("on port 8888");
});
