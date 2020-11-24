import { keyWords } from '#assets/config/nebulaQL';

export const handleKeyword = (name: string) => {
  return keyWords.includes(name) ? '`' + name + '`' : name;
};

export const handleVidStringName = (name: string) => {
  if (name.indexOf(`"`) > -1 && name.indexOf(`'`) === -1) {
    return `'${name}'`;
  } else {
    return `"${name}"`;
  }
};
