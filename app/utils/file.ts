export function readFileContent(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event: any) => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}

export function getFileSize(size: number) {
  if (size < 1000) {
    return `${size} B`;
  } else if (size < 1000000) {
    return `${(size / 1000).toFixed(2)} KB`;
  } else if (size < 1000000000) {
    return `${(size / 1000000).toFixed(2)} MB`;
  } else {
    return `${(size / 1000000000).toFixed(2)} GB`;
  }
}
