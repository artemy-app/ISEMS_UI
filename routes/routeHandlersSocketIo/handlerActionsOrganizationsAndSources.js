/**
 * Модуль обработчик действий над организациями, подразделениями и источниками
 * 
 * Версия 0.1, дата релиза 24.03.2020
 */

"use strict";

const debug = require("debug")("handlerOAS");

const async = require("async");

const models = require("../../controllers/models");
const MyError = require("../../libs/helpers/myError");
const commons = require("../../libs/helpers/commons");
const showNotify = require("../../libs/showNotify");
const helpersFunc = require("../../libs/helpers/helpersFunc");
const writeLogFile = require("../../libs/writeLogFile");
const mongodbQueryProcessor = require("../../middleware/mongodbQueryProcessor");
const checkUserAuthentication = require("../../libs/check/checkUserAuthentication");
const informationForPageManagementOrganizationAndSource = require("../../libs/management_settings/informationForPageManagementOrganizationAndSource");

module.exports.addHandlers = function(socketIo) {
    debug("func 'addHandlers', START...");
    
    const handlers = {
        "add new entitys": addNewEntitys,
        "entity information": getEntityInformation,
        "change source info": changeSourceInfo,
        "delete source info": deleteSourceInfo,
        "change division info": changeDivisionInfo,
        "delete division info": deleteDivisionInfo,
        "change organization info": changeOrganizationInfo,
        "delete organization info": deleteOrganizationInfo,
    };

    for (let e in handlers) {
        socketIo.on(e, handlers[e].bind(null, socketIo));
    }
};

//обработчик для добавления новых сущностей
function addNewEntitys(socketIo, data){
    debug("func 'addNewEntitys', START...");
    debug(data);

    /**
            checkUserAuthentication(socketIo)
            .then(authData => {
            //авторизован ли пользователь
                if (!authData.isAuthentication) {
                    throw new MyError("organization and source management", "Пользователь не авторизован.");
                }

                //может ли пользователь создавать нового пользователя
            if (!authData.document.groupSettings.management_users.element_settings.create.status) {
                throw new MyError("organization and source management", "Невозможно добавить нового пользователя. Недостаточно прав на выполнение данного действия.");
            }
        }).then(() => {
            //проверяем параметры полученные от пользователя
            if (!helpersFunc.checkUserSettingsManagementUsers(data.arguments)) {
                throw new MyError("user management", "Невозможно добавить нового пользователя. Один или более заданных параметров некорректен.");
            }
            }).then(() => {

            }).catch(err => {
                if (err.name === "organization and source management") {
                    return showNotify({
                        socketIo: socketIo,
                        type: "danger",
                        message: err.message
                    });
                }

                showNotify({
                    socketIo: socketIo,
                    type: "danger",
                    message: "Внутренняя ошибка приложения. Пожалуйста обратитесь к администратору."
                });

                writeLogFile("error", err.toString());
            });
     */
}

//получить информацию о сущности
function getEntityInformation(socketIo, data){
    //debug("func 'getEntityInformation', START...");
    //debug(data);

    switch(data.actionType){
    case "get info only source":
        //debug("INFORMATION ONLY SOURCE");

        checkUserAuthentication(socketIo)
            .then((authData) => {
                //авторизован ли пользователь
                if (!authData.isAuthentication) {
                    throw new MyError("organization and source management", "Пользователь не авторизован.");
                }
            }).then(() => {
                //проверяем параметры полученные от пользователя
                if (!(commons.getRegularExpression("stringAlphaNumEng")).test(data.arguments.sourceID)) {
                    throw new MyError("organization and source management", "Невозможно получить информацию по источнику. Один или более заданных параметров некорректен.");
                }
            }).then(() => {
                //запрос информации к БД
                debug(`sending information to DB about id: ${data.arguments.entityId}`);

                return new Promise((resolve, reject) => {
                    mongodbQueryProcessor.querySelect(
                        models.modelSourcesParameter, { 
                            query: { id: data.arguments.entityId },
                            select: { _id: 0,  __v: 0, information_about_app: 0, id_division: 0 },
                        }, (err, list) => {
                            if(err) reject(err);
                            else resolve(list);
                        });
                });
            }).then((objInfo) => {
                debug(objInfo);

                socketIo.emit("entity: set info only source", {
                    arguments: objInfo,
                });
            }).catch((err) => {
                if (err.name === "organization and source management") {
                    return showNotify({
                        socketIo: socketIo,
                        type: "danger",
                        message: err.message
                    });
                }

                showNotify({
                    socketIo: socketIo,
                    type: "danger",
                    message: "Внутренняя ошибка приложения. Пожалуйста обратитесь к администратору."
                });

                writeLogFile("error", err.toString());
            });

        break;

    case "get info about source":

        //debug("INFORMATION ABOUT SOURCE");

        checkUserAuthentication(socketIo)
            .then((authData) => {
            //авторизован ли пользователь
                if (!authData.isAuthentication) {
                    throw new MyError("organization and source management", "Пользователь не авторизован.");
                }
            }).then(() => {
            //проверяем параметры полученные от пользователя
                if (!(commons.getRegularExpression("stringAlphaNumEng")).test(data.arguments.sourceID)) {
                    throw new MyError("organization and source management", "Невозможно получить информацию по источнику. Один или более заданных параметров некорректен.");
                }
            }).then(() => {
                //запрос информации к БД
                //debug(`sending information to DB about id: ${data.arguments.entityId}`);

                return new Promise((resolve, reject) => {
                    mongodbQueryProcessor.querySelect(
                        models.modelSourcesParameter, { 
                            query: { id: data.arguments.entityId },
                            select: { _id: 0,  __v: 0 },
                        }, (err, list) => {
                            if(err) reject(err);
                            else resolve(list);
                        });
                }).then((sourceInfo) => {
                    return new Promise((resolve, reject) => {
                        mongodbQueryProcessor.querySelect(
                            models.modelDivisionBranchName, { 
                                query: { id: sourceInfo.id_division },
                                select: { _id: 0,  __v: 0 },
                            }, (err, list) => {
                                if(err) reject(err);
                                else resolve({ source: sourceInfo, division: list });
                            });
                    });
                }).then((objInfo) => {
                    return new Promise((resolve, reject) => {
                        mongodbQueryProcessor.querySelect(
                            models.modelOrganizationName, { 
                                query: { id: objInfo.division.id_organization },
                                select: { _id: 0,  __v: 0 },
                            }, (err, list) => {
                                if(err) reject(err);
                        
                                objInfo.organization = list;
                                resolve(objInfo);
                            });
                    });
                });        
            }).then((objInfo) => {
                //debug(objInfo);

                socketIo.emit("entity: set info about source", {
                    arguments: objInfo,
                });
            }).catch((err) => {
                if (err.name === "organization and source management") {
                    return showNotify({
                        socketIo: socketIo,
                        type: "danger",
                        message: err.message
                    });
                }

                showNotify({
                    socketIo: socketIo,
                    type: "danger",
                    message: "Внутренняя ошибка приложения. Пожалуйста обратитесь к администратору."
                });

                writeLogFile("error", err.toString());
            });

        break;

    case "get info about organization or division":

        debug("INFORMATION ABOUT ORGANIZATION OR DIVISION");

        break;
    }
}

//изменить информацию об источнике
function changeSourceInfo(socketIo, data){
    debug("func 'changeSourceInfo', START...");
    debug(data);

    let checkSourceValue = (obj, callback) => {
        let commonPattern = {
            "id": {
                "namePattern": "stringAlphaNumEng",
                "messageError": "принят некорректный идентификатор источника",
            },
            "source_id": {
                "namePattern": "hostID",
                "messageError": "идентификатор источника не является числом",
            },
            "short_name": {
                "namePattern": "shortNameHost",
                "messageError": "обнаружен недопустимый символ в кратком названии организации",
            },
        };
    
        let networkPattern = {
            "ipaddress": {
                "namePattern": "ipaddress",
                "messageError": "принят некорректный ip адрес",
            },
            "port": {
                "namePattern": "port",
                "messageError": "принят некорректный порт",
            },
            "token_id": {
                "namePattern": "stringAlphaNumEng",
                "messageError": "принят некорректный идентификационный токен",
            },
        };
    
        //проверяем наличие всех элементов
        for(let elemName in commonPattern){
            if(typeof obj[elemName] === "undefined"){
                return callback(new Error("отсутствует некоторая информацией об источнике"));
            }
    
            if(!helpersFunc.checkInputValidation({
                name: commonPattern[elemName].namePattern,
                value: obj[elemName],
            })){
                return callback(commonPattern[elemName].messageError);
            }
        }
    
        //проверяем сетевые настройки источника
        for(let elemName in networkPattern){
            if(obj.network_settings[elemName] === "undefined"){           
                return new Error("отсутствует некоторая информация, необходимая для осуществления сетевого соединения с источником");
            }
    
            if(!helpersFunc.checkInputValidation({
                name: networkPattern[elemName].namePattern,
                value: obj.network_settings[elemName]
            })){
                return callback(networkPattern[elemName].messageError);
            }
        }
    
        // проверяем параметры источника
        let tacs = obj.source_settings.type_architecture_client_server;
        if((typeof tacs === "undefined") || (tacs !== "server")){
            obj.source_settings.type_architecture_client_server = "client";
        }
    
        let tt = obj.source_settings.transmission_telemetry;
        if((typeof tt === "undefined") || (!tt)){
            obj.source_settings.transmission_telemetry = false;
        } else {
            obj.source_settings.transmission_telemetry = true;
        }
    
        let mnsfp = obj.source_settings.maximum_number_simultaneous_filtering_processes;
        if((typeof mnsfp === "undefined") || (+mnsfp <= 0 || +mnsfp > 10)){
            obj.source_settings.maximum_number_simultaneous_filtering_processes = 5;    
        }
    
        let tclp = obj.source_settings.type_channel_layer_protocol;
        if((typeof tclp === "undefined") || (tclp != "pppoe")){
            obj.source_settings.type_channel_layer_protocol = "ip";    
        }
    
        let ldwfnt = obj.source_settings.list_directories_with_file_network_traffic;
        if(typeof ldwfnt === "undefined"){
            return callback(new Error("не заданы директории в которых выполняется фильтрация сет. трафика"));
        }
        let newListFolder = ldwfnt.filter((folder) => helpersFunc.checkInputValidation({
            name: "folderStorage",
            value: folder,
        }));
        obj.source_settings.list_directories_with_file_network_traffic = newListFolder;
    
        //проверяем поле description
        if(!helpersFunc.checkInputValidation({ 
            name: "inputDescription", 
            value: obj.description,
        })){
            obj.description = "";
        }
        
        callback(null, obj);
    };

    checkUserAuthentication(socketIo)
        .then((authData) => {
            //debug("авторизован ли пользователь");

            //авторизован ли пользователь
            if (!authData.isAuthentication) {
                throw new MyError("organization and source management", "Пользователь не авторизован.");
            }

            //debug("может ли пользователь изменять информацию об источнике");

            //может ли пользователь изменять информацию об источнике
            if (!authData.document.groupSettings.management_organizations_and_sources.element_settings.management_sources.element_settings.edit.status) {
                throw new MyError("organization and source management", "Невозможно изменить информацию об источнике. Недостаточно прав на выполнение данного действия.");
            }
        }).then(() => {
            
            //debug("проверяем параметры полученные от пользователя");
            
            //проверяем параметры полученные от пользователя
            return new Promise((resolve, reject) => {
                checkSourceValue(data, (err, validData) => {
                    if(err){
                        reject(new MyError("organization and source management", err.toString()));
                    } else {
                        resolve(validData);
                    }
                });
            });
        }).then((validData) => {
            
            //debug("обновляем информацию в БД");
            //debug(validData);

            //обновляем информацию в БД
            return new Promise((resolve, reject) => {
                mongodbQueryProcessor.queryUpdate(models.modelSourcesParameter, {
                    query: { id: validData.id },
                    update: {
                        source_id: validData.source_id,
                        date_change: +(new Date),
                        short_name: validData.short_name,
                        description: validData.description,
                        network_settings: validData.network_settings,
                        source_settings: validData.source_settings,
                    },
                }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }).then(() => {

            //debug("получаем новый краткий список с информацией по источникам");

            //получаем новый краткий список с информацией по источникам
            return new Promise((resolve, reject) => {
                informationForPageManagementOrganizationAndSource((err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }).then((shortSourceList) => {           
            //отправляем новый список в интерфейс
            //debug("отправляем новый список в интерфейс");
            //debug("------ RESIVED NEW shortSourceList ------");
            //debug(shortSourceList);

            socketIo.emit("entity: new short source list", {
                arguments: shortSourceList,
            });            

        }).catch((err) => {
            //debug("ERROR-------------------------");
            //debug(err);

            if (err.name === "organization and source management") {
                return showNotify({
                    socketIo: socketIo,
                    type: "danger",
                    message: err.message
                });
            }

            showNotify({
                socketIo: socketIo,
                type: "danger",
                message: "Внутренняя ошибка приложения. Пожалуйста обратитесь к администратору."
            });

            writeLogFile("error", err.toString());        
        });
}

//удалить всю информацию по источнику
function deleteSourceInfo(socketIo, data){
    debug("func 'deleteSourceInfo', START...");
    debug(data);

    checkUserAuthentication(socketIo)
        .then((authData) => {
            debug("авторизован ли пользователь");

            //авторизован ли пользователь
            if (!authData.isAuthentication) {
                throw new MyError("organization and source management", "Пользователь не авторизован.");
            }

            debug("может ли пользователь удалять информацию об источнике");

            //может ли пользователь изменять информацию об источнике
            if (!authData.document.groupSettings.management_organizations_and_sources.element_settings.management_sources.element_settings.delete.status) {
                throw new MyError("organization and source management", "Невозможно удалить выбранные источники. Недостаточно прав на выполнение данного действия.");
            }
        }).then(() => {
            //удаляем выбранные источники
            debug("удаляем выбранные источники");
            
            return Promise.all(data.arguments.listSource.map((item) => {
                
                debug(`delete source id ${item}`);

                return new Promise((resolve, reject) => {
                    mongodbQueryProcessor.queryDelete(models.modelSourcesParameter, {
                        query: { "source_id": item },
                    }, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }));
        }).then(() => {

            debug("получаем новый краткий список с информацией по источникам");

            //получаем новый краткий список с информацией по источникам
            return new Promise((resolve, reject) => {
                informationForPageManagementOrganizationAndSource((err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }).then((shortSourceList) => {           
            //отправляем новый список в интерфейс
            debug("отправляем новый список в интерфейс");
            debug("------ RESIVED NEW shortSourceList ------");
            //debug(shortSourceList);

            socketIo.emit("entity: new short source list", {
                arguments: shortSourceList,
            });            

        }).catch((err) => {
            debug("ERROR-------------------------");
            debug(err);

            if (err.name === "organization and source management") {
                return showNotify({
                    socketIo: socketIo,
                    type: "danger",
                    message: err.message
                });
            }

            showNotify({
                socketIo: socketIo,
                type: "danger",
                message: "Внутренняя ошибка приложения. Пожалуйста обратитесь к администратору."
            });

            writeLogFile("error", err.toString());        
        });
}

//изменить информацию о подразделении
function changeDivisionInfo(socketIo, data){
    debug("func 'changeDivisionInfo', START...");
    debug(data);
}

//удалить всю информацию о подразделении
function deleteDivisionInfo(socketIo, data){
    debug("func 'deleteDivisionInfo', START...");
    debug(data);
}

//изменить информацию об организации
function changeOrganizationInfo(socketIo, data){
    debug("func 'changeOrganizationInfo', START...");
    debug(data);
}

//удалить всю информацию об организации
function deleteOrganizationInfo(socketIo, data){
    debug("func 'deleteOrganizationInfo', START...");
    debug(data);
}
