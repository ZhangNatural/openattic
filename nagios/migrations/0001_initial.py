# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Command'
        db.create_table('nagios_command', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=250)),
            ('query_only', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('nagios', ['Command'])

        # Adding model 'Graph'
        db.create_table('nagios_graph', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('command', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['nagios.Command'])),
            ('title', self.gf('django.db.models.fields.CharField')(unique=True, max_length=250)),
            ('verttitle', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('fields', self.gf('django.db.models.fields.CharField')(max_length=500)),
        ))
        db.send_create_signal('nagios', ['Graph'])

        # Adding model 'Service'
        db.create_table('nagios_service', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'], null=True, blank=True)),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'], null=True, blank=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('command', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['nagios.Command'])),
            ('arguments', self.gf('django.db.models.fields.CharField')(max_length=500, blank=True)),
        ))
        db.send_create_signal('nagios', ['Service'])

        # Adding unique constraint on 'Service', fields ['host', 'description']
        db.create_unique('nagios_service', ['host_id', 'description'])


    def backwards(self, orm):
        # Removing unique constraint on 'Service', fields ['host', 'description']
        db.delete_unique('nagios_service', ['host_id', 'description'])

        # Deleting model 'Command'
        db.delete_table('nagios_command')

        # Deleting model 'Graph'
        db.delete_table('nagios_graph')

        # Deleting model 'Service'
        db.delete_table('nagios_service')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'ifconfig.host': {
            'Meta': {'object_name': 'Host'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '63'})
        },
        'lvm.logicalvolume': {
            'Meta': {'unique_together': "(('vg', 'name'),)", 'object_name': 'LogicalVolume', '_ormbases': ['volumes.BlockVolume']},
            'blockvolume_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['volumes.BlockVolume']", 'unique': 'True', 'primary_key': 'True'}),
            'compression': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'createdate': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'null': 'True', 'blank': 'True'}),
            'dedup': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'filesystem': ('django.db.models.fields.CharField', [], {'max_length': '20', 'blank': 'True'}),
            'formatted': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'fscritical': ('django.db.models.fields.IntegerField', [], {'default': '85'}),
            'fswarning': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'megs': ('django.db.models.fields.IntegerField', [], {}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '130'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'blank': 'True'}),
            'snapshot': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'snapshot_set'", 'null': 'True', 'to': "orm['lvm.LogicalVolume']"}),
            'snapshotconf': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'snapshot_set'", 'null': 'True', 'to': "orm['lvm.SnapshotConf']"}),
            'uuid': ('django.db.models.fields.CharField', [], {'max_length': '38', 'blank': 'True'}),
            'vg': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.VolumeGroup']", 'blank': 'True'})
        },
        'lvm.snapshotconf': {
            'Meta': {'object_name': 'SnapshotConf'},
            'confname': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_execution': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'postscript': ('django.db.models.fields.CharField', [], {'max_length': '225', 'null': 'True'}),
            'prescript': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'retention_time': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'lvm.volumegroup': {
            'Meta': {'object_name': 'VolumeGroup', '_ormbases': ['volumes.VolumePool']},
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']", 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '130'}),
            'volumepool_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['volumes.VolumePool']", 'unique': 'True', 'primary_key': 'True'})
        },
        'nagios.command': {
            'Meta': {'object_name': 'Command'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '250'}),
            'query_only': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        'nagios.graph': {
            'Meta': {'object_name': 'Graph'},
            'command': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['nagios.Command']"}),
            'fields': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '250'}),
            'verttitle': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'})
        },
        'nagios.service': {
            'Meta': {'unique_together': "(('host', 'description'),)", 'object_name': 'Service'},
            'arguments': ('django.db.models.fields.CharField', [], {'max_length': '500', 'blank': 'True'}),
            'command': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['nagios.Command']"}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']", 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']", 'null': 'True', 'blank': 'True'})
        },
        'volumes.blockvolume': {
            'Meta': {'object_name': 'BlockVolume'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'pool': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.VolumePool']", 'null': 'True', 'blank': 'True'}),
            'upper_id': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True', 'blank': 'True'}),
            'upper_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'blockvolume_upper_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"}),
            'volume_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'blockvolume_volume_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"})
        },
        'volumes.volumepool': {
            'Meta': {'object_name': 'VolumePool'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'volumepool_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'volumepool_volumepool_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"})
        }
    }

    complete_apps = ['nagios']