module.exports = {
    PORT: process.env.PORT || 3000,                               //default port
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',           //default jwt secret
    DB_HOST: process.env.DB_HOST || 'localhost',                  //default db host
    DB_USER: process.env.DB_USER || 'room',                       //default db user
    DB_PASSWORD: process.env.DB_PASSWORD || '123456',             //default db password
    DB_DATABASE: process.env.DB_DATABASE || 'chatroom'            //default db database
  };