export function deduplicateArrayByKey(arr, key) {
  const uniqueValues = new Set();

  return arr.filter((obj) => {
    const value = obj[key];
    if (!uniqueValues.has(value)) {
      uniqueValues.add(value);
      return true;
    }
    return false;
  });
}
