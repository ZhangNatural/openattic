# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

import json

from rpcd.handlers import ModelHandler
from userprefs.models import UserProfile

class UserProfileHandler(ModelHandler):
    model = UserProfile

    def all_preferences(self):
        """ Return a dict with all preferences for the current user profile. """
        return dict([( pref.setting, json.loads(pref.value)) for pref in self.user.get_profile()])

    def has_preference(self, setting):
        """ See if the user profile has the given `setting`. """
        return setting in self.user.get_profile()

    def get_preference_or_default(self, setting, default):
        """ Get the given `setting` if it is set, `default` otherwise. """
        if setting not in self.user.get_profile():
            return default
        return self.user.get_profile()[setting]

    def get_preference(self, setting):
        """ Get a setting from the current user's profile. """
        return self.user.get_profile()[setting]

    def set_preference(self, setting, value):
        """ Set a setting in the current user's profile. """
        self.user.get_profile()[setting] = value

    def clear_preference(self, setting):
        """ Clear a setting from the current user's profile. """
        del self.user.get_profile()[setting]

RPCD_HANDLERS = [UserProfileHandler]