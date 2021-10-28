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
| replicaCount  | Replicas for Deployment  | 0  |
| image.httpGateway.name  |  The image name of nebula-http-gateway  | vesoft/nebula-http-gateway  |
| image.nebulaStudio.name  |  The image name of nebula-graph-studio  | vesoft/nebula-graph-studio |
| image.nginx.name  |  The image name of nginx  | nginx  |
| image.httpGateway.version  |  The image version nebula-http-gateway  | v2.1.0  |
| image.nebulaStudio.version  |  The image version nebula-graph-studio  | v3.1.0  |
| image.nginx.version  |  The image version of nginx  | alpine  |
| service.type  | The service type, should be one of ['NodePort', 'ClusterIP', 'LoadBalancer'] |  ClusterIP  |
| service.port  | The expose port for nebula-graph-studio's web |  7001  |
| resources.httpGateway  | The resource limits/requests for nebula-http-gateway | {}  |
| resources.nebulaStudio  | The resource limits/requests for nebula-studio | {}  |
| resources.nginx  | The resource limits/requests for nginx | {}  |
| persistent.storageClassName  | The storageClassName for PVC if not using default  | ""  |
| persistent.size  | The persistent volume size | 5Gi  |

