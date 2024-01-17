sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/MessageToast",
    "sap/ui/layout/VerticalLayout",
    ],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Column, Text, MessageToast) {

        "use strict";
        var oModel;
        //___________________________________________________________________________________________Callback functions
        return Controller.extend("office.controller.Managers", {
            onInit: function () {
                var managerTableHeaders = [
                        { property:     "ManagerId",    label: "Employee Id"    },      
                        { property:     "firstName",    label: "First Name"     },
                        { property:     "lastName",     label: "Last Name"      },
                        { property:     "birthdate",    label: "Birthdate"      },
                        { property:     "gender",       label: "Gender"         },
                        { property:     "departmentId", label: "Department Id"  },
                        { property:     "showEmployees",label: "button"         }
                    ],
                    employeeTableHeaders = [
                        { property:     "employeeId",   label: "Employee Id"    },
                        { property:     "firstName",    label: "First Name"     },
                        { property:     "lastName",     label: "Last Name"      },
                        { property:     "birthdate",    label: "Birthdate"      },
                        { property:     "gender",       label: "Gender"         },
                        { property:     "departmentId", label: "Department Id"  },
                        { salaryAmount: "positionId",   label: "Position Id"    },
                    ],
                    genders = [
                        { key: "M",     text: "Male"    },
                        { key: "F",     text: "Female"  },
                        { key: "O",     text: "Other"   }
                    ];

                oModel = new JSONModel({
                    managerTableHeaders:    managerTableHeaders,
                    employeeTableHeaders:   employeeTableHeaders,
                    genders:                genders,
                    newEmployee:            {}
                });

                this.getView().setModel(oModel); 
                this.createColumns(managerTableHeaders, "managersTableId");
                this.createColumns(employeeTableHeaders, "employeesTableId");
                this.setDataToTheModel("/ManagerSet()", "/managerTableData");
                this.setDataToTheModel("/PositionSet()","/positions");
            },
//-------------------------------------------------------------------------------------------------------------------------------------------------onInit function End

            createColumns: function (headers, tableId) {
                var oTable = this.getView().byId(tableId); 
                headers.forEach(function (header) {
                  var oColumn = new Column({
                    header: new Text({ text: header.label }),
                  });
                  oTable.addColumn(oColumn);
                });
            },

            setDataToTheModel:  function(sQuery,sDataName){
                this.getOwnerComponent().getModel().read(sQuery, {
                    success: function(oData){
                        oModel.setProperty(sDataName, oData.results);
                    },
                    error: function(){
                        console.log('Error:',error)
                    }
                });
            },

            formatText: function(value) {
                return value.replace(/ /g, '&nbsp;');
            },

            getText:    function(text){
                return this.getView().getModel("i18n").getResourceBundle().getText(text);
            },

            onShowEmployees: function(oEvent){
                let managerId = oEvent.getSource().getBindingContext().getObject().ManagerId;
                let departmentId = oEvent.getSource().getBindingContext().getObject().DepartmentId;
                this.byId("addEmployeeButtonId").setEnabled;
                var that =this;
                oModel.setProperty("/newEmployee/DepartmentId", departmentId);
                this.getOwnerComponent().getModel().read(`/ManagerSet(ManagerId='${managerId}',DepartmentId='${departmentId}')` , {
                    urlParameters: {
                        "$expand": `Employees`,
                        //"$select": "LineID,ToCells/CellID,...", // reduce data load
                    },
                    success: function(oData){
                        oModel.setProperty("/employeetableData", oData.Employees.results);
                    },
                    error: function(error){
                        that.errorMessage(error);
                    }
                });
            },

            errorMessage:   function(error){
                MessageToast.show(
                    this.getText("errorCode") + "\u00a0" +  error.statusCode + "\n" 
                    + this.getText("message") + "\u00a0" +  error.message
                , {at: "center center"});
            },
            
            onAddEmployee: function (selectedItemData) {
                if (!oModel.getProperty("/newEmployee/DepartmentId")) {
                    MessageToast.show(this.getText("pleaseFirstPressOnOneOfTheShowEmployeesButtonsAbove"), {at: "center center"})
                    return
                };
                var oView = this.getView();
                var oDialog = oView.byId("addEmployeePopupFragment");   
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(oView.getId(), "office.view.popup", this);
                    oView.addDependent(oDialog);
                }
                var selectedDataModel = new JSONModel(selectedItemData)
                oDialog.setModel(selectedDataModel, 'selectedModel')
                oDialog.open()
            },

            onComboBoxCange:    function(oEvent){
                var newval = oEvent.getParameter("newValue");
                var key = oEvent.getSource().getSelectedItem();
                if (newval !== "" && key === null){
                  oEvent.getSource().setValue("");
                  oEvent.getSource().setValueState("Error");
                }else{
                  oEvent.getSource().setValueState("None");
                }
            },

            onDatePickerChange:     function(oEvent){
                var isValid = oEvent.getParameter("valid");
                if (!isValid)  {oEvent.getSource().setValueState("Error")}
                else oEvent.getSource().setValueState("None")
            },

            isValidationPopoData: function(){
                let oView       = this.getView();
                let firstName   = oView.byId("IDfirstNameInput");
                let lastName    = oView.byId("IDlastNameInput");
                let birthDate   = oView.byId("IDbirthdateInput");
                let gender      = oView.byId("IDgenderInput");
                let position    = oView.byId("IDpositionInput");
                if  (
                        !firstName.getValue()   ||  firstName.getValueState()   ==  "Error" ||  
                        !lastName.getValue()    ||  lastName.getValueState()    ==  "Error" ||  
                        !birthDate.getValue()   ||  birthDate.getValueState()   ==  "Error" ||
                        !gender.getValue()      ||  gender.getValueState()      ==  "Error" ||
                        !position.getValue()    ||  position.getValueState()    ==  "Error"
                    ){
                    MessageToast.show(this.getText("AllFieldsAreMandatoryPleaseCorrectTheData"), {at: "center center"});
                    return false;
                }
                else return true;
            },

            onPopupAddEmployeesBtn:    function(oEvent){
                if (!this.isValidationPopoData()) {return};
                let oNewEmployee = oModel.getProperty("/newEmployee");
                let oHeaders = "application/json; charset=utf-8";
                var that = this;
                this.getOwnerComponent().getModel().create(`/EmployeeSet()`, oNewEmployee, {
                    headers: oHeaders, 
                    success: function (oData, response) {
                        let aDepartmetEmployees = oModel.getProperty("/employeetableData");
                        aDepartmetEmployees.push(oData);
                        oModel.setProperty("/employeetableData", aDepartmetEmployees);
                        sap.m.MessageBox.success(response.statusText, {
                            title: "Success",
                            onClose: null,
                            styleClass: "",
                            actions: sap.m.MessageBox.Action.OK,
                            emphasizedAction: sap.m.MessageBox.Action.OK,
                            initialFocus: null,
                            textDirection: sap.ui.core.TextDirection.Inherit
                        });
                        let departmentID = oModel.getProperty("/newEmployee/DepartmentId");
                        oModel.setProperty("/newEmployee", {});
                        oModel.setProperty("/newEmployee/DepartmentId", departmentID);
                        this.onClosePopup();
                    }.bind(this),
                    error: function (oError) {
                        that.errorMessage(oError);
                    }
                });
            },

            onClosePopup: function () {
                this.getView().byId("addEmployeePopupFragment").close()
            },
        });
    }
);
