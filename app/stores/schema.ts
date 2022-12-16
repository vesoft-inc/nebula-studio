import { action, makeAutoObservable, observable } from 'mobx';
import service from '@app/config/service';
import { getRootStore } from '@app/stores';
import { IAlterForm, IEdge, IIndexList, ISchemaType, ISpace, ITag, ITree, IndexType, ISchemaEnum } from '@app/interfaces/schema';
import { handleKeyword, handleVidStringName, safeParse } from '@app/utils/function';
import { findIndex } from 'lodash';
import { getI18n } from '@vesoft-inc/i18n';
import {
  getAlterGQL,
  getIndexCreateGQL,
} from '@app/utils/gql';
import { message } from 'antd';
const { intl } = getI18n();


const initialSchemaData = {
  edgeTypes: [],
  tagsFields: [],
  edgesFields: [],
  indexes: [],
  tags: [],
  tagIndexTree: [],
  edgeIndexTree: [],
  tagList: [],
  edgeList: [],
  indexList: [],
} as Partial<SchemaStore>;
export class SchemaStore {
  spaces: string[] = [];
  currentSpace: string = sessionStorage.getItem('currentSpace') || '';
  spaceVidType: string;
  edgeTypes: string[] = [];
  tagsFields: any[] = [];
  edgesFields: any[] = [];
  indexes: any[] = [];
  tags: any[] = [];
  tagIndexTree: ITree[] = [];
  edgeIndexTree: ITree[] = [];
  spaceList: ISpace[] = [];
  activeMachineNum: number = 1;
  tagList: ITag[] = [];
  edgeList: IEdge[] = [];
  indexList: IIndexList[] = [];

  get rootStore() {
    return getRootStore();
  }

  constructor() {
    makeAutoObservable(this, {
      spaces: observable,
      currentSpace: observable,
      spaceVidType: observable,
      edgeTypes: observable,
      tagsFields: observable,
      edgesFields: observable,
      indexes: observable,
      tags: observable,
      tagIndexTree: observable,
      edgeIndexTree: observable,
      spaceList: observable,
      activeMachineNum: observable,
      tagList: observable,
      edgeList: observable,
      indexList: observable,
      update: action,
      addEdgesName: action,
      addTagsName: action,
    });
  }

  resetModel = () => {
    this.update({
      currentSpace: '',
      spaces: [],
      ...initialSchemaData,
    });
    sessionStorage.removeItem('currentSpace');
  };

  update = (payload: Record<string, any>) =>
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));


  // switch space
  updateSpaceInfo = async (space: string) => {
    await this.switchSpace(space);
    await this.getSchemaInfo();
  };

  updateVidType = async (space?: string) => {
    const { code, data } = await this.getSpaceInfo(space || this.currentSpace);
    if(code === 0) {
      this.update({
        spaceVidType: data?.tables?.[0]?.['Vid Type'],
      });
    }
  };

  switchSpace = async (space: string, hideErrMsg?: boolean) => {
    const { code, message } = (await service.execNGQL({
      gql: `use ${handleKeyword(space)};`,
    },
    {
      hideErrMsg
    },
    )) as any;

    if (code === 0) {
      this.update({
        currentSpace: space,
        ...initialSchemaData
      });
      sessionStorage.setItem('currentSpace', space);
      this.updateVidType(space);
      this.rootStore.console.clearConsoleResults();
    } else {
      return message;
    }
  };

  getSchemaInfo = async () => {
    const [tags, edges] = await Promise.all([this.getTags(), this.getEdges()]);
    this.update({ tags, edgeTypes: edges });
  };

  getSpaces = async () => {
    const { code, data } = (await service.execNGQL({
      gql: 'show spaces;',
    })) as any;
    if (code === 0) {
      const spaces = data.tables.map(item => item.Name);
      this.update({
        spaces,
      });
      return { code, data: spaces };
    } else {
      return { code, data };
    }
  };

  getSpaceInfo = async (space: string) => {
    const { code, data } = (await service.execNGQL({
      gql: `DESCRIBE SPACE ${handleKeyword(space)}`,
    })) as any;
    return { code, data };
  };

  getSpaceCreateGQL = async (space: string) => {
    const gql = `show create space ${handleKeyword(space)}`;
    const { code, data } = (await service.execNGQL({
      gql,
    })) as any;
    return code === 0 ? data.tables[0]['Create Space'] : null;
  };


  getSpacesList = async () => {
    const res = await this.getSpaces();
    const activeSpace = location.hash.slice(1);
    if (res.data) {
      const spaces: ISpace[] = [];
      await Promise.all(
        res.data.map(async (item, i) => {
          const { code, data } = await this.getSpaceInfo(
            item,
          );
          if (code === 0) {
            const space = (data.tables && data.tables[0]) || {};
            space.serialNumber = space.Name === activeSpace ? 0 : i + 1;
            spaces.push(space);
          }
        }),
      );
      this.update({
        spaceList: spaces.sort((a, b) => a.serialNumber - b.serialNumber),
      });
    }
  };

  deleteSpace = async (space: string) => {
    const { code, data } = (await service.execNGQL(
      {
        gql: `DROP SPACE ${handleKeyword(space)}`,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'delete_space',
        },
      },
    )) as any;
    return { code, data };
  };

  cloneSpace = async (name: string, space: string) => {
    const { code, data } = (await service.execNGQL(
      {
        gql: `CREATE SPACE IF NOT EXISTS ${handleKeyword(name)} as ${handleKeyword(space)}`,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'clone_space',
        },
      },
    )) as any;
    return { code, data };
  };

  createSpace = async (gql: string) => {
    const { code, data, message } = (await service.execNGQL(
      {
        gql,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'create_space',
        },
      },
    )) as any;
    return { code, data, message };
  };

  getMachineNumber = async () => {
    const { code, data } = (await service.execNGQL({
      gql: `SHOW HOSTS`,
    })) as any;
    if (code === 0) {
      const activeMachineNum = data.tables.filter(i => i.Status === 'ONLINE')
        .length;
      this.update({
        activeMachineNum: activeMachineNum || 1,
      });
    }
    return { code, data };
  };

  // edges
  getEdges = async () => {
    const { code, data } = (await service.execNGQL({
      gql: `
        show edges;
      `,
    })) as any;
    if (code === 0) {
      const edgeTypes = data.tables.map(item => item.Name);
      this.update({ edgeTypes });
      return edgeTypes;
    }
  };

  getEdgeTypesFields = async (payload: { edgeTypes: any[] }) => {
    const { edgeTypes } = payload;
    await Promise.all(
      edgeTypes.map(async item => {
        const { code, data } = await this.getTagOrEdgeInfo(ISchemaEnum.Edge, item);
        if (code === 0) {
          const edgeFields = data.tables.map(item => item.Field);
          this.addEdgesName({
            edgeType: item,
            edgeFields: ['type', '_rank', ...edgeFields],
          });
        }
      }),
    );
  };

  getEdgesAndFields = async () => {
    const edgeTypes = await this.getEdges();
    if (edgeTypes) {
      this.getEdgeTypesFields({ edgeTypes });
    }
  };

  getEdgeList = async () => {
    const edgeTypes = await this.getEdges();
    if (edgeTypes) {
      const edgeList: IEdge[] = [];
      await Promise.all(
        edgeTypes.map(async item => {
          const edge: IEdge = {
            name: item,
            fields: [],
          };
          const { code, data } = await this.getTagOrEdgeInfo(ISchemaEnum.Edge, item);
          if (code === 0) {
            edge.fields = data.tables;
          }
          edgeList.push(edge);
        }),
      );
      this.update({ edgeList });
    }
  };

  deleteEdge = async (name: string) => {
    const { code, data, message } = (await service.execNGQL(
      {
        gql: `
        DROP EDGE ${handleKeyword(name)}
      `,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'delete_edge',
        },
      },
    )) as any;
    return { code, data, message };
  };

  addEdgesName = async (payload: any) => {
    const { edgeType, edgeFields } = payload;
    const index = findIndex(this.edgesFields, edgeType);
    this.edgesFields[!~index ? this.edgesFields.length : index] = { [edgeType]: edgeFields };
  };

  // tags
  getTags = async () => {
    const { code, data } = (await service.execNGQL({
      gql: `
        SHOW TAGS;
      `,
    })) as any;

    if (code === 0) {
      const tags = data.tables.map(item => item.Name);
      return tags;
    }
  };

  addTagsName = (payload: any) => {
    const { tag, tagFields } = payload;
    const index = findIndex(this.tagsFields, item => item.tag === tag);
    this.tagsFields[!~index ? this.tagsFields.length : index] = { tag, fields: tagFields };
  };

  getTagsFields = async (payload: { tags: any[] }) => {
    const { tags } = payload;
    await Promise.all(
      tags.map(async item => {
        const { code, data } = await this.getTagOrEdgeInfo(ISchemaEnum.Tag, item);
        if (code === 0) {
          const tagFields = data.tables.map(item => ({
            field: item.Field,
            type: item.Type,
          }));
          this.addTagsName({ tag: item, tagFields });
        }
      }),
    );
  };

  getTagList = async () => {
    const tags = await this.getTags();
    if (tags) {
      const tagList: ITag[] = [];
      await Promise.all(
        tags.map(async item => {
          const tag: ITag = {
            name: item,
            fields: [],
          };
          const { code, data } = await this.getTagOrEdgeInfo(ISchemaEnum.Tag, item);
          if (code === 0) {
            tag.fields = data.tables;
          }
          tagList.push(tag);
        }),
      );
      this.update({ tagList });
    }
  };

  deleteTag = async (name: string) => {
    const { code, data, message } = (await service.execNGQL(
      {
        gql: `
        DROP TAG ${handleKeyword(name)}
      `,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'delete_tag',
        },
      },
    )) as any;
    return { code, data, message };
  };

  createTagOrEdge = async (payload: {
    type: ISchemaType,
    gql: string
  }) => {
    const { type, gql } = payload;
    const { code, data, message } = (await service.execNGQL(
      {
        gql,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: `create_${type.toLowerCase()}`,
        },
      },
    )) as any;
    return { code, data, message };
  };

  alterField = async (payload: IAlterForm) => {
    const gql = getAlterGQL(payload);
    const { code, data, message } = (await service.execNGQL(
      {
        gql,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: `${payload.action === 'DROP' ? 'delete' : 'update'}_${payload.type.toLowerCase()}_property`,
        },
      },
    )) as any;
    return { code, data, message };
  };

  getTagOrEdgeDetail = async (type: ISchemaType, name: string) => {
    const gql = `show create ${type} ${handleKeyword(name)}`;
    const { code, data } = (await service.execNGQL({
      gql,
    })) as any;
    if(code === 0) {
      const _type = `Create ${type[0].toUpperCase()}${type.slice(1)}`;
      return data.tables[0][_type];
    }
    return null;
  };

  getTagOrEdgeInfo = async (type: ISchemaType, name: string) => {
    const gql = `desc ${type}  ${handleKeyword(name)}`;
    const { code, data } = (await service.execNGQL({
      gql,
    })) as any;
    return { code, data };
  };

  // indexes
  getIndexes = async (type: IndexType) => {
    const { code, data } = (await service.execNGQL({
      gql: `
        SHOW ${type} INDEXES
      `,
    })) as any;
    if (code === 0) {
      const key = type === 'tag' ? 'By Tag' : 'By Edge';
      const indexes = data.tables.map(item => {
        return {
          name: item['Index Name'],
          owner: item[key],
        };
      });
      this.update({
        indexes,
      });
      return indexes;
    }
  };

  getIndexGQL = async (payload: { type: IndexType; name: string }) => {
    const { type, name } = payload;
    const { code, data } = (await service.execNGQL({
      gql: `
        SHOW CREATE ${type} index ${handleKeyword(name)}
      `,
    })) as any;
    if (code === 0) {
      const _type = type === ISchemaEnum.Tag ? 'Tag' : 'Edge';
      const res = data.tables[0]?.[`Create ${_type} Index`];
      return res;
    } else {
      return null;
    }
  };

  getIndexComment = async (payload: { type: IndexType; name: string }) => {
    const gql = await this.getIndexGQL(payload);
    const reg = /comment = "(.+)"/g;
    const result = reg.exec(gql);
    const comment = result?.[1] || null;
    return comment;
  };

  getIndexFields = async (payload: { type: IndexType; name: string }) => {
    const { type, name } = payload;
    const { code, data } = (await service.execNGQL({
      gql: `
        DESCRIBE ${type} INDEX ${handleKeyword(name)}
      `,
    })) as any;
    return { code, data };
  };

  getIndexTree = async (type: IndexType) => {
    const indexes = await this.getIndexes(type);
    if (indexes) {
      const _indexes = await Promise.all(
        indexes.map(async (item: any) => {
          const { code, data } = await this.getIndexFields({
            type,
            name: item.name,
          });
          return {
            indexName: item.name,
            indexOwner: item.owner,
            props: code === 0 ? data.tables : [],
          };
        }),
      );
      const tree = [] as ITree[];
      await Promise.all(
        _indexes.map(async (item: any) => {
          const tag = tree.filter(i => i.name === item.indexOwner);
          if (tag.length > 0) {
            tag[0].indexes.push(item);
          } else {
            tree.push({
              name: item.indexOwner,
              indexes: [item],
            });
          }
          return tree;
        }),
      );
      // Explain: tags/edges format:
      /* [{  name: 'xxx',
           indexes: [{
             indexName: 'xxx',
             props: [{
               Field: 'name',
               Type: 'string'
             }]
           }]
        }] */
      const key = type === 'tag' ? 'tagIndexTree' : 'edgeIndexTree';
      this.update({
        [key]: tree,
      });
      return tree;
    }
  };

  getIndexList = async (type: IndexType) => {
    const indexes = await this.getIndexes(type);
    if (indexes) {
      const indexList: IIndexList[] = [];
      await Promise.all(
        indexes.map(async item => {
          const comment = await this.getIndexComment({
            type,
            name: item.name,
          });
          const index: IIndexList = {
            owner: item.owner,
            comment,
            name: item.name,
            fields: [],
          };

          const { code, data } = await this.getIndexFields({
            type,
            name: item.name,
          });
          if (code === 0) {
            index.fields = data.tables;
          }
          indexList.push(index);
        }),
      );
      this.update({ indexList });
    }
  };

  deleteIndex = async (payload: { type: IndexType; name: string }) => {
    const { type, name } = payload;
    const { code, data } = (await service.execNGQL(
      {
        gql: `
        DROP ${type} INDEX ${handleKeyword(name)}
      `,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'delete_index',
        },
      },
    )) as any;
    return { code, data };
  };

  createIndex = async (payload: {
    type: IndexType;
    name: string;
    associate: string;
    comment?: string;
    fields: string[];
  }) => {
    const gql = getIndexCreateGQL(payload);
    const { code, data, message } = (await service.execNGQL(
      {
        gql,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'create_index',
        },
      },
    )) as any;
    return { code, data, message };
  };

  rebuildIndex = async (payload: { type: IndexType; name: string }) => {
    const { type, name } = payload;
    const { code, data } = (await service.execNGQL(
      {
        gql: `
        REBUILD ${type} INDEX ${handleKeyword(name)}
      `,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'rebuild_index',
        },
      },
    )) as any;
    return { code, data };
  };

  getIndexesStatus = async (type: IndexType) => {
    const { code, data } = (await service.execNGQL({
      gql: `
        SHOW ${type} INDEX STATUS
      `,
    })) as any;
    if (code === 0) {
      return data.tables;
    }
    return null;
  };

  // stats
  submitStats = async () => {
    const { code, data } = (await service.execNGQL(
      {
        gql: `
        SUBMIT JOB STATS
      `,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'submit_stats',
        },
      },
    )) as any;
    return { code, data };
  };

  getStats = async () => {
    const { code, data } = (await service.execNGQL({
      gql: `
        SHOW STATS
      `,
    })) as any;
    return { code, data };
  };

  getJobStatus = async (id?) => {
    const gql = id === undefined ? 'SHOW JOBS' : `SHOW JOB ${id}`;
    const { code, data } = (await service.execNGQL({
      gql,
    })) as any;
    return { code, data };
  };

  // schema visualization
  getRandomEdgeData = async () => {
    const vids:Set<string> = new Set();
    const edges = [];
    const edgeQuery = this.edgeList.map(edge => `MATCH ()-[e:${handleKeyword(edge.name)}]->() RETURN e LIMIT 10;`);
    const { code, data, message } = await service.batchExecNGQL({
      gqls: edgeQuery
    });
    let err;
    if(code !== 0) {
      return {
        err: message
      };
    }
    for(let i = 0; i < data.length; i++) {
      const item = data[i];
      if(item.code !== 0) {
        err = item.message;
        break;
      } else {
        const edgeList = item.data?.tables || [];
        edgeList.forEach(item => {
          const { dstID, srcID, edgeName } = item._edgesParsedList[0];
          vids.add(srcID);
          vids.add(dstID);
          edges.push({
            src: srcID,
            dst: dstID,
            name: edgeName,
            properties: this.edgeList.find(i => i.name === edgeName).fields.map(field => ({
              name: field.Field,
              type: field.Type,
            }))
          });
        });
      }
    }
    return { 
      vids: [...vids], 
      edges, 
      err 
    };
  };

  getNodeTagMap = async (ids: string[]) => {
    const vidMap = {};
    const tagSet = new Set(this.tagList.map(i => i.name));
    if(!this.spaceVidType) {
      await this.updateVidType();
    }
    const gql = `match (v) where id(v) in [${ids.map(id => handleVidStringName(id, this.spaceVidType)).join(',')}] return id(v) as id, tags(v) as \`tags\``;
    const res = await service.execNGQL({ gql });
    if(res.code === 0) {
      const tables = res.data?.tables || [];
      tables.forEach(item => {
        const { id, tags } = item;
        const _tags: string[] = safeParse(tags) || [];
        vidMap[id] = _tags.length > 0 ? _tags : undefined;
        _tags.forEach(i => tagSet.add(i));
      });
      return { vidMap, tags: [...tagSet] };
    }
  };

  getSchemaSnapshot = async (space) => {
    const res = await service.getSchemaSnapshot({ space }, {
      trackEventConfig: {
        category: 'schema',
        action: 'get_schema_visualization',
      },
    });
    return res;
  };

  updateSchemaSnapshot = async (params: {
    space: string, 
    snapshot: string
  }) => {
    const res = await service.updateSchemaSnapshot(params, {
      trackEventConfig: {
        category: 'sketch',
        action: 'refresh_schema_visualization',
      },
    });
    return res;
  };

  getSchemaDDL = async (space) => {
    const ddlMap = {
      space: null,
      tags: [],
      edges: [],
      indexes: [],
    };
    try {
      const errMsg = await this.switchSpace(space);
      if(errMsg) {
        throw new Error(errMsg);
      }
      const spaceGql = await this.getSpaceCreateGQL(space);
      ddlMap.space = spaceGql;
      await this.switchSpace(space);
      const tags = await this.getTags();
      const edges = await this.getEdges();
      const tagIndexes = await this.getIndexes(ISchemaEnum.Tag);
      const edgeIndexes = await this.getIndexes(ISchemaEnum.Edge);
      if(!tags || !edges || !tagIndexes || !edgeIndexes) {
        throw new Error(intl.get('schema.getDDLError'));
      }
      const queryList = [
        {
          data: tags,
          type: ISchemaEnum.Tag,
          destination: ddlMap.tags,
        },
        {
          data: edges,
          type: ISchemaEnum.Edge,
          destination: ddlMap.edges,
        },
        {
          data: tagIndexes,
          type: ISchemaEnum.Tag,
          isIndex: true,
          destination: ddlMap.indexes,
        },
        {
          data: edgeIndexes,
          type: ISchemaEnum.Edge,
          isIndex: true,
          destination: ddlMap.indexes,
        },
      ];
      for await (const item of queryList) {
        const { data, type, isIndex, destination } = item;
        for await (const _item of data) {
          if(isIndex) {
            const gql = await this.getIndexGQL({ type, name: _item.name });
            gql && destination.push(gql);
          } else {
            const gql = await this.getTagOrEdgeDetail(type, _item);
            if(gql) {
              destination.push(gql);
            } else {
              throw new Error(intl.get('schema.getDDLError'));
            }
          }
        }
      }
      return ddlMap;
    } catch (err) {
      message.warning(err.toString());
    }
  };
}

const schemaStore = new SchemaStore();
export default schemaStore;
