module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
    "no-empty": "error",
    "prettier/prettier": [
      "error",
      {
        singleQuote: false, // <- aquí: false = comillas dobles
        semi: true,
        trailingComma: "all",
        endOfLine: "lf"
      }
    ]
  },
  ignorePatterns: ["node_modules/", "dist/", "build/", "build-ts/"]
};

