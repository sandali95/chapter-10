const express = require("express");
const fs = require("fs");
const path = require("path");

//
// Starts the microservice.
//
function startMicroservice(storagePath, port) {
  console.log(`Storing files at ${storagePath}.`);

  const app = express();

  //
  // HTTP GET route we can use to check if the service is handling requests.
  //
  app.get("/api/live", (req, res) => {
    res.sendStatus(200);
  });

  //
  // HTTP GET route that streams a video from storage.
  //
  app.get("/api/video", (req, res) => {
    try {
      const videoId = req.query.id;
      const localFilePath = path.join(storagePath, videoId);

      console.log(`Streaming video with id: ${videoId} from ${localFilePath}.`);

      res.sendFile(localFilePath);
    } catch (error) {
      console.error("Error fetching video.");
      console.error((error && error.stack) || error);
      res.status(500).send("An error occurred while fetching the video");
    }
  });

  //
  // HTTP POST route to upload a video to storage.
  //
  app.post("/api/upload", (req, res) => {
    try {
      const videoId = req.headers.id;
      const localFilePath = path.join(storagePath, videoId);

      console.log(`Uploading video with id: ${videoId} to ${localFilePath}.`);

      const fileWriteStream = fs.createWriteStream(localFilePath);
      req
        .pipe(fileWriteStream)
        .on("error", (err) => {
          console.error("Upload failed.");
          console.error((err && err.stack) || err);
        })
        .on("finish", () => {
          res.sendStatus(200);
        });
    } catch (error) {
      console.error("Error uploading video.");
      console.error((error && error.stack) || error);
      res.status(500).send("An error occurred while uploading the video");
    }
  });

  // Other handlers go here.

  app.listen(port, () => {
    // Starts the HTTP server.
    console.log("Microservice online.");
  });
}

//
// Application entry point.
//
async function main() {
  //
  // Throws an error if the any required environment variables are missing.
  //

  if (!process.env.PORT) {
    throw new Error(
      "Please specify the port number for the HTTP server with the environment variable PORT."
    );
  }

  //
  // Extracts environment variables to globals for convenience.
  //

  const PORT = process.env.PORT;
  const STORAGE_PATH = path.join(__dirname, "../storage");

  startMicroservice(STORAGE_PATH, PORT);
}

if (require.main === module) {
  // Only start the microservice normally if this script is the "main" module.
  main().catch((err) => {
    console.error("Microservice failed to start.");
    console.error((err && err.stack) || err);
  });
} else {
  // Otherwise we are running under test
  module.exports = {
    startMicroservice,
  };
}
