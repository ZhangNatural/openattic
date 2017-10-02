/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

var app = angular.module("openattic.settings");
app.component("settingsForm",  {
  template: require("./settings-form.component.html"),
  bindings: {
  },
  controller: function ($scope, $state, $timeout, $q, settingsFormService, cephClusterService, hostsService,
      Notification) {
    var self = this;

    const animationTimeout = 300;

    self.model = {
      deepsea: {},
      rgw: {},
      grafana: {},
      ceph: {}
    };

    self.clustersKeyringCandidates = {};

    var defaultRgwDeepseaSettings = {
      managed_by_deepsea: true
    };
    self.rgwDeepseaSettings = angular.copy(defaultRgwDeepseaSettings);
    self.managedByDeepSeaEnabled = true;

    self.deepseaConnectionStatus = undefined;
    self.rgwConnectionStatus = undefined;
    self.grafanaConnectionStatus = undefined;

    self.$onInit = function () {
      settingsFormService.get()
        .$promise
        .then(function (res) {
          self.model = res;
          if (!self.model.rgw.managed_by_deepsea) {
            self.managedByDeepSeaEnabled = false;
          }
          angular.forEach(self.model.ceph, function (cluster) {
            self.checkCephConnection(cluster);
            cephClusterService.keyringCandidates(cluster)
              .$promise
              .then(function (result) {
                self.clustersKeyringCandidates[cluster.fsid] = result;
              });
          });
          self.checkDeepSeaConnection();
          self.checkGrafanaConnection();
        })
        .catch(function (error) {
          self.error = error;
        });
      hostsService.current()
        .$promise
        .then(function (res) {
          self.openatticVersion = res.oa_version.package.VERSION;
        });
    };

    var isAllDeepSeaPropsDefined = function (deepsea) {
      let isHostDefined = deepsea.host !== undefined && deepsea.host !== "";
      let isPortDefined = deepsea.port !== undefined && deepsea.port !== null;
      let isEauthDefined = deepsea.eauth !== undefined && deepsea.eauth !== null;
      let isUsernameDefined = deepsea.username !== undefined && deepsea.username !== "";
      let isPasswordDefined = deepsea.password !== undefined && deepsea.password !== "";
      let isSharedSecretDefined = deepsea.shared_secret !== undefined && deepsea.shared_secret !== "";
      return isHostDefined && isPortDefined && isEauthDefined &&
        (
          (deepsea.eauth === "auto" && isUsernameDefined && isPasswordDefined) ||
          (deepsea.eauth === "sharedsecret" && isUsernameDefined && isSharedSecretDefined)
        );
    };

    var checkDeepSeaConnectionTimeout;
    self.checkDeepSeaConnection = function () {
      self.deepseaConnectionStatus = undefined;
      if (checkDeepSeaConnectionTimeout) {
        $timeout.cancel(checkDeepSeaConnectionTimeout);
      }
      if (isAllDeepSeaPropsDefined(self.model.deepsea)) {
        self.deepseaConnectionStatus = {
          loading: true
        };
        checkDeepSeaConnectionTimeout = $timeout(function () {
          self.rgwDeepSeaSettings = angular.copy(defaultRgwDeepseaSettings);
          settingsFormService.checkDeepSeaConnection(self.model.deepsea)
            .$promise
            .then(function (res) {
              self.deepseaConnectionStatus = res;
              if (self.deepseaConnectionStatus.success) {
                settingsFormService.getRgwConfiguration(self.model.deepsea)
                  .$promise
                  .then(function (result) {
                    if (result.success) {
                      self.rgwDeepSeaSettings = result.rgw;
                      self.managedByDeepSeaEnabled = true;
                      angular.extend(self.rgwDeepSeaSettings, defaultRgwDeepseaSettings);
                    } else {
                      self.model.rgw.managed_by_deepsea = false;
                      self.managedByDeepSeaEnabled = false;
                    }
                    self.rgwManagedByDeepSeaChangeHandler();
                  });
              } else {
                self.model.rgw.managed_by_deepsea = false;
                self.managedByDeepSeaEnabled = false;
                self.rgwManagedByDeepSeaChangeHandler();
              }
            })
            .catch(function () {
              self.deepseaConnectionStatus = undefined;
            });
        }, animationTimeout);
      }
    };

    var isAllRgwPropsDefined = function (rgw) {
      let isHostDefined = rgw.host !== undefined && rgw.host !== "";
      let isPortDefined = rgw.port !== undefined && rgw.port !== null;
      let isAccessKeyDefined = rgw.access_key !== undefined && rgw.access_key !== "";
      let isSecretKeyDefined = rgw.secret_key !== undefined && rgw.secret_key !== "";
      let isUserIdDefined = rgw.user_id !== undefined && rgw.user_id !== "";
      let isUseSSLDefined = rgw.use_ssl !== undefined;
      return isHostDefined && isPortDefined && isAccessKeyDefined &&
        isSecretKeyDefined && isUserIdDefined && isUseSSLDefined;
    };

    var checkRgwConnectionTimeout;
    self.checkRgwConnection = function () {
      self.rgwConnectionStatus = undefined;
      if (checkRgwConnectionTimeout) {
        $timeout.cancel(checkRgwConnectionTimeout);
      }
      if (isAllRgwPropsDefined(self.model.rgw)) {
        self.rgwConnectionStatus = {
          loading: true
        };
        checkRgwConnectionTimeout = $timeout(function () {
          settingsFormService.checkRgwConnection(self.model.rgw)
            .$promise
            .then(function (res) {
              self.rgwConnectionStatus = res;
            })
            .catch(function () {
              self.rgwConnectionStatus = undefined;
            });
        }, animationTimeout);
      }
    };

    self.rgwManagedByDeepSeaChangeHandler = function () {
      if (self.model.rgw.managed_by_deepsea) {
        self.model.rgw = angular.copy(self.rgwDeepSeaSettings);
      }
      self.checkRgwConnection();
    };

    var isAllGrafanaPropsDefined = function (grafana) {
      let isHostDefined = grafana.host !== undefined && grafana.host !== "";
      let isPortDefined = grafana.port !== undefined && grafana.port !== null;
      let isUsernameDefined = grafana.username !== undefined && grafana.username !== "";
      let isPasswordDefined = grafana.password !== undefined && grafana.password !== "";
      let isUseSSLDefined = grafana.password !== grafana.use_ssl;
      return isHostDefined && isPortDefined && isUsernameDefined && isPasswordDefined && isUseSSLDefined;
    };

    var checkGrafanaConnectionTimeout;
    self.checkGrafanaConnection = function () {
      self.grafanaConnectionStatus = undefined;
      if (checkGrafanaConnectionTimeout) {
        $timeout.cancel(checkGrafanaConnectionTimeout);
      }
      if (isAllGrafanaPropsDefined(self.model.grafana)) {
        self.grafanaConnectionStatus = {
          loading: true
        };
        checkGrafanaConnectionTimeout = $timeout(function () {
          settingsFormService.checkGrafanaConnection(self.model.grafana)
            .$promise
            .then(function (res) {
              self.grafanaConnectionStatus = res;
            })
            .catch(function () {
              self.grafanaConnectionStatus = undefined;
            });
        }, animationTimeout);
      }
    };

    var isAllCephPropsDefined = function (ceph) {
      let isConfigFilePathDefined = ceph.config_file_path !== undefined && ceph.config_file_path !== "";
      let isKeyringFilePathDefined = ceph.keyring_file_path !== undefined && ceph.keyring_file_path !== "";
      let isKeyringUserDefined = ceph.keyring_user !== undefined && ceph.keyring_user !== "";
      return isConfigFilePathDefined && isKeyringFilePathDefined && isKeyringUserDefined;
    };

    var checkCephConnectionTimeout;
    self.checkCephConnection = function (ceph) {
      self.cephConnectionStatus = undefined;
      if (checkCephConnectionTimeout) {
        $timeout.cancel(checkCephConnectionTimeout);
      }
      if (isAllCephPropsDefined(ceph)) {
        self.cephConnectionStatus = {
          loading: true
        };
        checkCephConnectionTimeout = $timeout(function () {
          settingsFormService.checkCephConnection(ceph)
            .$promise
            .then(function (res) {
              self.cephConnectionStatus = res;
            })
            .catch(function () {
              self.cephConnectionStatus = undefined;
            });
        }, animationTimeout);
      }
    };

    self.getKeyringFileTypeahead = function (fsid) {
      var clusterKeyringCandidates = self.clustersKeyringCandidates[fsid];
      if (angular.isDefined(clusterKeyringCandidates)) {
        return clusterKeyringCandidates.reduce(function (result, item) {
          return result.concat(item["file-path"]);
        }, []);
      }
      return [];
    };

    self.getKeyringUserTypeahead = function (fsid, keyringFile) {
      var clusterKeyringCandidates = self.clustersKeyringCandidates[fsid];
      if (angular.isDefined(clusterKeyringCandidates)) {
        return clusterKeyringCandidates.reduce(function (result, item) {
          if (item["file-path"] === keyringFile) {
            return result.concat(item["user-names"]);
          } else {
            return result;
          }
        }, []);
      }
      return [];
    };

    self.saveAction = function () {
      settingsFormService.save(self.model)
        .$promise
        .then(function () {
          Notification.success({
            msg: "Settings has been saved successfully"
          });
          $scope.settingsForm.$submitted = false;
          $scope.settingsForm.$dirty = false;
        }, function () {
          $scope.settingsForm.$submitted = false;
        });
    };

  }
});
