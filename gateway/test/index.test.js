describe("gateway microservice", () => {
  //
  // Setup mocks.
  //

  const mockListenFn = jest.fn((port, callback) => callback());
  const mockGetFn = jest.fn();
  const mockPostFn = jest.fn();

  jest.doMock("express", () => {
    // Mock the Express module.
    const express = () => {
      // The Express module is a factory function that creates an Express app object.
      return {
        // Mock Express app object.
        listen: mockListenFn, // Mock listen function.
        get: mockGetFn, // Mock get function.
        post: mockPostFn, // Mock post function.
        set: () => {}, // Mock set function.
        use: () => {}, // Mock use function.
      };
    };
    express.json = () => {}; // Mock json function.
    express.static = () => {}; // Mock static function.
    return express;
  });

  //
  // Import the module we are testing.
  //

  const { startMicroservice } = require("../src/index");

  //
  // Tests go here.
  //

  test("microservice starts web server on startup", async () => {
    await startMicroservice(3000);

    expect(mockListenFn.mock.calls.length).toEqual(1);
    expect(mockListenFn.mock.calls[0][0]).toEqual(3000);

    expect(mockGetFn.mock.calls.length).toEqual(6);
    expect(mockGetFn.mock.calls[0][0]).toEqual("/");
    expect(mockGetFn.mock.calls[1][0]).toEqual("/video");
    expect(mockGetFn.mock.calls[2][0]).toEqual("/upload");
    expect(mockGetFn.mock.calls[3][0]).toEqual("/history");
    expect(mockGetFn.mock.calls[4][0]).toEqual("/api/live");
    expect(mockGetFn.mock.calls[5][0]).toEqual("/api/video");

    expect(mockPostFn.mock.calls.length).toEqual(1);
    expect(mockPostFn.mock.calls[0][0]).toEqual("/api/upload");
  });

  test("microservice`s handler /api/live returns 200", async () => {
    await startMicroservice(3000);

    const mockRequest = {};
    const mockSendStatusFn = jest.fn();
    const mockResponse = {
      sendStatus: mockSendStatusFn,
    };

    expect(mockGetFn.mock.calls[4][0]).toEqual("/api/live");
    const apiLiveRouteHandler = mockGetFn.mock.calls[4][1];
    apiLiveRouteHandler(mockRequest, mockResponse);

    expect(mockSendStatusFn.mock.calls.length).toEqual(1);
    expect(mockSendStatusFn.mock.calls[0][0]).toEqual(200);
  });
});
