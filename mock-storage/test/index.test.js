const path = require("path");

describe("mock-storage microservice", () => {
  const STORAGE_PATH = path.join(__dirname, "../storage");

  const mockListenFn = jest.fn((port, callback) => callback());
  const mockGetFn = jest.fn();
  const mockPostFn = jest.fn();

  jest.doMock("express", () => {
    const express = () => {
      return {
        listen: mockListenFn,
        get: mockGetFn,
        post: mockPostFn,
        use: () => {},
        json: () => {},
      };
    };
    return express;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //
  // Import the module we are testing.
  //

  const { startMicroservice } = require("../src/index");

  //
  // Tests go here.
  //

  test("microservice starts web server on startup", async () => {
    startMicroservice(STORAGE_PATH, 3000);

    expect(mockListenFn).toHaveBeenCalledTimes(1);
    expect(mockListenFn.mock.calls[0][0]).toEqual(3000);

    expect(mockGetFn).toHaveBeenCalledTimes(2);
    expect(mockGetFn.mock.calls[0][0]).toEqual("/api/live");
    expect(mockGetFn.mock.calls[1][0]).toEqual("/api/video");

    expect(mockPostFn).toHaveBeenCalledTimes(1);
    expect(mockPostFn.mock.calls[0][0]).toEqual("/api/upload");
  });

  test("microservice`s handler /api/live returns 200", async () => {
    startMicroservice(STORAGE_PATH, 3000);

    const mockRequest = {};
    const mockSendStatusFn = jest.fn();
    const mockResponse = {
      sendStatus: mockSendStatusFn,
    };

    expect(mockGetFn.mock.calls[0][0]).toEqual("/api/live");
    const apiLiveRouteHandler = mockGetFn.mock.calls[0][1];
    apiLiveRouteHandler(mockRequest, mockResponse);

    expect(mockSendStatusFn).toHaveBeenCalledTimes(1);
    expect(mockSendStatusFn.mock.calls[0][0]).toEqual(200);
  });

  // ... more tests go here ...
});
