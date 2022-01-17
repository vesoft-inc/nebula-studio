export default function readFileContent(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event: any) => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}
