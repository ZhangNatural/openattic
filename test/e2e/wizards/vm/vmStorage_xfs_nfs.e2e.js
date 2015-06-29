var helpers = require('../common.js');
var configs = require('../configs.js');

describe('VM Storage Wizard', function(){
  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));
  
  var volume = element(by.id('volumename'));
  var pool = element(by.id('source_pool'));
  var size = element(by.id('volumemegs'));
  var is_protected = element(by.id('volumeisprotected'));
  
  var volume_required = element(by.css('.tc_nameRequired'));
  var pool_required = element(by.css('.tc_poolRequired'));
  var size_required = element(by.css('.tc_sizeRequired'));
  
  var size_exceeded = element(by.css('.tc_wrongVolumeSize'));
  var noUniqueName = element(by.css('.tc_noUniqueName'));
  var noValidNumber = element(by.css('.tc_noValidNumber'));  

  beforeAll(function(){
    helpers.login();  
  });

  it('should land on the dashboard site after login', function(){
    expect(browser.getCurrentUrl()).toContain('#/dashboard');    
  });
  
  //   <-- VM Storage Wizard -->
   it('should have a button "VM Storage";navigate through the wizard', function(){
    var wizards = element.all(by.repeater('wizard in wizards')).then(function(wizards){
      var fs_wizard = wizards[1].element(by.className('btn-block'));
      expect(fs_wizard.isDisplayed()).toBe(true);
      fs_wizard.click();
      
      //first site
      
      //check available buttons
      expect(wizardOverviewBtn.isDisplayed()).toBe(true);
      expect(previousBtn.isDisplayed()).toBe(true);
    });
    //check if angular expression contains 'Next' or 'Done
    var nextBtn = element(by.id('nextBtn')).evaluate('nextBtnText()');
    expect(nextBtn.getText()).toEqual('Next');    
    expect(element.all(by.css('h3')).get(0).getText()).toEqual('VM Storage Step 1 - Create Volume');
    expect(volume.isDisplayed()).toBe(true);
    //expect(pool.isDisplayed()).toBe(true);
    expect(size.isDisplayed()).toBe(true);
    //expect(is_protected.Present()).toBe(true);
    
    //enter volume data
    volume.sendKeys('protractor_test_volume');
    
    //in order to enter a size we need to choose a pool first
      for(var key in configs.pools) {
        var pool = configs.pools[key];
        var volumePoolSelect = element(by.id('source_pool'));
        volumePoolSelect.click();
        volumePoolSelect.element(by.cssContainingText('option', pool.name)).click();
        break;
      }    
    
    //enter some data to get to the next site
    size.sendKeys('100MB');
    element(by.id("xfs")).click();
    nextBtn.click();
    
    //Step 2 - check at least the title then skip and available buttons
    expect(element(by.css('.tc_step2')).getText()).toEqual('VM Storage Step 2 - Create Mirror');
    expect(wizardOverviewBtn.isDisplayed()).toBe(true);
    expect(previousBtn.isDisplayed()).toBe(true);
    expect(nextBtn.getText()).toEqual('Next');
    browser.sleep(400);
    nextBtn.click();    
     expect(element(by.css('.tc_step3')).getText()).toEqual('VM Storage Step 3 - Create Shares');
    
    expect(wizardOverviewBtn.isDisplayed()).toBe(true);
    expect(previousBtn.isDisplayed()).toBe(true);
    expect(nextBtn.getText()).toEqual('Next');
    
    expect(element(by.model('input.cifs.create')).isPresent()).toBe(true);
    expect(element(by.model('input.nfs.create')).isPresent()).toBe(true);
    
    //choose nfs
    element(by.model('input.nfs.create')).click();
    var address = element(by.id('nfsaddress'));
    var path = element(by.id('nfspath'));
    var options = element(by.id('nfsoptions'));

    expect(path.isPresent()).toBe(true);
    expect(address.isDisplayed()).toBe(true);
    expect(element(by.id('nfsoptions')).isDisplayed()).toBe(true);
    expect(path.getAttribute('value')).toEqual('/media/protractor_test_volume');
    expect(options.getAttribute('value')).toEqual('rw,no_subtree_check,no_root_squash');
    nextBtn.click();
    expect(element(by.css('.tc_nfsAddressRequired')).isDisplayed()).toBe(true);
    path.clear();
    nextBtn.click();
    expect(element(by.css('.tc_nfsPathRequired')).isDisplayed()).toBe(true);
    path.sendKeys('/media/protractor_test_volume');
    address.sendKeys('oadevhost.domain.here');
    nextBtn.click();
    
    //Step 4 - Done
    
    browser.sleep(400);
    expect(element(by.css('.tc_wizardDone')).getText()).toEqual('VM Storage Step 4 - Save configuration');
    expect(nextBtn.getText()).toEqual('Done');
    nextBtn.click();
    console.log('<----- VM storage test with NFS ended ------>'); 
  });
  afterAll(function(){
    helpers.delete_volume();
    console.log('<----- VM storage test volume removed ------>'); 
  });   
});