module.exports = {
  "dist": {
    src: ["vendor/loader.js", "tmp/dist/**/*.js"],
    dest: "dist/adminjs.js",
    options: {
      barename: "adminjs/main",
      namespace: "AJS"
    }
  }
}