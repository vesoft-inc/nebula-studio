import { keyWords } from '#assets/config/nebulaQL';

export const handleKeyword = (name: string) => {
  return keyWords.includes(name) ? '`' + name + '`' : name;
};
