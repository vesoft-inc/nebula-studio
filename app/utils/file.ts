export function readFileContent(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event: any) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

export function getFileSize(size: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  const gap = 1 << 10;
  if (!size) {
    return '0 B';
  }

  for (let i = 0, byte = gap; i < units.length; i++, byte *= gap) {
    if (size < byte || i === units.length - 1) {
      const unitSize = ((size * gap) / byte).toFixed(2);
      return `${unitSize} ${units[i]}` as `${number} ${(typeof units)[number]}`;
    }
  }
}
