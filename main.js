const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

// Dinamik video endpoint
app.get("/video/:name", function (req, res) {
  const videoName = req.params.name;
  const videoPath = path.join(__dirname, "videos", videoName);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Video not found");
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // 🎯 Range varsa: video stream (chunk)
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
    // 🔁 Range yoksa: tüm dosyayı döndür (progressive download)
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.listen(8000, function () {
  console.log("Listening on port 8000!");
});
