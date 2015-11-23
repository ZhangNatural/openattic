var helpers = require('../../common.js');

describe('Should create a Snapshot', function(){
  var volumename = 'protractor_testvol_block';
  var snapshotname = 'protractor_test_snap';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  var snapshot = element(by.cssContainingText('tr', snapshotname));

  beforeAll(function(){
    helpers.login();
    element.all(by.css('ul .tc_menuitem > a')).get(3).click();
    helpers.create_volume(volumename, "lun");
    helpers.create_snapshot(volume);

  });

  it('should display the snapshot in the snapshots overview panel', function(){
    expect(volume.isPresent()).toBe(true);
    expect(snapshot.isPresent()).toBe(true);
  });

  afterAll(function(){
    console.log('snapshot_add_blockvol');
    helpers.delete_snapshot(volume);
    helpers.delete_volume(volume, volumename);
  });

});
