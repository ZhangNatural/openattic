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

var app = angular.module("openattic.cephIscsi");
app.value("CEPH_ISCSI_TARGET_ADVANCED_SETTINGS", [
    {
      property: "tpg_default_cmdsn_depth",
      help: "Default CmdSN (Command Sequence Number) depth. Limits the amount of requests that an iSCSI initiator " +
      "can have outstanding at any moment"
    },
    {
      property: "tpg_default_erl",
      help: "Default error recovery level"
    },
    {
      property: "tpg_login_timeout",
      help: "Login timeout value in seconds"
    },
    {
      property: "tpg_netif_timeout",
      help: "NIC failure timeout in seconds"
    },
    {
      property: "tpg_prod_mode_write_protect",
      help: "If set to 1, prevent writes to LUNs"
    },
    {
      property: "tpg_t10_pi",
      help: ""
    }
  ]);