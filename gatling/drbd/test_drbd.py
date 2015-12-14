
import requests, time

from drbd.scenarios import DrbdTestScenario

class DrbdTests(object):
    sleeptime = 8
    volumesize = 1000
    growsize = 2000
    shrinksize = 500

    def test_create_get_delete(self):
        """ Create a Connection and check that its Endpoints are created correctly. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Create the drbd mirror
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "30M"}
        mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", mirror_res["cleanup_url"], headers=mirror_res["headers"])

        # Check if there are to endpoints (volumes) related to this drbd mirror
        upper_id = "upper__id=%s" % mirror_res["response"]["volume"]["id"]
        endpoints_res = self.send_request("GET", "volumes", search_param=upper_id)
        self.assertEqual(endpoints_res["count"], 2, msg="number of endpoints is not equal 2")

    def test_remote_create_get_delete(self):
        """ Create a Connection for a volume located on the remote host. """
        # Create a volume on the remote host
        vol = self._get_mirror_volume(self._get_remote_pool()["id"])

        # Create a drbd mirror
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "30M"}
        mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", mirror_res["cleanup_url"], headers=mirror_res["headers"])

        # Check if there are to endpoints (volumes) related to this drbd mirror
        upper_id = "upper__id=%s" % mirror_res["response"]["volume"]["id"]
        endpoints_res = self.send_request("GET", "volumes", search_param=upper_id)
        self.assertEqual(endpoints_res["count"], 2, msg="number of endpoints is not equal 2")

    def test_create_with_filesystem_get_delete(self):
        """ Create a connection and format its /dev/drbdX with XFS. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Create the drbd mirror containing a filesystem
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "30M",
                       "filesystem"     : "xfs"}
        mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
        mirror = mirror_res["response"]
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", mirror_res["cleanup_url"], headers=mirror_res["headers"])

        # Check if the filesystem is created on top of the drbd connection
        mirror_vol_res = self.send_request("GET", "volumes", obj_id=mirror["volume"]["id"])
        self.assertTrue(mirror_vol_res["response"]["is_filesystemvolume"], True)
        self.assertEqual(mirror_vol_res["response"]["type"]["name"], "xfs")

    def test_create_resize_get_delete(self):
        """ Create a connection with 1000MB volumes and resize it to 2000MB. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Create a drbd mirror
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "30M"}
        mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
        mirror = mirror_res["response"]
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", mirror_res["cleanup_url"], headers=mirror_res["headers"])

        # Wait for drbd mirror status online
        while mirror["status"][0] !=  "online":
            time.sleep(self.sleeptime)
            mirror_res = self.send_request("GET", "mirrors", obj_id=mirror["id"])
            mirror = mirror_res["response"]

            if mirror["status"][0] == "degraded":
                raise SystemError("Status of DRBD connection %s is degraded." % mirror["volume"]["title"])

        # Resize drbd mirror
        self.send_request("PUT", "mirrors", obj_id=mirror["id"], data={"new_size": self.growsize})

        # Check if resize (grow) was successful
        mirror_vol_res = self.send_request("GET", "volumes", obj_id=mirror["volume"]["id"])
        self.assertEqual(mirror_vol_res["response"]["usage"]["size"], self.growsize)

    def test_create_with_filesystem_resize_get_delete(self):
        """ Create a connection with 1000MB volumes, format it with XFS and resize it to 2000MB. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Create the drbd mirror containing a filesystem
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "30M",
                       "filesystem"     : "xfs"}
        mirror_res = self.send_request("POST", "mirrors", data=mirror_data)

        mirror = mirror_res["response"]
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", mirror_res["cleanup_url"], headers=mirror_res["headers"])

         # Wait for drbd mirror status online
        while mirror["status"][0] !=  "online":
            time.sleep(self.sleeptime)
            mirror_res = self.send_request("GET", "mirrors", obj_id=mirror["id"])
            mirror = mirror_res["response"]

            if mirror["status"][0] == "degraded":
                raise SystemError("Status of DRBD connection %s is degraded." % mirror["volume"]["title"])

        with self.assertRaises(requests.exceptions.HTTPError) as err:
            # Resize drbd mirror
            self.send_request("PUT", "mirrors", obj_id=mirror["id"], data={"new_size": self.growsize})

        self.assertEqual(str(err.exception), "501 Server Error: Not Implemented")
        self.assertEqual(err.exception.response.status_code, 501)
        self.assertEqual(str(err.exception.response.json()),
                         "Resizing a formatted DRBD connection is not implemented yet.")

        # Check if resize (grow) was successful
        # time.sleep(self.sleeptime)
        # mirror_vol_res = self.send_request("GET", "volumes", obj_id=mirror["volume"]["id"])
        # self.assertGreater(mirror_vol_res["response"]["usage"]["size"], self.volumesize)
        # self.assertEqual(mirror_vol_res["response"]["is_filesystemvolume"], True)
        # self.assertEqual(mirror_vol_res["response"]["type"]["name"], "xfs")

    def test_create_shrink_delete(self):
        """ Create a connection with 1000MB volumes, try to shrink it to 500MB and check if it fails. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Create a drbd mirror
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "30M"}
        mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
        mirror = mirror_res["response"]
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", mirror_res["cleanup_url"], headers=mirror_res["headers"])

        # Wait for drbd mirror status online
        while mirror["status"][0] !=  "online":
            time.sleep(self.sleeptime)
            mirror_res = self.send_request("GET", "mirrors", obj_id=mirror["id"])
            mirror = mirror_res["response"]

            if mirror["status"][0] == "degraded":
                raise SystemError("Status of DRBD connection %s is degraded." % mirror["volume"]["title"])

        # Try to shrink drbd mirror
        with self.assertRaises(requests.exceptions.HTTPError) as err:
            self.send_request("PUT", "mirrors", obj_id=mirror["id"], data={"new_size": self.shrinksize})

        # check status code and error message
        expected_err_message = "The size of a DRBD connection can only be increased but the new size (500.00MB) is " \
                               "smaller than the current size (1,000.00MB)."
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")
        self.assertEqual(err.exception.response.status_code, 400)
        self.assertEqual(str(err.exception.response.json()), expected_err_message)

    def test_create_protocol_f(self):
        """ Try to create a Connection with protocol F. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Try to create the drbd mirror with protocol F
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "F",
                       "syncer_rate"    : "30M"}
        with self.assertRaises(requests.HTTPError) as err:
            mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
            time.sleep(self.sleeptime)
            self.send_request("DELETE", "mirrors", obj_id=mirror_res["response"]["id"])
        self.send_request("DELETE", "volumes", obj_id=vol["id"])
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")

    def test_create_0m(self):
        """ Try to create a Connection with syncer rate set to 0M. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Try to create the drbd mirror with syncer rate 0M
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "0M"}
        with self.assertRaises(requests.HTTPError) as err:
            mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
            time.sleep(self.sleeptime)
            self.send_request("DELETE", "mirrors", obj_id=mirror_res["response"]["id"])
        self.send_request("DELETE", "volumes", obj_id=vol["id"])
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")

    def test_create_10g(self):
        """ Try to create a Connection with syncer rate set to 10G. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Try to create the drbd mirror with syncer rate 10G
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "10g"}
        with self.assertRaises(requests.HTTPError) as err:
            mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
            time.sleep(self.sleeptime)
            self.send_request("DELETE", "mirrors", obj_id=mirror_res["response"]["id"])
        self.send_request("DELETE", "volumes", obj_id=vol["id"])
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")

    def test_create_1t(self):
        """ Try to create a Connection with syncer rate set to 1T (invalid unit). """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Try to create the drbd mirror with syncer rate 1T
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "1T"}
        with self.assertRaises(requests.HTTPError) as err:
            mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
            time.sleep(self.sleeptime)
            self.send_request("DELETE", "mirrors", obj_id=mirror_res["response"]["id"])
        self.send_request("DELETE", "volumes", obj_id=vol["id"])
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")

    def test_create_rate_with_space(self):
        """ Try to create a Connection with syncer rate set to 10 M (space char is invalid). """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Try to create the drbd mirror with syncer rate 1T
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "10 M"}
        with self.assertRaises(requests.HTTPError) as err:
            mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
            time.sleep(self.sleeptime)
            self.send_request("DELETE", "mirrors", obj_id=mirror_res["response"]["id"])
        self.send_request("DELETE", "volumes", obj_id=vol["id"])
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")

    def _get_mirror_volume(self, source_pool_id):
        vol_data = {"megs": self.volumesize,
                    "name": "gatling_drbd_vol1",
                    "source_pool": {"id": source_pool_id}}
        vol_res = self.send_request("POST", "volumes", data=vol_data)
        time.sleep(self.sleeptime)
        return vol_res["response"]


class DrbdTestCase(DrbdTestScenario, DrbdTests):
    pass