/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

var app = angular.module("openattic.oaWizards");
app.controller("BlockstorageCtrl", function ($scope, HostService, InitiatorService) {
  $scope.limitTypes = ["lun"];

  HostService.query()
      .$promise
      .then(function (res) {
        $scope.hosts = res;
      }, function (error) {
        console.log("An error occurred", error);
      });

  $scope.input = {
    iscsi_fc: {
      lun_id: 0
    },
    volume: {},
    hostSelection: "select"
  };

  $scope.hostDirective = {
    config:{
      header: false,
      class: {
        label: "col-md-2",
        labelOffset: "col-md-offset-2",
        field: "col-md-10"
      }
    },
    submit: {}
  };

  $scope.useThisHost = function (host) {
    if ($scope.input.hostSelection === "create") {
      $scope.input.iscsi_fc.host = host;
    }
    host = $scope.input.iscsi_fc.host;
    if (host) {
      $scope.input.iscsi_fc.create = true;
      InitiatorService.filter({
        host: host.id,
        type: "qla2xxx"
      })
        .$promise
        .then(function (res) {
          $scope.has_initiator = (res.count > 0);
        }, function (error) {
          console.log("An error occured", error);
        });
    } else {
      $scope.input.iscsi_fc.create = false;
    }
  };
});