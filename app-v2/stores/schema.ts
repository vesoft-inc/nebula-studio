import { action, makeAutoObservable, observable } from 'mobx';
import service from '@appv2/config/service';
import { IEdge, IIndexList, ISpace, ITag, ITree } from '@appv2/interfaces/schema';
import { handleKeyword } from '@appv2/utils/function';
import { findIndex } from 'lodash';
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
  activeMachineNum: number;
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
      update: action
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
    const { code } = (await service.execNGQL({
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

  async getSpaceInfo(space: string) {
    const { code, data } = (await service.execNGQL({
      gql: `DESCRIBE SPACE ${handleKeyword(space)}`,
    })) as any;
    return { code, data };
  }

  asyncGetSpacesList = async(_payload) => {
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
}

const schemaStore = new SchemaStore();
export default schemaStore;
