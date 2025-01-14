"""Outpost managed objects"""
from authentik.managed.manager import EnsureExists, ObjectManager
from authentik.outposts.models import Outpost, OutpostType


class OutpostManager(ObjectManager):
    """Outpost managed objects"""

    def reconcile(self):
        return [
            EnsureExists(
                Outpost,
                "goauthentik.io/outposts/inbuilt",
                name="authentik Bundeled Outpost",
                object_field="name",
                type=OutpostType.PROXY,
            ),
        ]
