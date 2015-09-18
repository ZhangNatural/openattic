'use strict';

angular.module('openattic')
  .filter('initiatorsonly', function(InitiatorService){
    return function(hosts){
      var initiators = [];
      angular.forEach(hosts, function(host){
        InitiatorService.filter({host: host.id})
          .$promise
          .then(function(res){
            if(res.count > 0) {
              initiators.push(host);
            }
          });
      });
      return initiators;
    };
  });