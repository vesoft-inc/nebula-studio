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
| image.nebulaStudio.name  |  The image name of nebula-graph-studio  | vesoft/nebula-graph-studio |
| image.nebulaStudio.version  |  The image version nebula-graph-studio  | v3.2.5  |
| service.type  | The service type, should be one of ['NodePort', 'ClusterIP', 'LoadBalancer'] |  ClusterIP  |
| service.port  | The expose port for nebula-studio server |  7001  |
| service.nodePort  | The proxy port for accessing nebula-studio outside k8s cluster |  32701  |
| resources.nebulaStudio  | The resource limits/requests for nebula-studio | {}  |
| persistent.storageClassName  | The storageClassName for PVC if not using default  | ""  |
| persistent.size  | The persistent volume size | 5Gi  |

