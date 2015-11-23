angular.module('openattic')
  .factory('PoolService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/pools/:id', {
      id: '@id'
    }, {
      update: {method: 'PUT'},
      query: {
        method: 'GET',
        isArray: true,
        transformResponse: function (data) {
          return JSON.parse(data).results;
        }
      },
      storage: {
        method: 'GET',
        url: '/openattic/api/pools/:id/storage'
      },
      filesystems: {
        method: 'GET',
        url: '/openattic/api/pools/:id/filesystems'
      },
      filter: {
        method: 'GET',
        url: '/openattic/api/pools'
      }
    });
  });
