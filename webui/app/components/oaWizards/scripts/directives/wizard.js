'use strict';

angular.module('openattic.oaWizards')
  .directive('wizard', function(){
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: 'components/oaWizards/templates/wizard.html',
      link: function(scope, elem){
        var rawTabs = elem.find('.tab-pane');
        var tabs = [];

        for(var i=0; i <  rawTabs.length; i++){
          tabs.push({
            index: i+1,
            title: rawTabs[i].title
          });
        }

        scope.tabs = tabs;
      },
      controller: function($scope, VolumeService, CifsSharesService, NfsSharesService, LunService, SizeParserService){
        $scope.activeTab = 1;
        $scope.isActiveTab = function(index){
          return $scope.activeTab === index;
        };
        $scope.isPrevTab = function(index){
          return index < $scope.activeTab;
        };
        $scope.isNextTab = function(index){
          return index > $scope.activeTab;
        };
        $scope.nextTab = function(){
          var currentForm = $scope['contentForm' + $scope.activeTab];
          currentForm.submitted = true;
          if(currentForm.$valid) {
            if ($scope.activeTab < $scope.tabs.length) {
              $scope.activeTab++;
            }
            else if ($scope.activeTab === $scope.tabs.length) {
              var volume = $.extend({}, $scope.input.volume);
              volume.megs = SizeParserService.parseInt($scope.input.volume.megs);
              VolumeService.save(volume)
                .$promise
                .then(function (res){
                  if('cifs' in $scope.input && 'nfs' in $scope.input){
                    if($scope.input.cifs.create){
                      $scope.input.cifs.volume = {'id': res.id};
                      CifsSharesService.save($scope.input.cifs)
                        .$promise
                        .then(function() {
                        }, function(error){
                          console.log('An error occured', error);
                        });
                    }

                    if($scope.input.nfs.create){
                      $scope.input.nfs.volume = {'id': res.id};
                      NfsSharesService.save($scope.input.nfs)
                        .$promise
                        .then(function() {
                        }, function(error) {
                          console.log('An error occured', error);
                        });
                    }
                  }
                  else if('iscsi_fc' in $scope.input){
                    if($scope.input.iscsi_fc.create) {
                      $scope.input.iscsi_fc.volume = {id: res.id};
                      LunService.save($scope.input.iscsi_fc)
                        .$promise
                        .then(function () {
                        }, function (error) {
                          console.log('An error occured', error);
                        });
                    }
                  }
                })
                .catch(function(error) {
                  console.log('An error occured', error);
                })
                .then(function(res){
                  $scope.selectSelector();
                });
            }
          }
        };
        $scope.previousTab = function(){
          if($scope.activeTab > 1) {
            $scope.activeTab--;
          }
        };
        $scope.setTab = function(index){
          if(index <= $scope.activeTab) {
            $scope.activeTab = index;
          }
        };
        $scope.disabledPrev = function(){
          return $scope.activeTab === 1;
        };
        $scope.nextBtnText = function(){
          var btnText = 'Next';

          if($scope.activeTab === $scope.tabs.length){
            btnText = 'Done';
          }

          return btnText;
        };
        $scope.getWizardItemsClass = function(){
          return 'wizard-nav-items-' + $scope.tabs.length;
        };
      }
    };
  });