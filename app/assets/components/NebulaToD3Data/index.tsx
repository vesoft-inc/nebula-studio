import * as d3 from 'd3';
import React from 'react';

interface IProps {
  result: any;
  width: number;
  height: number;
}

export default class NebulaToD3Data extends React.Component<IProps, {}> {
  forceSimulation: any;
  svg: any;
  g: any;
  nodes: any;
  links: any;
  linksText: any;

  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(props) {
    const { result = {}, width, height } = props;
    const graph = {
      nodes: [],
      links: [],
    };
    if (result.code === '0') {
      // graph.nodes.push({
      //   id: result.data.tables[0].sourceid,
      //   name: result.data.tables[0].sourceid,
      //   group: result.data.tables[0].sourceid,
      // });
      // result.data.tables.map(column => {
      //   graph.nodes.push({
      //     name: column.destid,
      //     id: column.destid,
      //     group: column.destid,
      //   });
      //   graph.links.push({
      //     id: column.destid,
      //     name: column.destid,
      //     source: column.destid,
      //   });
      // });
      graph.nodes = [
        { name: '湖南邵阳' },
        { name: '山东莱州' },
        { name: '广东阳江' },
        { name: '山东枣庄' },
        { name: '泽' },
        { name: '恒' },
        { name: '鑫' },
        { name: '明山' },
        { name: '班长' },
      ];

      graph.links = [
        { source: 0, target: 4, relation: '籍贯', value: 1.3 },
        { source: 4, target: 5, relation: '舍友', value: 1 },
        { source: 4, target: 6, relation: '舍友', value: 1 },
        { source: 4, target: 7, relation: '舍友', value: 1 },
        { source: 1, target: 6, relation: '籍贯', value: 2 },
        { source: 2, target: 5, relation: '籍贯', value: 0.9 },
        { source: 3, target: 7, relation: '籍贯', value: 1 },
        { source: 5, target: 6, relation: '同学', value: 1.6 },
        { source: 6, target: 7, relation: '朋友', value: 0.7 },
        { source: 6, target: 8, relation: '职责', value: 2 },
      ];

      this.svg = d3.select('svg');
      const g = this.svg
        .append('g')
        .attr('transform', 'translate(" + 60 + "," + 60 + ")');
      const colorScale = d3.scaleOrdinal().range(d3.schemeCategory10);

      this.forceSimulation = d3
        .forceSimulation()
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter());

      this.forceSimulation.nodes(graph.nodes).on('tick', this.ticked);

      // setTimeout(this.ticked,5000)

      this.forceSimulation.force('link').links(graph.links);

      this.forceSimulation
        .force('center')
        .x(width / 2)
        .y(height / 2);
      // let linkForce = d3.forceLink(graph.links)
      //   .id((d) => { return d.name })

      this.links = g
        .append('g')
        .selectAll('line')
        .data(graph.links)
        .enter()
        .append('line')
        .attr('stroke', (d: any, i: any) => {
          return colorScale(i);
        })
        .attr('stroke-width', 1);

      this.linksText = g
        .append('g')
        .selectAll('text')
        .data(graph.links)
        .enter()
        .append('text')
        .text((d: any) => {
          return d.relation;
        });

      this.nodes = g
        .selectAll('.circleText')
        .data(graph.nodes)
        .enter()
        .append('g')
        .attr('transform', (d: any, i: any) => {
          const cirX = d.x;
          const cirY = d.y;
          return 'translate(" + cirX + "," + cirY + ")';
        })
        .call(
          d3
            .drag()
            .on('start', this.started)
            .on('drag', this.dragged)
            .on('end', this.ended),
        );

      this.nodes
        .append('circle')
        .attr('r', 10)
        .attr('fill', (d: any, i: any) => {
          console.log(d);
          return colorScale(i);
        });

      this.nodes
        .append('text')
        .attr('x', -10)
        .attr('y', -20)
        .attr('dy', 10)
        .text((d: any) => {
          return d.name;
        });
    }
  }

  started(d) {
    if (!d3.event.active) {
      this.forceSimulation.alphaTarget(0.8).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  ended(d) {
    if (!d3.event.active) {
      this.forceSimulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  }

  ticked() {
    this.links
      .attr('x1', (d: any) => {
        return d.source.x;
      })
      .attr('y1', (d: any) => {
        return d.source.y;
      })
      .attr('x2', (d: any) => {
        return d.target.x;
      })
      .attr('y2', (d: any) => {
        return d.target.y;
      });

    this.linksText
      .attr('x', (d: any) => {
        return (d.source.x + d.target.x) / 2;
      })
      .attr('y', (d: any) => {
        return (d.source.y + d.target.y) / 2;
      });

    this.nodes.attr('transform', (d: any) => {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  }

  render() {
    return (
      <div>
        <svg className="output-graph" width="960" height="600" />
      </div>
    );
  }
}
