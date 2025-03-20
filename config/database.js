const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("whatsapp-pdf-maker", "root", "Meta@123", {
  host: "localhost",
  dialect: "mysql",
  logging: false, 
});

module.exports = sequelize;
