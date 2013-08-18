module.exports = {
  "dist": {
    src: ["vendor/spin.js", "vendor/loader.js", "vendor/list-view.js", "tmp/dist/**/*.js"],
    dest: "dist/adminjs.js",
    options: {
      barename: "adminjs/main",
      namespace: "AJS"
    }
  }
}