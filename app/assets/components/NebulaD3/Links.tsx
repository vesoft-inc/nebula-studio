import * as d3 from 'd3';
import _ from 'lodash';
import * as React from 'react';

import { IPath } from '#assets/utils/interface';

interface IProps {
  links: any[];
  selectedPaths: any[];
  onUpdateLinks: () => void;
  onMouseInLink: (d, event) => void;
  onMouseOut: () => void;
}

export default class Links extends React.Component<IProps, {}> {
  ref: SVGGElement;

  componentDidMount() {
    this.linkRender(this.props.links, this.props.selectedPaths);
  }

  componentDidUpdate(prevProps) {
    const { links } = this.props;
    if (links.length < prevProps.links.length) {
      const removeLinks = _.differenceBy(
        prevProps.links,
        links,
        (v: any) => v.id,
      );
      removeLinks.forEach(removeLink => {
        const id = removeLink.uuid;
        d3.select('#text-path-' + id).remove();
        d3.select('#text-marker' + id).remove();
        d3.select('#text-marker-id' + id).remove();
      });
    } else {
      this.linkRender(this.props.links, this.props.selectedPaths);
    }
  }

  getNormalWidth = d => {
    const { selectedPaths } = this.props;
    return selectedPaths.map(path => path.id).includes(d.id) ? 3 : 2;
  };

  linkRender(links: IPath[], selectedPaths: IPath[]) {
    const self = this;
    const selectPathIds = selectedPaths.map(node => node.id);
    d3.select(this.ref)
      .selectAll('path')
      .data(links)
      .classed('active-link', (d: IPath) => selectPathIds.includes(d.id))
      .enter()
      .append('svg:path')
      .attr('pointer-events', 'visibleStroke')
      .attr('class', 'link')
      .style('fill', 'none')
      .style('stroke', '#595959')
      .style('stroke-width', 2)
      .on('mouseover', function(d) {
        self.props.onMouseInLink(d, d3.event);
        d3.select(this)
          .classed('hovered-link', true)
          .style('stroke-width', 3);
      })
      .on('mouseout', function() {
        self.props.onMouseOut();
        d3.select(this)
          .classed('hovered-link', false)
          .style('stroke-width', self.getNormalWidth);
      })
      .attr('id', (d: any) => 'text-path-' + d.uuid);

    d3.select(this.ref)
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('class', 'text')
      .attr('id', (d: any) => 'text-marker-id' + d.uuid)
      .append('textPath')
      .attr('id', (d: any) => 'text-marker' + d.uuid)
      .attr('class', 'textPath');

    if (this.ref) {
      this.props.onUpdateLinks();
    }
  }

  render() {
    return (
      <g className="links" ref={(ref: SVGTextElement) => (this.ref = ref)} />
    );
  }
}
