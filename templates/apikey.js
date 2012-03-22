{% load i18n %}

{% comment %}
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
{% endcomment %}

Ext.namespace("Ext.oa");

function wrap_api_key_set(form, options, action){
  // This is a somewhat questionable method to submit the form, but Django refuses
  // to validate without last_login/date_joined being set, which is not quite what I want either.
  var params = {
    owner:        {app: "auth", obj: "User", id: form.owner.value},
    description:  form.description.value,
    active:       form.active.checked
  };
  if( options.params.id === -1 ){
    rpcd__APIKey.create(params, action.options.success);
  }
  else{
    rpcd__APIKey.set(options.params.id, params, action.options.success);
  }
}



Ext.oa.ApiKey_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: rpcd__APIKey,
  id: "apikey_panel_inst",
  title: "{% trans 'API Keys' %}",
  texts: {
    add:     "{% trans 'Add Key' %}",
    edit:    "{% trans 'Edit Key' %}",
    remove:  "{% trans 'Delete Key' %}",
  },
  storefields: [{
    name: 'ownername',
    mapping: 'owner',
    convert: function( val, row ){
      if( val === null )
        return '';
      return val.username;
    }
  }, "apikey"],
  buttons: [{
    text: "{% trans 'Show API URL' %}",
    icon: MEDIA_URL + "/oxygen/16x16/actions/download.png",
    handler: function(btn){
      var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        __main__.fqdn(function(provider, response){
          Ext.Msg.prompt("{% trans 'API URL' %}",
            "{% trans 'Use this URL to connect to the openATTIC API using the API Key you selected.' %}<br />"+
            "{% trans 'Note that the input field only allows for easier copy-paste, any value you enter here will be ignored.' %}",
            null, null, false,
            String.format("http://__:{0}@{1}:31234/", sel.data.apikey, response.result)
          );
        });
      }
    }
  }],
  columns: [{
    header: "{% trans 'Description' %}",
    width: 200,
    dataIndex: "description"
  }, {
    header: "{% trans 'Owner' %}",
    width: 50,
    dataIndex: "ownername"
  }, {
    header: "{% trans 'Active' %}",
    width: 50,
    dataIndex: "active",
    renderer: Ext.oa.renderBoolean
  }],
  form: {
    api: {
      load: rpcd__APIKey.get_ext,
      submit: wrap_api_key_set
    },
    items: [{
      xtype: 'authuserfield',
      hiddenName: "owner"
    }, {
      fieldLabel: "{% trans 'Description' %}",
      name: "description",
      ref: 'descriptionfield'
    }, {
      xtype: 'checkbox',
      fieldLabel: "{% trans 'Active' %}",
      name: "active",
      ref: 'activefield'
    }],
  }
});



Ext.reg("apikey_panel", Ext.oa.ApiKey_Panel);

Ext.oa.ApiKey_Module = Ext.extend(Object, {
  panel: "apikey_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: "{% trans 'API Keys' %}",
      icon: MEDIA_URL + '/oxygen/22x22/status/dialog-password.png',
      leaf: true,
      panel: 'apikey_panel_inst',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.ApiKey_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
