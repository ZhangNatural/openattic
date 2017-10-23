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

import _ from "lodash";

class CephRbdList {
  constructor ($scope, $state, $filter, $uibModal, $q, cephRbdService,
      registryService, cephPoolsService, oaTabSetService, cephRbdStateService) {
    this.$filter = $filter;
    this.$q = $q;
    this.$state = $state;
    this.$uibModal = $uibModal;
    this.cephPoolsService = cephPoolsService;
    this.cephRbdService = cephRbdService;
    this.oaTabSetService = oaTabSetService;
    this.cephRbdStateService = cephRbdStateService;

    this.registry = registryService;
    this.cluster = undefined;
    this.rbd = {};
    this.error = false;

    this.filterConfig = {
      page: 0,
      entries: 10,
      search: "",
      sortfield: null,
      sortorder: null
    };

    this.selection = {};

    this.tabData = {
      active: 0,
      tabs: {
        status: {
          show: () => _.isObject(this.selection.item),
          state: "cephRbds.detail.details",
          class: "tc_statusTab",
          name: "Status"
        },
        statistics: {
          show: () => _.isObject(this.selection.item),
          state: "cephRbds.detail.statistics",
          class: "tc_statisticsTab",
          name: "Statistics"
        }
      }
    };
    this.tabConfig = {
      type: "cephRbds",
      linkedBy: "id",
      jumpTo: "more"
    };
  }

  onClusterLoad (cluster) {
    this.cluster = cluster;
  }

  getRbdList () {
    if (this.cluster.results.length > 0 && this.registry.selectedCluster) {
      let obj = this.$filter("filter")(this.cluster.results, {
        fsid: this.registry.selectedCluster.fsid
      }, true);
      if (obj.length === 0) {
        this.registry.selectedCluster = this.cluster.results[0];
      }

      this.rbd = {};
      this.error = false;

      // Load the list of RBDs and Pools in parallel to increase the
      // loading speed.
      let requests = [];
      requests.push(
        this.cephRbdService.get({
          fsid: this.registry.selectedCluster.fsid,
          page: this.filterConfig.page + 1,
          pageSize: this.filterConfig.entries,
          search: this.filterConfig.search,
          ordering: (this.filterConfig.sortorder === "ASC" ? "" : "-") +
          this.filterConfig.sortfield
        }).$promise
      );
      requests.push(
        this.cephPoolsService.get({
          fsid: this.registry.selectedCluster.fsid
        }).$promise
      );
      this.$q.all(requests)
        .then((res) => {
          let rbds = res[0];
          let pools = res[1];
          rbds.results.forEach((rbd) => {
            pools.results.some((pool) => {
              if (pool.id === rbd.pool) {
                rbd.pool = pool;
                return true;
              }
            });
            if (rbd.data_pool) {
              pools.results.some((pool) => {
                if (pool.id === rbd.data_pool) {
                  rbd.data_pool = pool;
                  return true;
                }
              });
            }
            rbd.free = rbd.size - rbd.used_size;
            rbd.usedPercent = rbd.used_size / rbd.size * 100;
            rbd.freePercent = rbd.free / rbd.size * 100;
          });
          this.rbd = rbds;
          this._updateStates();
        })
        .catch((error) => {
          this.error = error;
        });
    }
  }

  onSelectionChange (selection) {
    this.selection = selection;
    let items = selection.items;

    this.multiSelection = items && items.length > 1;
    this.hasSelection = items && items.length === 1;

    if (!items || items.length !== 1) {
      this.$state.go("cephRbds");
      return;
    }

    if (this.$state.current.name === "cephRbds") {
      this.oaTabSetService.changeTab("cephRbds.detail.details", this.tabData,
        this.tabConfig, selection);
    } else {
      this.oaTabSetService.changeTab(this.$state.current.name, this.tabData,
        this.tabConfig, selection);
    }
  }

  addAction () {
    this.$state.go("cephRbds-add", {
      fsid: this.registry.selectedCluster.fsid
    });
  }

  _updateStates () {
    this.cephRbdStateService.updateStates((rbdToUpdate) => {
      this.rbd.results.forEach((rbdImage) => {
        console.log(rbdImage);
        if (rbdImage.name === rbdToUpdate.image &&
            rbdImage.pool.name === rbdToUpdate.pool &&
            this.registry.selectedCluster.fsid === rbdToUpdate.fsid) {
          if (rbdToUpdate.state === "DELETED") {
            this.filterConfig.refresh = new Date();
          } else {
            rbdImage.state = rbdToUpdate.state;
          }
        }
      });
    });
  }

  deleteAction () {
    if (!this.hasSelection && !this.multiSelection) {
      return;
    }
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephRbdDeleteModal",
      resolve: {
        fsid: () => {
          return this.registry.selectedCluster.fsid;
        },
        rbdSelection:  () => {
          return this.selection.items;
        }
      }
    });

    modalInstance.result.then(() => {
      this._updateStates();
    });
  }

}

export default {
  template: require("./ceph-rbd-list.component.html"),
  controller: CephRbdList
};
