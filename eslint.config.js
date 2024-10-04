const config = [
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
      globals: {
        __dirname: "readonly",
        require: "readonly",
      },
    },
    files: ["**/*.js"],
    plugins: ["node"], // Add Node.js plugin
    rules: {
      "node/no-unsupported-features/es-syntax": "error", // Prevent unsupported ES syntax
      "no-console": "warn",
      "prefer-const": "error",
      eqeqeq: "error",
    },
  },
];
