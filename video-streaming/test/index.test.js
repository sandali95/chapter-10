describe("video-streaming microservice", () => {
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
              publish: () => {},
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

  test("microservice starts web server on startup", async () => {
    await startMicroservice("rabbit", 3000);

    expect(mockListenFn.mock.calls.length).toEqual(1);
    expect(mockListenFn.mock.calls[0][0]).toEqual(3000);

    expect(mockGetFn.mock.calls.length).toEqual(2);
    expect(mockGetFn.mock.calls[0][0]).toEqual("/api/live");
    expect(mockGetFn.mock.calls[1][0]).toEqual("/api/video");
  });
});
