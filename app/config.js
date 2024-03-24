const path = require("path");
const dotenv = require("dotenv");
const crypto = require("crypto-random-string");

class Config {
  constructor() {
    this.root = path.normalize(path.join(__dirname, "/.."));
    this.rootPath = process.env.ROOT_PATH || "/";
    this.port = parseInt(process.env.PORT) || 3000;
    this.server_cache = true;
    this.app_key = process.env.APP_KEY || null;
    this.app_secret = process.env.APP_SECRET || null;
    this.app_version = require("../package").version;
    this.salt = process.env.SALT || crypto({ length: 10, type: "base64" });
    this.qm_key = process.env.QM_API_KEY || null;
  }
}

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const config = new Config();

module.exports = config;
