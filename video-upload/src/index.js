const express = require("express");
const mongodb = require("mongodb");
const amqp = require("amqplib");
const axios = require("axios");

//
// Broadcasts the "video-uploaded" message to other microservices.
//
function broadcastVideoUploadedMessage(messageChannel, videoMetadata) {
  console.log(`Publishing message on "video-uploaded" exchange.`);

  const msg = { video: videoMetadata };
  const jsonMsg = JSON.stringify(msg);
  messageChannel.publish("video-uploaded", "", Buffer.from(jsonMsg)); // Publishes the message to the "video-uploaded" exchange.
}

//
// Starts the microservice.
//
async function startMicroservice(rabbitHost, port) {
  const messagingConnection = await amqp.connect(rabbitHost); // Connects to the RabbitMQ server.

  const messageChannel = await messagingConnection.createChannel(); // Creates a RabbitMQ messaging channel.

  const app = express();

  //
  // HTTP GET route we can use to check if the service is handling requests.
  //
  app.get("/api/live", (req, res) => {
    res.sendStatus(200);
  });

  //
  // Route for uploading videos.
  //
  app.post("/api/upload", async (req, res) => {
    const fileName = req.headers["file-name"];
    const videoId = new mongodb.ObjectId(); // Creates a new unique ID for the video.

    console.log(
      `Uploading ${req.headers["content-type"]} with name ${fileName} and id ${videoId}`
    );

    const response = await axios({
      // Forwards the request to the videos-storage microservice.
      method: "POST",
      url: "http://videos-storage/api/upload",
      data: req,
      responseType: "stream",
      headers: {
        "content-type": req.headers["content-type"],
        id: videoId,
      },
    });
    response.data.pipe(res);

    // Broadcasts the message to other microservices.
    broadcastVideoUploadedMessage(messageChannel, {
      id: videoId,
      name: fileName,
    });
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

  if (!process.env.RABBIT) {
    throw new Error(
      "Please specify the name of the RabbitMQ host using environment variable RABBIT"
    );
  }

  const PORT = process.env.PORT;
  const RABBIT = process.env.RABBIT;

  await startMicroservice(RABBIT, PORT);
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
