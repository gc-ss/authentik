# Generated by Django 3.1.3 on 2020-11-04 09:11

import uuid

import django.db.models.deletion
from django.apps.registry import Apps
from django.core.exceptions import FieldError
from django.db import migrations, models
from django.db.backends.base.schema import BaseDatabaseSchemaEditor

import passbook.lib.models


def migrate_to_service_connection(apps: Apps, schema_editor: BaseDatabaseSchemaEditor):
    db_alias = schema_editor.connection.alias
    Outpost = apps.get_model("passbook_outposts", "Outpost")
    DockerServiceConnection = apps.get_model(
        "passbook_outposts", "DockerServiceConnection"
    )
    KubernetesServiceConnection = apps.get_model(
        "passbook_outposts", "KubernetesServiceConnection"
    )
    from passbook.outposts.apps import PassbookOutpostConfig

    # Ensure that local connection have been created
    PassbookOutpostConfig.init_local_connection(None)

    docker = DockerServiceConnection.objects.filter(local=True).first()
    k8s = KubernetesServiceConnection.objects.filter(local=True).first()

    try:
        for outpost in (
            Outpost.objects.using(db_alias).all().exclude(deployment_type="custom")
        ):
            if outpost.deployment_type == "kubernetes":
                outpost.service_connection = k8s
            elif outpost.deployment_type == "docker":
                outpost.service_connection = docker
            outpost.save()
    except FieldError:
        # This is triggered during e2e tests when this function is called on an already-upgraded
        # schema
        pass


class Migration(migrations.Migration):

    dependencies = [
        ("passbook_outposts", "0009_fix_missing_token_identifier"),
    ]

    operations = [
        migrations.CreateModel(
            name="OutpostServiceConnection",
            fields=[
                (
                    "uuid",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.TextField()),
                (
                    "local",
                    models.BooleanField(
                        default=False,
                        help_text="If enabled, use the local connection. Required Docker socket/Kubernetes Integration",
                        unique=True,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="DockerServiceConnection",
            fields=[
                (
                    "outpostserviceconnection_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        serialize=False,
                        to="passbook_outposts.outpostserviceconnection",
                    ),
                ),
                ("url", models.TextField()),
                ("tls", models.BooleanField()),
            ],
            bases=("passbook_outposts.outpostserviceconnection",),
        ),
        migrations.CreateModel(
            name="KubernetesServiceConnection",
            fields=[
                (
                    "outpostserviceconnection_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        serialize=False,
                        to="passbook_outposts.outpostserviceconnection",
                    ),
                ),
                ("kubeconfig", models.JSONField()),
            ],
            bases=("passbook_outposts.outpostserviceconnection",),
        ),
        migrations.AddField(
            model_name="outpost",
            name="service_connection",
            field=models.ForeignKey(
                blank=True,
                default=None,
                help_text="Select Service-Connection passbook should use to manage this outpost. Leave empty if passbook should not handle the deployment.",
                null=True,
                on_delete=django.db.models.deletion.SET_DEFAULT,
                to="passbook_outposts.outpostserviceconnection",
            ),
        ),
        migrations.RunPython(migrate_to_service_connection),
        migrations.RemoveField(
            model_name="outpost",
            name="deployment_type",
        ),
        migrations.AlterModelOptions(
            name="dockerserviceconnection",
            options={
                "verbose_name": "Docker Service-Connection",
                "verbose_name_plural": "Docker Service-Connections",
            },
        ),
        migrations.AlterModelOptions(
            name="kubernetesserviceconnection",
            options={
                "verbose_name": "Kubernetes Service-Connection",
                "verbose_name_plural": "Kubernetes Service-Connections",
            },
        ),
        migrations.AlterField(
            model_name="outpost",
            name="service_connection",
            field=passbook.lib.models.InheritanceForeignKey(
                blank=True,
                default=None,
                help_text="Select Service-Connection passbook should use to manage this outpost. Leave empty if passbook should not handle the deployment.",
                null=True,
                on_delete=django.db.models.deletion.SET_DEFAULT,
                to="passbook_outposts.outpostserviceconnection",
            ),
        ),
        migrations.AlterModelOptions(
            name="outpostserviceconnection",
            options={
                "verbose_name": "Outpost Service-Connection",
                "verbose_name_plural": "Outpost Service-Connections",
            },
        ),
        migrations.AlterField(
            model_name="kubernetesserviceconnection",
            name="kubeconfig",
            field=models.JSONField(
                default=None,
                help_text="Paste your kubeconfig here. passbook will automatically use the currently selected context.",
            ),
            preserve_default=False,
        ),
    ]