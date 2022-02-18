import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { Avatar as AntAvatar } from 'antd';

interface IProps {
  username?: string,
  size: 'small'|'large'|'default'
}

const getColorIndex = (value: string) => {
  const index = value.toLowerCase().charCodeAt(0) - 96;
  return Math.floor(index / Math.floor(26 / RANDOM_COLOR_PICKER.length + 1));
};

const RANDOM_COLOR_PICKER = ['#345EDA', '#0C89BE', '#1D9E96', '#219A1F', '#D4A600', '#B36235', '#C54262'];

const Avatar = (props: IProps) => {
  const { username, size } = props;

  const [avatarColor, setAvatarColor] = useState<string>(RANDOM_COLOR_PICKER[0]);
  useEffect(() => {
    if(username) {
      const colorIndex = getColorIndex(username[0]);
      setAvatarColor(RANDOM_COLOR_PICKER[colorIndex]);
    }
  }, [username]
  );
  return (<AntAvatar size={size} style={{ backgroundColor: avatarColor }}>
    {username && username[0]?.toUpperCase()}
  </AntAvatar>);
};

export default Avatar;