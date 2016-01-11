"use strict";

var app = angular.module("openattic");
app.factory("CmdlogService", function ($resource) {
  return $resource("/openattic/api/cmdlogs/:id", {
    id: "@id"
  }, {
    query: {
      method: "GET",
      isArray: true,
      transformResponse: function (data) {
        return JSON.parse(data).results;
      }
    },
    filter: {
      method: "GET",
      url: "/openattic/api/cmdlogs"
    }
  });
});