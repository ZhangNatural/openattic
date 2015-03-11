angular.module('openattic.extensions')
  .directive('cephCrushMapEditor', function(){
    return {
      restrict: 'E',
      templateUrl: 'extensions/crushmap_editor/templates/editor.html',
      controller: function($scope, ClusterResource){
        $scope.clusters = ClusterResource.query(function(clusters){
          if(clusters.length === 1){
            $scope.cluster = clusters[0];
          }
          else{
            $scope.cluster = null;
          }
        });

        $scope.setActiveRuleset = function(activeRuleset){
          $scope.activeRuleset = activeRuleset;
        };
        $scope.setActiveRuleset(null);

        $scope.repsize = 3;
        $scope.$watch('repsize', function(repsize){
          if( $scope.activeRuleset ){
            if( repsize < $scope.activeRuleset.min_size ){
              $scope.repsize = $scope.activeRuleset.min_size;
            }
            if( repsize > $scope.activeRuleset.max_size ){
              $scope.repsize = $scope.activeRuleset.max_size;
            }
          }
        });

        $scope.$watch('activeRuleset', function(activeRuleset){
          var resetNodes, renderNodes, rendersteps, c, init, prevStepCount;
          if( !$scope.cluster ){
            return;
          }
          $scope.repsize = (activeRuleset ? activeRuleset.min_size : 3);
          resetNodes = function(nodes){
            var i, node;
            for( i = 0; i < nodes.length; i++ ){
              node = nodes[i];
              node.isRootNode      = false;
              node.isBelowRootNode = false;
              node.isSelectorNode  = false;
              node.nextStep        = null;
              resetNodes(node.children);
            }
          };
          renderNodes = function(steps, nodes, isBelowRootNode){
            var i, node, substeps;

            for( i = 0; i < nodes.length; i++ ){
              substeps = steps;
              node = nodes[i];
              console.log([node.name, steps]);

              if(steps[0].op === 'take'){
                if( steps[0].item === node.ceph_id ){
                  node.isRootNode = true;
                  isBelowRootNode = true;
                  node.nextStep = steps[1];
                  console.log([node.name, steps[0].op, "shift!"]);
                  steps.shift();
                }
              }
              else if(steps[0].op === 'choose_firstn' || steps[0].op === 'chooseleaf_firstn'){
                node.isBelowRootNode = isBelowRootNode;
                if( steps[0].type === node.type ){
                  typeMatch = true;
                  node.isSelectorNode = true;
                  node.nextStep = steps[1];
                  console.log([node.name, steps[0].op, "shift!"]);
                  substeps = steps.slice();
                  substeps.shift();
                }
              }
              if( node.children.length > 0 ){
                renderNodes(substeps, node.children, isBelowRootNode);
              }
              if( node.isRootNode ){
                while(steps.length > 0 && steps[0].op !== 'take'){
                  steps.shift();
                }
                if(steps.length === 0){
                  return;
                }
              }
            }
          };

          rendersteps = (activeRuleset ? activeRuleset.steps.slice() : []);
          resetNodes($scope.cluster.crush_map);
          while(rendersteps.length > 0){
            prevStepCount = rendersteps.length;
            renderNodes(rendersteps, $scope.cluster.crush_map, false);
            console.log(rendersteps);
            if( rendersteps.length >= prevStepCount ){
              // Safety measure: renderNodes should consume a coupl'a steps. If it
              // didn't, something seems to be wrong.
              throw 'The CRUSH map renderer seems unable to render this CRUSH map ruleset.';
            }
          }
        });

        $scope.getRealNum = function(step){
          if( !step ) return;
          if( step.num <= 0 ){
            return step.num + $scope.repsize;
          }
          return step.num;
        }
      }
    };
  });


// kate: space-indent on; indent-width 2; replace-tabs on;