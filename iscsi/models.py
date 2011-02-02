# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

from lvm.models import LogicalVolume, SETUP_STATE_CHOICES

class Target(models.Model):
    name        = models.CharField(max_length=250)

    def __unicode__(self):
        return self.name

class Lun(models.Model):
    target      = models.ForeignKey(Target)
    volume      = models.ForeignKey(LogicalVolume)
    number      = models.IntegerField( default=-1 )
    alias       = models.CharField(max_length=20, blank=True)
    ltype       = models.CharField(max_length=10, default="fileio",
                    choices=(("fileio", "fileio"), ("blockio", "blockio")))
    state       = models.CharField(max_length=20, editable=False, default="new", choices=SETUP_STATE_CHOICES)

    share_type  = "iscsi"

    class Meta:
        unique_together = [("target", "number")]

    @property
    def path(self):
        return self.volume.path

    def __unicode__(self):
        if self.alias:
            return "%s LUN %d (%s)" % ( self.target, self.number, self.alias )
        return "%s LUN %d" % ( self.target, self.number )

    def save(self, *args, **kwargs):
        if self.number == -1:
            self.number = max( [ rec['number'] for rec in Lun.objects.filter(target=self.target).values('number') ] ) + 1

        models.Model.save(self, *args, **kwargs)
