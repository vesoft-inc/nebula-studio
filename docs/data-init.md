# Data Init

## Why to use
If you want to try web console with some sample data. You can use the relative init [scripts](../scripts/ngql) that we provide.

## How to use
### Step 1 - start the nebula server
```bash
$ cd scripts/
$ docker-compose up -d
```
[more details about nebula docker image](https://github.com/vesoft-inc/nebula/tree/master/docker)

### Step 2 - init nebula schema
```bash
$ cd scripts/
$ cat ngql/init-schema.ngql | docker-compose run console bash;
// demo relationship graph schema
$ cat ngql/relationship-schema.ngql | docker-compose run console bash;
```

### Step 3 - init nebula data 
```bash
$ cd scripts/
$ cat ngql/init-data.ngql | docker-compose run console bash;
// demo relationship grap data
$ cat ngql/relationship-data.ngql | docker-compose run console bash;
```

### Finaly - Run the console, Have fun