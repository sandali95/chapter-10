describe("history microservice", () => {
  //
  // Setup mocks.
  //

  const mockListenFn = jest.fn((port, callback) => callback());
  const mockGetFn = jest.fn();

  jest.doMock("express", () => {
    // Mock the Express module.
    const express = () => {
      // The Express module is a factory function that creates an Express app object.
      return {
        // Mock Express app object.
        listen: mockListenFn, // Mock listen function.
        get: mockGetFn, // Mock get function.
        use: () => {}, // Mock use function.
      };
    };
    express.json = () => {}; // Mock json function.
    return express;
  });

  const mockHistoryCollection = {
    // Mock Mongodb collection.
  };

  const mockDb = {
    // Mock Mongodb database.
    collection: () => {
      return mockHistoryCollection;
    },
  };

  const mockMongoClient = {
    // Mock Mongodb client object.
    db: () => {
      return mockDb;
    },
  };

  jest.doMock("mongodb", () => {
    // Mock the Mongodb module.
    return {
      // Mock Mongodb module.
      MongoClient: {
        // Mock MongoClient.
        connect: async () => {
          // Mock connect function.
          return mockMongoClient;
        },
      },
    };
  });

  jest.doMock("amqplib", () => {
    // Mock the amqplib (RabbitMQ) library.
    return {
      // Returns a mock version of the library.
      connect: async () => {
        // Mock function to connect to RabbitMQ.
        return {
          // Returns a mock "messaging connection".
          createChannel: async () => {
            // Mock function to create a messaging channel.
            return {
              // Returns a mock "messaging channel".
              assertExchange: async () => {},
              assertQueue: async () => {
                return {
                  queue: "my-queue", // Fake name for anonymous queue.
                };
              },
              bindQueue: async () => {},
              consume: () => {},
            };
          },
        };
      },
    };
  });

  //
  // Import the module we are testing.
  //

  const { startMicroservice } = require("../src/index");

  //
  // Tests go here.
  //

  test("microservice can handle requests", async () => {
    await startMicroservice(
      "mongodb://localhost:27017",
      "metadata-test",
      "rabbit",
      3000
    );

    expect(mockListenFn.mock.calls.length).toEqual(1);
    expect(mockListenFn.mock.calls[0][0]).toEqual(3000);

    expect(mockGetFn.mock.calls.length).toEqual(2);
    expect(mockGetFn.mock.calls[0][0]).toEqual("/api/live");
    expect(mockGetFn.mock.calls[1][0]).toEqual("/api/history");
  });

  test("microservice`s handler /api/live returns 200", async () => {
    await startMicroservice(3000);

    const mockRequest = {};
    const mockSendStatusFn = jest.fn();
    const mockResponse = {
      sendStatus: mockSendStatusFn,
    };

    expect(mockGetFn.mock.calls[0][0]).toEqual("/api/live");
    const apiLiveRouteHandler = mockGetFn.mock.calls[0][1];
    apiLiveRouteHandler(mockRequest, mockResponse);

    expect(mockSendStatusFn.mock.calls.length).toEqual(1);
    expect(mockSendStatusFn.mock.calls[0][0]).toEqual(200);
  });

  test("/api/history route is handled", async () => {
    await startMicroservice(
      "mongodb://localhost:27017",
      "metadata-test",
      "rabbit",
      3000
    );

    const apiHistoryRoute = mockGetFn.mock.calls[1][0];
    expect(apiHistoryRoute).toEqual("/api/history");
  });
});
