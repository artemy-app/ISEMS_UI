/**
 * Точка входа для приложения ISEMS_UI
 *
 * Версия 0.2, дата релиза 10.01.2019
 */

"use strict";

const debug = require("debug")("app");

const fs = require("fs");
const async = require("async");
const https = require("https");
const figlet = require("figlet");
const express = require("express");

const app = express();
const config = require("./configure");
const globalObject = require("./configure/globalObject");
const writeLogFile = require("./libs/writeLogFile");
const connectMongoDB = require("./controllers/connectMongoDB");
const createSchemasMongoDB = require("./controllers/createSchemasMongoDB");

/*
const checkConnectClickhouse = require('./libs/check/checkConnectClickhouse');
const checkSourceAvailability = require('./libs/check/checkSourceAvailability');
const websocketClientBrokerAPI = require('./middleware/websocketClientBrokerAPI');
const websocketClientWorkerAPI = require('./middleware/websocketClientWorkerAPI');
*/

const options = {};

const credentials = {
    key: fs.readFileSync("keys/isems_ui_private_key.pem"),
    cert: fs.readFileSync("keys/isems_ui_cert.pem")
};

const server = https.createServer(credentials, app);
const io = require("socket.io").listen(server, options);

//частично наполняем объект globalObject
async.parallel([
    /**
     * устанавливаем соединение с СУБД MongoDB
     */
    (callback) => {

        debug("create connect for MongoDB ");

        connectMongoDB()
            .then(description => {
                return new Promise((resolve, reject) => {
                    process.nextTick(() => {
                        globalObject.setData("descriptionDB", "MongoDB", {
                            "connection": description,
                            "connectionTimestamp": +new Date(),
                            "userName": config.get("mongoDB:user")
                        });

                        let connectDB = globalObject.getData("descriptionDB", "MongoDB", "connection");

                        if (connectDB === null) reject(new Error("the database connection is not established"));
                        else resolve(null);
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {

                    //проверяем наличие и при необходимости создаем схемы MongoDB
                    debug("create MongoDB schemes");

                    createSchemasMongoDB(err => {
                        if (err) reject(err);
                        else resolve(null);
                    });
                });
            }).then(() => {
                return require("./libs/mongodb_requests/getUsersSessionInformation")();
            }).then((listUserSession) => {
                for (let sessionId in listUserSession) {
                    globalObject.setData("users", sessionId, listUserSession[sessionId]);
                }

                //debug(globalObject.getData("users"));

                callback(null);
            }).catch(err => {

                debug("-------------");
                debug(err);
                debug("-------------");

                callback(err);
            });
    },
    /**
 * соединение с модулем ISEMS-NIH
 * модуль сетевого взаимодействия с источниками
 */
    (callback) => {
        debug("модуль сетевого взаимодействия с источниками");
        debug("делаем автоматическое подключение к модулю сет. взаимодействия");
        debug("делаем автоматическое подключение к модулю сет. взаимодействия");
        debug("делаем автоматическое подключение к модулю сет. взаимодействия");

        debug("111111111");
        debug("222222222");
        debug("333333333");

        debug("444444444");
        debug("555555555");
        debug("666666666");

        debug("!!!!!!!!!");

        callback(null);
    },

    /**
     * соединение с API ISEMS-SMM (source messanger master),
     * установка и контроль соединений с сенсорами, создание и сопровождение задач по фильтрации и получении данных
     */
    (callback) => {
        /**
         * 
         * !!! ПОКА ЗАГЛУШКА !!!
         * 
         */

        debug("create connection API ISEMS-SMM (no executed)");

        globalObject.setData("descriptionAPI", "ISEMS-SMM", {
            "connection": null,
            "connectionStatus": false,
            "connectionTimestamp": null
        });

        callback(null);
    },
    /*
     * соединение с API ISEMS-R (recorder)
     * создание и управление карточками компьютерных воздействий
     */
    (callback) => {
        /**
         * 
         * !!! ПОКА ЗАГЛУШКА !!!
         * 
         */

        debug("create connection API ISEMS-R (no executed)");

        globalObject.setData("descriptionAPI", "ISEMS-R", {
            "connection": null,
            "connectionStatus": false,
            "connectionTimestamp": null
        });

        callback(null);
    },
    /**
     * устанавливаем общие настройки приложения
     */
    (callback) => {
        process.nextTick(() => {
            let listFieldActivity = config.get("appSettings:listFieldActivity");
            listFieldActivity.sort();
            listFieldActivity.push("иная деятельность");

            globalObject.setData("commonSettings", "listFieldActivity", listFieldActivity);

            callback(null);
        });
    }
], err => {
    if (err) {

        debug(err);

        console.log("\x1b[31m%s\x1b[0m", "ERROR: the server cannot start, there is an error in the configuration, details in the log file");
        writeLogFile("error", err.toString());

        process.exit(1);
    }

    //    debug(`app settings: ${JSON.stringify(globalObject.getData("commonSettings"))}`);

    //запуск сервера
    server.listen({
        port: config.get("httpServer:port"),
        host: config.get("httpServer:host")
    }, () => {
        figlet.text("ISEMS-UI", (err, title) => {
            if (err) return console.log(err);

            console.log(title);
            console.log("\x1b[32m%s\x1b[0m", "Debug:", `start ISEMS-UI app, server listening on port ${config.get("httpServer:port")}, host ${config.get("httpServer:host")}`);

            writeLogFile("info", `start ISEMS-UI app, server listening on port ${config.get("httpServer:port")}, host ${config.get("httpServer:host")}`);
        });

        //настраиваем сервер
        require("./middleware")(app, express, io);
    });
});