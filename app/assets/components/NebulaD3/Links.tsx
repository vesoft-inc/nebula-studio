import * as d3 from 'd3';
import * as React from 'react';

interface IProps {
  links: any[];
  onUpdataLinks: () => void;
}

export default class Links extends React.Component<IProps, {}> {
  ref: SVGGElement;

  componentDidMount() {
    this.linkRender(this.props.links);
  }

  componentDidUpdate() {
    this.linkRender(this.props.links);
  }

  linkRender(links) {
    d3.select(this.ref)
      .selectAll('path')
      .data(links)
      .enter()
      .append('svg:path')
      .attr('class', 'link')
      .style('stroke', '#999999')
      .style('stroke-opacity', 0.6)
      .attr('id', (d: any) => 'text-path-' + d.id)
      .style('stroke-width', 2);

    d3.select(this.ref)
      .selectAll('line')
      .data(links)
      .exit()
      .remove();

    d3.select(this.ref)
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('class', 'text');

    d3.select(this.ref)
      .selectAll('text')
      .data(links)
      .exit()
      .remove();

    if (this.ref) {
      this.props.onUpdataLinks();
    }
  }

  render() {
    return (
      <g className="links" ref={(ref: SVGTextElement) => (this.ref = ref)} />
    );
  }
}
