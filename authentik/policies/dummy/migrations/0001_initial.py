# Generated by Django 3.0.6 on 2020-05-19 22:08

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("authentik_policies", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DummyPolicy",
            fields=[
                (
                    "policy_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        serialize=False,
                        to="authentik_policies.Policy",
                    ),
                ),
                ("result", models.BooleanField(default=False)),
                ("wait_min", models.IntegerField(default=5)),
                ("wait_max", models.IntegerField(default=30)),
            ],
            options={
                "verbose_name": "Dummy Policy",
                "verbose_name_plural": "Dummy Policies",
            },
            bases=("authentik_policies.policy",),
        ),
    ]