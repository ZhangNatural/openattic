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
import logging
from urlparse import urlparse

from django.db import models

from ceph.models import CephCluster
from deepsea import DeepSea
from ceph.librados import MonApi
from nodb.models import JsonField, NodbModel
from utilities import aggregate_dict
import rest_client

logger = logging.getLogger(__name__)


class CephMinion(NodbModel):

    KEY_STATE_ACCEPTED = 'accepted'
    KEY_STATE_REJECTED = 'rejected'
    KEY_STATE_DENIED = 'denied'
    KEY_STATE_UNACCEPTED = 'unaccepted'
    KEY_STATES = [
        KEY_STATE_ACCEPTED, KEY_STATE_REJECTED, KEY_STATE_DENIED,
        KEY_STATE_UNACCEPTED
    ]

    hostname = models.CharField(max_length=250, primary_key=True, editable=False)

    # By DeepSea:
    cluster = models.ForeignKey(CephCluster, blank=True, null=True)
    public_network = models.CharField(max_length=100, blank=True, null=True, editable=False)
    cluster_network = models.CharField(max_length=100, blank=True, null=True, editable=False)
    key_status = models.CharField(max_length=100, choices=[(c, c) for c in KEY_STATES])
    roles = JsonField(base_type=list, null=True, blank=True)
    storage = JsonField(base_type=dict, null=True, blank=True)

    # By `ceph [osd|mon|mgr|mds] metadata`:
    arch = models.CharField(max_length=100, null=True, blank=True, editable=False, default='')
    addresses = JsonField(base_type=list, editable=False, null=True, blank=True, default=[])
    ceph_version  = models.CharField(max_length=300, null=True, blank=True, editable=False, default='')
    cpu = models.CharField(max_length=100, null=True, blank=True, editable=False, default='')
    distro_description  = models.CharField(max_length=300, null=True, blank=True, editable=False, default='')
    daemon_types = JsonField(base_type=list, editable=False, null=True, blank=True, default=[])
    daemons = JsonField(base_type=list, editable=False, null=True, blank=True, default=[])

    @staticmethod
    def get_all_objects(context, query):
        assert context is None

        minions = merge_pillar_metadata()

        for minion in minions:
            minion['cluster_id'] = minion['fsid'] if 'fsid' in minion else None

        return [CephMinion(**CephMinion.make_model_args(host))
                for host in minions]


def merge_pillar_metadata():
    def get_hostname(fqdn):
        return fqdn.split('.')[0]

    metadata = all_metadata()
    try:
        minions = DeepSea.instance().get_minions()
    except rest_client.RequestException:
        logger.exception('failed to get minions')
        minions = []
    ret = []
    for minion in minions:
        minion_hostname = get_hostname(minion['hostname'])
        if minion_hostname in metadata:
            # both `metadata[minion_hostname]` and `minion` contain a "hostname" key. Use the one
            # from minion, as it contains the fqdn instead of just the name.
            ret.append(aggregate_dict(metadata[minion_hostname], minion))
            del metadata[minion_hostname]
        else:
            ret.append(minion)
    for metadata in metadata.values():
        ret.append(metadata)
    return ret


def all_metadata():
    hosts = reduce(metadata_by_cluster, CephCluster.objects.all(), {})
    return {host_name: reduce_services(services) for host_name, services in hosts.items()}


def reduce_services(services):
    """
    :type services: list[dict]
    """
    def as_list(key):
        return filter(None, {s.get(key, None) for s in services})

    def as_comma_seperated(key):
        return ', '.join(as_list(key))

    # According to
    # ostream& operator<<(ostream& out, const sockaddr_storage &ss)
    # these are urlish
    addresses = as_list('back_addr') + as_list('front_addr') + as_list('faddr')

    return {
        'hostname': services[0]['hostname'],
        'fsid': services[0]['fsid'],
        'arch': as_comma_seperated('arch'),
        'ceph_version': as_comma_seperated('ceph_version'),
        'cpu': as_comma_seperated('cpu'),
        'distro_description': as_comma_seperated('distro_description'),
        'daemon_types': as_list('type'),
        'daemons': sorted(as_list('daemon')),
        'addresses': sorted({urlparse('//' + url).hostname for url in addresses}),
    }


def metadata_by_cluster(hosts, cluster):
    """:type cluster: CephCluster"""
    api = MonApi(cluster.fsid)
    for osd in api.osd_metadata():
        osd["type"] = "osd"
        osd["daemon"] = "osd.{}".format(osd['id'])
        osd['fsid'] = cluster.fsid
        hosts.setdefault(osd['hostname'], []).append(osd)
    for mon in api.mon_metadata():
        mon["type"] = "mon"
        mon["daemon"] = "mon.{}".format(mon['name'])
        mon['fsid'] = cluster.fsid
        hosts.setdefault(mon['hostname'], []).append(mon)
    for mgr in api.mgr_metadata():
        if 'hostname' in mgr:
            mgr["type"] = "mgr"
            mgr["daemon"] = "mgr.{}".format(mgr['id'])
            mgr['fsid'] = cluster.fsid
            hosts.setdefault(mgr['hostname'], []).append(mgr)
        else:
            logger.warning('no "hostname" in {}'.format(mgr.keys()))
    for mds in api.mds_metadata():
        mds["type"] = "mds"
        mds["daemon"] = "mds.{}".format(mds['name'])
        mds['fsid'] = cluster.fsid
        hosts.setdefault(mds['hostname'], []).append(mds)
    return hosts

