# -*- coding: utf-8 -*-

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from unittest import SkipTest

from requests.exceptions import HTTPError

from testcase import GatlingTestCase


class UserTestScenario(GatlingTestCase):
    username = "gatling_testuser"

    @classmethod
    def setUpClass(cls):
        super(UserTestScenario, cls).setUpClass()
        cls.require_enabled("user")

    @classmethod
    def setUp(cls):
        cls.testuser = cls._create_test_user()['response']

    @classmethod
    def tearDown(cls):
        super(UserTestScenario, cls).tearDownClass()
        res = cls.send_request("GET", "users", search_param=("username=%s" % cls.username))
        if res["count"] > 0:
            for entry in res["response"]:
                cls.send_request("DELETE", "users", obj_id=entry["id"])

    @classmethod
    def _create_test_user(cls, username=None, is_superuser=True):
        if not username:
            username = cls.username

        user = {"username": username,
                "password": "init",
                "email": "gatling_test@test.com",
                "first_name": "gatling_test",
                "last_name": "gatling_user",
                "is_active": True,
                "is_staff": True,
                "is_superuser": is_superuser}

        try:
            res = cls.send_request("POST", "users", data=user)
        except HTTPError as e:
            raise SkipTest(e.message)

        res['response']['password'] = 'init'
        return res

    @property
    def error_messages(self):
        return {
            'test_create_refresh_auth_token_for_testuser':
                'You can\'t refresh the authentication token of another user. Only the user \'{}\' '
                'is able to refresh his token.'.format(self.testuser['username']),
            'test_auth_token_self_refresh_wrong_token': 'Invalid token',
            'test_try_to_get_preference_of_another_user':
                'You are not allowed to access other users profiles',
            'test_try_to_delete_preference_of_another_user':
                'You are not allowed to delete preferences of other users',
            'test_set_new_password_by_user_without_admin_privileges':
                'Administrator privileges are required for updating the data of user {}.'
                    .format(self.testuser['username'])
        }
