# Nebula Graph Studio Helm Chart

## Introduction
This chart bootstraps Nebula Graph Studio deployment on a Kubernetes cluster using the Helm.

## Prerequisites

- Kubernetes 1.14+
- Helm >= 3.2.0

## Install

First, clone repo.
```sh
$ git clone https://github.com/vesoft-inc/nebula-studio.git
```

The chart is under deployment/helm

### Install with a default configurations

Assume using release name: `my-studio`

```
$ cd nebula-studio
$ helm upgrade --install my-studio deployment/helm
```

### Install with a NodePort for external visit

```
$ cd nebula-studio
$ helm upgrade --install my-studio --set service.type=NodePort --set service.port=30070 deployment/helm
```

After success installed, we could visit nebula-studio via http://address-of-node:30070/

## Uninstall

```
$ helm uninstall my-studio
```

## Configuration


| Parameter | Description | Default |
|-----------|-------------|---------|
| replicaCount  | Replica Count for StatefulSet  | 0  |
| image.httpGateway.repository  |  The repository for http gateway's image  | vesoft/nebula-http-gateway  |
| image.nebulaImporter.repository  |  The repository for nebula-importer gateway's image  | vesoft/nebula-importer  |
| image.nebulaStudio.repository  |  The repository for nebula graph studio's image  | vesoft/nebula-graph-studio |
| image.nginx.repository  |  The repository for nginx's image  | nginx  |
| image.httpGateway.tag  |  The tag for http grateway's image  | v2  |
| image.nebulaImporter.tag  |  The tag for nebula-importer ateway's image  | v2  |
| image.nebulaStudio.tag  |  The tag for nebula graph studio's image  | v3  |
| image.nginx.tag  |  The tag for nginx's image  | alpine  |
| service.type  | The service type, should be one of ['NodePort', 'ClusterIP', 'LoadBalancer'] |  ClusterIP  |
| service.port  | The expose port for nebula-graph-studio's web |  7001  |
| resources.httpGateway  | The resource limits/requests for http gateway | {}  |
| resources.nebulaImporter  | The resource limits/requests for nebular importer | {}  |
| resources.nebulaStudio  | The resource limits/requests for nebula studio | {}  |
| resources.nginx  | The resource limits/requests for nginx | {}  |
| persistent.storageClassName  | The storageClassName for PVC if not using default  | ""  |
| persistent.size  | The size for upload-data persistent storage | 5Gi  |

