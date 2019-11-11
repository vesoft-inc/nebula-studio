import * as d3 from 'd3';
import * as React from 'react';

class Link extends React.Component<{ link: any[] }, {}> {
  ref: SVGLineElement;

  componentDidMount() {
    d3.select(this.ref).data([this.props.link]);
  }

  render() {
    return (
      <line
        className="link"
        ref={(ref: SVGLineElement) => (this.ref = ref)}
        strokeWidth={2}
      />
    );
  }
}

class LinkText extends React.Component<{ link: any }, {}> {
  refText: SVGTextElement;

  componentDidMount() {
    d3.select(this.refText).data([this.props.link]);
  }

  render() {
    return (
      <text
        className="text"
        ref={(ref: SVGTextElement) => (this.refText = ref)}
        strokeWidth={2}
      >
        {this.props.link.type}{' '}
      </text>
    );
  }
}

export default class Links extends React.Component<{ links: any[] }, {}> {
  render() {
    const links: any = [];
    const linktexts: any = [];
    this.props.links.map((link: any[], index: number) => {
      links.push(<Link key={index} link={link} />);
      linktexts.push(<LinkText key={index} link={link} />);
    });

    return (
      <g className="links">
        {links}
        {linktexts}
      </g>
    );
  }
}
