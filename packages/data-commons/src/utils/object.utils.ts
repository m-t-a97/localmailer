/**
 * This function converts an object to camelCase
 * @param data - The key/value pair object to convert to camelCase
 * @returns The object in camelCase
 */
export const convertToCamelCase = (
  data: Record<string, any> | Array<Record<string, any>>,
) => {
  const convert = (obj: Record<string, any>) => {
    return Object.keys(obj).reduce(
      (acc, currentKey) => {
        const camelCasedKey = currentKey.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase(),
        );
        acc[camelCasedKey] = obj[currentKey];
        return acc;
      },
      {} as Record<string, any>,
    );
  };

  if (Array.isArray(data)) {
    return data.map((d) => convert(d));
  } else {
    return convert(data);
  }
};

/**
 * This function converts an object to snake_case
 * @param obj - The key/value pair object to convert to snake_case
 * @returns The object in snake_case
 */
export const convertToSnakeCase = (
  data: Record<string, any> | Array<Record<string, any>>,
) => {
  const convert = (obj: Record<string, any>) => {
    return Object.keys(obj).reduce(
      (acc, currentKey) => {
        const snakeCasedKey = currentKey.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`,
        );
        acc[snakeCasedKey] = obj[currentKey];
        return acc;
      },
      {} as Record<string, any>,
    );
  };

  if (Array.isArray(data)) {
    return data.map((d) => convert(d));
  } else {
    return convert(data);
  }
};
