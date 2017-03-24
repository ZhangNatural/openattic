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

var app = angular.module("openattic.users");
app.controller("UsersAddEditCtrl", function ($scope, $state, $stateParams, usersService, $filter, $uibModal, $q,
    Notification) {
  var promises = [];

  $scope.isCurrentUser = false;

  var goToListView = function () {
    $state.go("users");
  };

  if (!$stateParams.user) {
    $scope.editing = false;
    $scope.user = {
      "username": "",
      "email": "",
      "password": "",
      "first_name": "",
      "last_name": "",
      "is_active": false,
      "is_superuser": false,
      "is_staff": false
    };

    $scope.submitAction = function (userForm) {
      $scope.submitted = true;
      if (userForm.$valid === true) {
        usersService.save($scope.user)
            .$promise
            .then(function () {
              goToListView();
            }, function () {
              $scope.userForm.$submitted = false;
            });
      }
    };
  } else {
    $scope.editing = true;

    promises.push(
        usersService.current().$promise
    );
    promises.push(
        usersService.get({id: $stateParams.user}).$promise
    );

    // Use $q.all to wait until all promises have been resolved
    $q.all(promises)
        .then(function (res) {
          if (res[0].id === Number($stateParams.user)) {
            $scope.isCurrentUser = true;
          }
          $scope.user = res[1];
        });

    $scope.submitAction = function (userForm) {
      $scope.submitted = true;
      if (userForm.$valid === true) {
        usersService.update({id: $scope.user.id}, $scope.user)
            .$promise
            .then(function () {
              goToListView();
            }, function () {
              $scope.userForm.$submitted = false;
            });
      }
    };

    $scope.generateAuthToken = function () {
      var modalInstance = $uibModal.open({
        windowTemplateUrl: "templates/messagebox.html",
        templateUrl: "components/users/templates/generate-auth-token.html",
        controller: "UsersModalCtrl",
        resolve: {
          user: function () {
            return $scope.user;
          }
        }
      });
      modalInstance.result.then(function (token) {
        // Display the new token.
        $scope.user.auth_token.token = token;
        // Display a message.
        Notification.success({
          title: "API authentication token",
          msg: "The token has been created successfully."
        });
      });
    };
  }

  $scope.cancelAction = function () {
    goToListView();
  };
});