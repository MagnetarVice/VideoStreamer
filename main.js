const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");

// HTML 
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});


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

// port
app.listen(8888, function () {
  console.log("streaming on port 8888");
});
