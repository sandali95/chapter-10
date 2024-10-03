const express = require("express");
const amqp = require("amqplib");
const axios = require("axios");

//
// Broadcasts the "viewed" message to other microservices.
//
function broadcastViewedMessage(messageChannel, videoPath) {
  console.log(`Publishing message on "viewed" exchange.`);

  const msg = { videoPath: videoPath };
  const jsonMsg = JSON.stringify(msg);
  messageChannel.publish("viewed", "", Buffer.from(jsonMsg)); // Publishes message to the "viewed" exchange.
}

//
// Starts the microservice.
//
async function startMicroservice(rabbitHost, port) {
  console.log(`Connecting to RabbitMQ server at ${rabbitHost}.`);
  const messagingConnection = await amqp.connect(rabbitHost);

  console.log("Connected to RabbitMQ.");
  const messageChannel = await messagingConnection.createChannel();
  await messageChannel.assertExchange("viewed", "fanout");

  const app = express();

  //
  // HTTP GET route we can use to check if the service is handling requests.
  //
  app.get("/api/live", (req, res) => {
    res.sendStatus(200);
  });

  app.get("/api/video", async (req, res) => {
    // Route for streaming video.
    try {
      console.log(`Streaming video with id: ${req.query.id}`);

      const videoId = req.query.id;
      const response = await axios({
        // Forwards the request to the video-storage microservice.
        method: "GET",
        url: `http://videos-storage/api/video?id=${videoId}`,
        data: req,
        responseType: "stream",
      });
      response.data.pipe(res);

      broadcastViewedMessage(messageChannel, videoId); // Sends the "viewed" message to indicate this video has been watched.
    } catch (error) {
      console.error("Error streaming video.");
      console.error((error && error.stack) || error);
      res.status(500).send("An error occurred while streaming the video");
    }
  });

  //
  // Starts the HTTP server.
  //
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

  //
  // Extracts environment variables to globals for convenience.
  //

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
