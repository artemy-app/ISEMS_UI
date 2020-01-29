import React from "react";
import { Button, Form } from "react-bootstrap";
import PropTypes from "prop-types";

import ModalWindowAddEntity from "../../modalwindows/modalWindowAddEntity.jsx";

class ButtonSaveNewEntity extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        if(!this.props.showButton){
            return <div></div>;
        }

        return <Button onClick={this.props.handler} variant="outline-success" size="sm">сохранить</Button>;
    }
}

ButtonSaveNewEntity.propTypes = {
    showButton: PropTypes.bool,
    handler: PropTypes.func.isRequired,
};

export default class CreateBodyNewEntity extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            addedNewEntity: false,
            showModalWindow: false,
            chosenDivisionID: null,
            chosenOrganizationID: null,
            listOrganizationName: this.createListOrganization.call(this),
            listDivisionName: this.createListDivision.call(this),
            listNewEntity: [],
        };

        this.modalWindowSettings = {
            listFieldActivity: this.getListFieldActivity.call(this),
        };


        this.handlerAddEntity = this.handlerAddEntity.bind(this);
        this.handelrButtonAdd = this.handelrButtonAdd.bind(this);
        this.closeModalWindow = this.closeModalWindow.bind(this);

        this.createNewDivision = this.createNewDivision.bind(this);
        this.createNewOrganization = this.createNewOrganization.bind(this);
        
        this.createListElementDivision = this.createListElementDivision.bind(this);
        this.createListElementOrganization = this.createListElementOrganization.bind(this);
    }

    getListFieldActivity(){
        let objTmp = {};
        for(let source in this.props.listSourcesInformation){
            objTmp[this.props.listSourcesInformation[source].fieldActivity] = "";
        }

        return objTmp;
    }

    isDisabledDelete(){

        /**
        * Проверить добавилась ли новая сущность!!!
        */

        let isChecked = false;

        return (isChecked) ? "" : "disabled";
    }

    handelrButtonAdd(){
        let typeEntity = "source";

        if(this.state.chosenOrganizationID === null){
            typeEntity = "organization";
        } else if(this.state.chosenOrganizationID !== null && this.state.chosenDivisionID === null){
            typeEntity = "division";
        }

        this.showModalWindow.call(this, typeEntity);
    }

    showModalWindow(typeEntity){

        console.log(`Открыто модальное окно для сущности '${typeEntity}'`);

        const listTypeEntity = {
            "organization": {
                name: "организацию",
            },
            "division": {
                name: "подразделение или филиал",
            },
            "source": {
                name: "источник",
            },
        };

        this.resultBody = this.resultBody.bind(this);
        this.sendInfoNewEntity = this.sendInfoNewEntity.bind(this);

        this.modalWindowSettings.type = typeEntity;
        this.modalWindowSettings.name = listTypeEntity[typeEntity].name;
        
        this.setState({ showModalWindow: true });    
    }

    closeModalWindow(){
        this.setState({ showModalWindow: false });
    }

    selectedOrganization(e){

        console.log(`Была выбрана организация с ID: ${e.target.value}`);

        this.setState({ chosenOrganizationID: e.target.value });
    }

    selectedDivision(e){

        console.log(`Была выбрано подразделение с ID: ${e.target.value}`);

        this.setState({ chosenDivisionID: e.target.value });
    }

    createListOrganization(){
        console.log("createListOrganization START...");

        let listTmp = {};
        for(let source in this.props.listSourcesInformation){
            listTmp[this.props.listSourcesInformation[source].organization] = this.props.listSourcesInformation[source].oid;
        }

        return listTmp;
    }

    createListDivision(){
        console.log("createListDivision START...");

        let listTmp = {};
        for(let source in this.props.listSourcesInformation){
            listTmp[this.props.listSourcesInformation[source].division] = {
                did: this.props.listSourcesInformation[source].did,
                oid: this.props.listSourcesInformation[source].oid,
            };
        }

        return listTmp;
    }

    createListElementOrganization(){
        let selectForm = "";
        let lsi = this.state.listOrganizationName;

        let listName = Object.keys(lsi);
        listName.sort();

        let listOptions = listName.map((name) => {
            return <option value={lsi[name]} key={`select_${lsi[name]}_option`}>{name}</option>;
        });

        selectForm = <Form.Group onChange={this.selectedOrganization.bind(this)} controlId={"select_list_organization"}>
            <Form.Label>Организация</Form.Label>
            <Form.Control as="select" size="sm">
                <option value="all" key={"select_organization_option_none"}>добавить организацию</option>
                {listOptions}
            </Form.Control>
        </Form.Group>;

        return selectForm;
    }

    createListElementDivision(){
        let selectForm = "";       
        let lsi = {};
       
        for(let nameDivision in this.state.listDivisionName){
            if(this.state.chosenOrganizationID === null || this.state.chosenOrganizationID === "all"){
                lsi[nameDivision] = this.state.listDivisionName[nameDivision].did;

                continue;
            }

            if(this.state.chosenOrganizationID === this.state.listDivisionName[nameDivision].oid){
                lsi[nameDivision] = this.state.listDivisionName[nameDivision].did;
            }
        }        

        let listName = Object.keys(lsi);
        listName.sort();

        let listOptions = listName.map((name) => {
            return <option value={lsi[name]} key={`select_${lsi[name]}_option`}>{name}</option>;
        });

        selectForm = <Form.Group onChange={this.selectedDivision.bind(this)} controlId={"select_list_division"}>
            <Form.Label>Подразделение или филиал организации</Form.Label>
            <Form.Control as="select" size="sm">
                <option value={null} key={"select_division_option_none"}>добавить подразделение</option>
                {listOptions}
            </Form.Control>
        </Form.Group>;

        return selectForm;
    }

    handlerAddEntity(objInfo){
        console.log("func 'handlerAddButton', START...");
        console.log(objInfo);

        switch(objInfo.windowType){
        case "organization":
            this.createNewOrganization(objInfo.options);
            
            break;

        case "division":
            this.createNewDivision(objInfo.options);

            break;

        case "source":

        }

        console.log("func 'handlerAddButton', END...");
    }

    createNewOrganization(options){
        /**
  windowType: this.props.settings.type,
                options: {
                    id: helpers.tokenRand(),
                    organizationName: settings.organizationSettings.organizationName.value,
                    legalAddress: settings.organizationSettings.legalAddress.value,
                    fieldActivity: settings.organizationSettings.fieldActivity.value,
                }, 
 */

        //обновляем список организаций
        let updateOrgName = this.state.listOrganizationName;
        updateOrgName[options.organizationName] = options.id;
        this.setState({ listOrganizationName: updateOrgName });

        let listNewEntity = this.state.listNewEntity;
        listNewEntity.push({
            name: options.organizationName, // название организации (String) а-Я0-9"'.,()-
            legal_address: options.legalAddress, // юридический адрес (String) а-Я0-9.,
            field_activity: options.fieldActivity, // род деятельности (String) из заданных значений или значение по умолчанию
            division_or_branch_list_id: [] // массив с объектами типа addDivision            
        });
        this.setState({ listNewEntity: listNewEntity });
    }

    sendInfoNewEntity(){
        console.log("Отправляем информацию о новых сущностях");
    }

    createNewDivision(options){
        console.log("func 'createNewDivision', START...");
        console.log(options);
    }

    resultBody(){
        /*
    Examlpe object:

        "Описание организации": {
            name: "", // название организации (String) а-Я0-9"'.,()-
            legal_address: "", // юридический адрес (String) а-Я0-9.,
            field_activity: "", // род деятельности (String) из заданных значений или значение по умолчанию
            division_or_branch_list_id: [] // массив с объектами типа addDivision
        }

        "Описание филиала или подразделения организации": {
            id_organization: "", // уникальный идентификатор организации (String) a-Z0-9
            name: "", // название филиала или подразделения организации (String) а-Я0-9"'.,()-
            physical_address: "", // физический адрес (String) а-Я0-9.,
            description: "", // дополнительное описание (String) а-Я0-9"'.()-
            source_list: [], // массив с объектами типа addSource
        }

        "Описание источника обработки файлов, установленного в филиала или подразделения организации": {
            id_division: "", // уникальный идентификатор филиала или подразделения организации (String) a-Z0-9
            source_id: "", // уникальный идентификатор источника (Number) 0-9
            short_name: "", // краткое название источника (String) a-Z-_0-9
            network_settings: { // сетевые настройки для доступа к источнику
                ipaddress: "", // ip адрес (String) Проверка ip адреса на корректность
                port: 0, // сетевой порт (Number) 0-9 и диапазон 1024-65565
                token_id: "", // идентификационный токен (String) a-Z0-9
            },
            source_settings: { // настройки источника 
                type_architecture_client_server: "", // тип клиент серверной архитектуры (источник работает в режиме клиент или сервер) (String) a-z
                transmission_telemetry: false, // отправка телеметрии (Bool) BOOL
                maximum_number_simultaneous_filtering_processes: 0, // максимальное количество одновременных процессов фильтрации (Number) 0-9 и диапазон 1-10
                type_channel_layer_protocol: "", // тип протокола канального уровня (String) tcp/udp/any
                list_directories_with_file_network_traffic: [], // список директорий с файлами сетевого трафика, длинна массива не должна быть 0, массив
                 содержит сторки с символами /\_a-Z0-9
            },
            description: "", // дополнительное описание (String) а-Я0-9"'.,()-
        }
    */

        return this.state.listNewEntity.map((item) => {
            return <div key={`new_org_id_${item.id}`}>{item.name}<div>{JSON.stringify(item.division_or_branch_list_id)}</div></div>;
        });
    }

    render(){
        return (
            <React.Fragment>
                <br/>
                <div className="row">
                    <div className="col-md-12 text-left">
                        <Form>
                            {this.createListElementOrganization()}
                            {this.createListElementDivision()}
                        </Form>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12 text-right">
                        <Button size="sm" variant="outline-primary" onClick={this.handelrButtonAdd}>добавить</Button>
                    </div>
                </div>
                <div className="row">
                    <br/>
                    {this.resultBody()}
                    
                </div>
                <div className="row">
                    <div className="col-md-12 text-right">
                        <ButtonSaveNewEntity handler={this.sendInfoNewEntity} showButton={this.state.addedNewEntity} />
                    </div>
                </div>

                <ModalWindowAddEntity 
                    show={this.state.showModalWindow}
                    onHide={this.closeModalWindow}
                    settings={this.modalWindowSettings} 
                    handlerAddButton={this.handlerAddEntity} />
            </React.Fragment>
        );
    }
}

CreateBodyNewEntity.propTypes ={
    listSourcesInformation: PropTypes.object.isRequired,
};