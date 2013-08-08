module.exports = {
  "app": {
    options: {
      templateName: function(filename) {
        return filename.replace(/app\/templates\//,'').replace(/\.(hbs|hjs|handlebars)/,'');
      }
    },
    files: {
      "tmp/public/assets/templates.js": "app/templates/**/*.{hbs,hjs,handlebars}"
    }
  },
  "lib": {
    options: {
      templateName: function(filename) {
        return filename.replace(/lib\/templates\//,'').replace(/\.(hbs|hjs|handlebars)/,'');
      }
    },
    files: {
      "tmp/lib/templates.js": "app/templates/**/*.{hbs,hjs,handlebars}"
    }
  }
};
