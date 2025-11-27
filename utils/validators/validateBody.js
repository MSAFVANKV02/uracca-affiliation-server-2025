export const validateBodyKeys = (body, allowedKeys = []) => {
  const sentKeys = Object.keys(body);

  const forbiddenKeys = sentKeys.filter((key) => !allowedKeys.includes(key));

  if (forbiddenKeys.length > 0) {
    throw new Error(
      `Invalid fields: ${forbiddenKeys.join(
        ", "
      )}. Allowed fields: ${allowedKeys.join(", ")}`
    );
  }
};

export const validateBodyBySchema = (body, schema, path = "") => {
  const schemaPaths = Object.keys(schema.paths);

  // Remove internal mongoose paths
  const cleanSchemaPaths = schemaPaths.filter(
    (p) =>
      !["_id", "__v", "createdAt", "updatedAt"].includes(p) &&
      !p.endsWith("._id")
  );

  const sentKeys = Object.keys(body);

  for (let key of sentKeys) {
    const fullPath = path ? `${path}.${key}` : key;

    // Check if this path exists in schema
    const matched = cleanSchemaPaths.find(
      (schemaKey) =>
        schemaKey === fullPath || schemaKey.startsWith(fullPath + ".")
    );

    if (!matched) {
      throw new Error(`Invalid field: "${fullPath}"`);
    }

    // If value is object → validate deeper
    if (
      typeof body[key] === "object" &&
      !Array.isArray(body[key]) &&
      body[key] !== null
    ) {
        validateBodyBySchema(body[key], schema, fullPath);
    }

    // If value is an array → validate each item
    if (Array.isArray(body[key])) {
      body[key].forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
            validateBodyBySchema(item, schema, `${fullPath}.${index}`);
        }
      });
    }
  }
};
