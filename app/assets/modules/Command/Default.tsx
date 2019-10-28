import React from 'react';

interface IProps {
  command: string;
}

const Default = (props: IProps) => {
  return (
    <div className="command-default">
      There is not a command: {props.command}
    </div>
  );
};

export default Default;
