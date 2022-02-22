import { action, makeAutoObservable, observable } from 'mobx';
import service from '@appv2/config/service';
import { AlterType, IAlterConfig, IEdge, IIndexList, IProperty, ISpace, ITag, ITree, IndexType } from '@appv2/interfaces/schema';
import { handleKeyword } from '@appv2/utils/function';
import { findIndex } from 'lodash';
import {
  getAlterGQL,
  getIndexCreateGQL,
  getTagOrEdgeCreateGQL,
} from '@appv2/utils/gql';

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

  update = (payload: Record<string, any>) =>
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));


  // switch space
  updateSpaceInfo = async(space: string) => {
    await this.switchSpace(space);
    await this.getSchemaInfo();
  }

  switchSpace = async(space: string) => {
    const { code, message } = (await service.execNGQL({
      // HACK: Processing keyword
      gql: 'use' + '`' + space + '`;',
    })) as any;

    if (code === 0) {
      const { data } = await this.getSpaceInfo(space);
      this.update({
        currentSpace: space,
        spaceVidType: data?.tables?.[0]?.['Vid Type'] || 'FIXED_STRING(8)',
      });
      sessionStorage.setItem('currentSpace', space);
    } else {
      return message;
    }
  };

  getSchemaInfo = async() => {
    const [tags, edges] = await Promise.all([this.getTags(), this.getEdges()]);
    this.update({ tags, edgeTypes: edges });
  }

  getSpaces = async() => {
    const { code, data } = (await service.execNGQL({
      gql: 'show spaces;',
    })) as any;
    if (code === 0) {
      const spaces = data.tables.map(item => item.Name).sort();
      this.update({
        spaces,
      });
      return { code, data: spaces };
    } else {
      return { code, data };
    }
  };

  getSpaceInfo = async(space: string) => {
    const { code, data } = (await service.execNGQL({
      gql: `DESCRIBE SPACE ${handleKeyword(space)}`,
    })) as any;
    return { code, data };
  }

  getSpacesList = async() => {
    const res = await this.getSpaces();
    if (res.data) {
      const spaces: ISpace[] = [];
      await Promise.all(
        res.data.map(async(item, i) => {
          const { code, data } = await this.getSpaceInfo(
            item,
          );
          if (code === 0) {
            const space = (data.tables && data.tables[0]) || {};
            space.serialNumber = i + 1;
            spaces.push(space);
          }
        }),
      );
      this.update({
        spaceList: spaces.sort((a, b) => a.serialNumber - b.serialNumber),
      });
    }
  }

  deleteSpace = async(space: string) => {
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
  }

  createSpace = async(gql: string) => {
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
  }

  getMachineNumber = async() => {
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
  }

  // edges
  getEdges = async() => {
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
  }

  getEdgeInfo = async(edge: string) => {
    const { code, data } = (await service.execNGQL({
      gql: 'desc edge' + '`' + edge + '`;',
    })) as any;
    return { code, data };
  }

  getEdgeDetail = async(name: string) => {
    const gql = `SHOW CREATE EDGE ${handleKeyword(name)}`;
    const { code, data, message } = (await service.execNGQL({
      gql,
    })) as any;
    return { code, data, message };
  }

  getEdgeTypesFields = async(payload: { edgeTypes: any[] }) => {
    const { edgeTypes } = payload;
    await Promise.all(
      edgeTypes.map(async item => {
        const { code, data } = await this.getEdgeInfo(
          item,
        );
        if (code === 0) {
          const edgeFields = data.tables.map(item => item.Field);
          this.addEdgesName({
            edgeType: item,
            edgeFields: ['type', '_rank', ...edgeFields],
          });
        }
      }),
    );
  }

  getEdgesAndFields = async() => {
    const edgeTypes = await this.getEdges();
    if (edgeTypes) {
      this.getEdgeTypesFields({ edgeTypes });
    }
  }

  getEdgeList = async() => {
    const edgeTypes = await this.getEdges();
    if (edgeTypes) {
      const edgeList: IEdge[] = [];
      await Promise.all(
        edgeTypes.map(async item => {
          const edge: IEdge = {
            name: item,
            fields: [],
          };
          const { code, data } = await this.getEdgeInfo(
            item,
          );
          if (code === 0) {
            edge.fields = data.tables;
          }
          edgeList.push(edge);
        }),
      );
      this.update({ edgeList });
    }
  }

  deleteEdge = async(name: string) => {
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
  }

  createEdge = async(payload: {
    name: string;
    comment?: string;
    fields?: IProperty[];
    ttlConfig?: {
      ttl_col: string;
      ttl_duration: number;
    };
  }) => {
    const gql = await getTagOrEdgeCreateGQL({ ...payload, type: 'EDGE' });
    const { code, data, message } = (await service.execNGQL(
      {
        gql,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'create_edge',
        },
      },
    )) as any;
    return { code, data, message };
  }

  addEdgesName = async(payload: any) => {
    const { edgeType, edgeFields } = payload;
    const index = findIndex(this.edgesFields, edgeType);
    this.edgesFields[!~index ? this.edgesFields.length : index] = { [edgeType]: edgeFields };
  }

  // tags
  async getTags() {
    const { code, data } = (await service.execNGQL({
      gql: `
        SHOW TAGS;
      `,
    })) as any;

    if (code === 0) {
      const tags = data.tables.map(item => item.Name);
      return tags;
    }
  }

  addTagsName = (payload: any) => {
    const { tag, tagFields } = payload;
    const index = findIndex(this.tagsFields, item => item.tag === tag);
    this.tagsFields[!~index ? this.tagsFields.length : index] = { tag, fields: tagFields };
  };

  getTagsFields = async(payload: { tags: any[] }) => {
    const { tags } = payload;
    await Promise.all(
      tags.map(async item => {
        const { code, data } = await this.getTagInfo(item);
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

  getTagInfo = async(tag: string) => {
    const { code, data } = (await service.execNGQL({
      gql: 'desc tag ' + '`' + tag + '`;',
    })) as any;
    return { code, data };
  }

  getTagDetail = async(name: string) => {
    const gql = `SHOW CREATE TAG ${handleKeyword(name)}`;
    const { code, data, message } = (await service.execNGQL({
      gql,
    })) as any;
    return { code, data, message };
  }

  getTagList = async() => {
    const tags = await this.getTags();
    if (tags) {
      const tagList: ITag[] = [];
      await Promise.all(
        tags.map(async item => {
          const tag: ITag = {
            name: item,
            fields: [],
          };
          const { code, data } = await this.getTagInfo(
            item,
          );
          if (code === 0) {
            tag.fields = data.tables;
          }
          tagList.push(tag);
        }),
      );
      this.update({ tagList });
    }
  }

  deleteTag = async(name: string) => {
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
  }

  createTag = async(payload: {
    name: string;
    comment?: string;
    fields?: IProperty[];
    ttlConfig?: {
      ttl_col: string;
      ttl_duration: number;
    };
  }) => {
    const gql = await getTagOrEdgeCreateGQL({ ...payload, type: 'TAG' });
    const { code, data, message } = (await service.execNGQL(
      {
        gql,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: 'create_tag',
        },
      },
    )) as any;
    return { code, data, message };
  }

  alterField = async(payload: {
    type: IndexType;
    name: string;
    action: AlterType;
    config: IAlterConfig;
  }) => {
    const gql = getAlterGQL(payload);
    const { code, data, message } = (await service.execNGQL(
      {
        gql,
      },
      {
        trackEventConfig: {
          category: 'schema',
          action: `{payload.action === 'DROP' ? 'delete' : 'update'}_${payload.type.toLowerCase()}_property`,
        },
      },
    )) as any;
    return { code, data, message };
  }

  // indexes
  getIndexes = async(type: IndexType) => {
    const { code, data } = (await service.execNGQL({
      gql: `
        SHOW ${type} INDEXES
      `,
    })) as any;
    if (code === 0) {
      const indexes = data.tables.map(item => {
        return {
          name: item['Index Name'],
          owner: item['By Tag'],
        };
      });
      this.update({
        indexes,
      });
      return indexes;
    }
  }

  getIndexComment = async(payload: { type: IndexType; name: string }) => {
    const { type, name } = payload;
    const { code, data } = (await service.execNGQL({
      gql: `
        SHOW CREATE ${type} index ${handleKeyword(name)}
      `,
    })) as any;
    if (code === 0) {
      const _type = type === 'TAG' ? 'Tag' : 'Edge';
      const res = data.tables[0]?.[`Create ${_type} Index`] || '';
      const reg = /comment = "(.+)"/g;
      const result = reg.exec(res);
      const comment = result?.[1] || null;
      return comment;
    } else {
      return null;
    }
  }

  getIndexFields = async(payload: { type: IndexType; name: string }) => {
    const { type, name } = payload;
    const { code, data } = (await service.execNGQL({
      gql: `
        DESCRIBE ${type} INDEX ${handleKeyword(name)}
      `,
    })) as any;
    return { code, data };
  }

  getIndexTree = async(type: IndexType) => {
    const indexes = await this.getIndexes(type);
    if (indexes) {
      const _indexes = await Promise.all(
        indexes.map(async(item: any) => {
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
        _indexes.map(async(item: any) => {
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
      const key = type === 'TAG' ? 'tagIndexTree' : 'edgeIndexTree';
      this.update({
        [key]: tree,
      });
      return tree;
    }
  }

  getIndexList = async(type: IndexType) => {
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
  }

  deleteIndex = async(payload: { type: IndexType; name: string }) => {
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
  }
  createIndex = async(payload: {
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
  }
}

const schemaStore = new SchemaStore();
export default schemaStore;