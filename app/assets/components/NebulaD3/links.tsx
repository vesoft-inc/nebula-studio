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
    if (this.ref) {
      this.linkRender(this.props.links);
    }
  }

  linkRender(links) {
    d3.select(this.ref)
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .style('stroke', '#999999')
      .style('stroke-opacity', 0.6)
      .style('stroke-width', 2);
    d3.select(this.ref)
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('class', 'text')
      .text((d: any) => {
        return d.type;
      });
    this.props.onUpdataLinks();
  }

  render() {
    return (
      <g className="links" ref={(ref: SVGTextElement) => (this.ref = ref)} />
    );
  }
}
