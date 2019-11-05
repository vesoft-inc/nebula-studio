import React from 'react';

import ConfigServer from './ConfigServer';
import Default from './Default';

const supportCommands = [
  {
    command: 'config server',
    component: ConfigServer,
  },
];

interface IProps {
  command: string;
}

const Command = (props: IProps) => {
  const { command } = props;
  const matchCommand =
    supportCommands.find(
      item => command.trim().toLowerCase() === item.command,
    ) || ({} as any);
  const MatchComponent = matchCommand.component || Default;

  return <MatchComponent {...props} />;
};

export default Command;
