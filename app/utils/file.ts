export function readFileContent(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event: any) => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}

export function getFileSize(size: number) {
  const num = 1024;
  if (size < num) {
    return `${size} B`;
  } else if (size < Math.pow(num, 2)) {
    return `${(size / num).toFixed(2)} KB`;
  } else if (size < Math.pow(num, 3)) {
    return `${(size / Math.pow(num, 2)).toFixed(2)} MB`;
  } else {
    return `${(size / Math.pow(num, 3)).toFixed(2)} GB`;
  }
}
