# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

import dbus

from django.conf import settings
from django.core.management import call_command

from nagios.conf import settings as nagios_settings
from ifconfig.models import Host, IPAddress

import nagios.models
import sysutils.models
from nagios.models    import Service, Command

def create_nagios(**kwargs):
    # Make sure the contacts config exists
    for servstate in Service.nagstate["servicestatus"]:
        cmdargs = servstate["check_command"].split('!')
        cmdname = cmdargs[0]
        cmdargs = cmdargs[1:]

        try:
            cmd = Command.objects.get( name=cmdname )
        except Command.DoesNotExist:
            # Commands that don't exist have not been configured by us, so query_only
            print "Adding Check Command %s" % cmdname
            cmd = Command( name=cmdname, query_only=True )
            cmd.save()

        if not cmd.query_only:
            continue

        try:
            serv = Service.objects.get(
                host=Host.objects.get_current(),
                description=servstate["service_description"],
                command=cmd
                )
        except Service.DoesNotExist:
            print "Adding Service '%s'" % servstate["service_description"]
            serv = Service(
                host        = Host.objects.get_current(),
                volume      = None,
                description = servstate["service_description"],
                command     = cmd,
                arguments   = ('!'.join(cmdargs))
                )
            serv.save()

    cmd = Command.objects.get(name=nagios_settings.CPUTIME_CHECK_CMD)
    if Service.objects.filter(host=Host.objects.get_current(), command=cmd).count() == 0:
        serv = Service(
            host        = Host.objects.get_current(),
            volume      = None,
            command     = cmd,
            description = nagios_settings.CPUTIME_DESCRIPTION,
            arguments   = ""
            )
        serv.save()

    for ip in IPAddress.objects.all():
        nagios.models.create_service_for_ip( instance=ip )

    dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nagios").writeconf()

sysutils.models.post_install.connect(create_nagios)
