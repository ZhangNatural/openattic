angular.module('openattic')
  .controller('PoolFormCtrl', function ($scope, $state, $stateParams, PoolService) {
    'use strict';

    $scope.pool = {
      options: { type: 'lvm' },
      name:  '',
      disks: [parseInt($stateParams.diskId, 10)]
    };

    $scope.accordionOpen = {
      properties: true
    };

    var goToListView = function() {
      $state.go('pools');
    };

    $scope.submitAction = function(poolForm) {
      $scope.submitted = true;
      if(poolForm.$valid) {
        $scope.pool = PoolService.save($scope.pool, function (res) {
          goToListView();
        }, function (error) {
          console.log('An error occured', error);
        });
      }
    };

    $scope.cancelAction = function() {
      goToListView();
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;