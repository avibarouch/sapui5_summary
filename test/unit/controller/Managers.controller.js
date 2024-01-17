/*global QUnit*/

sap.ui.define([
	"office/controller/Managers.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Managers Controller");

	QUnit.test("I should test the Managers controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
