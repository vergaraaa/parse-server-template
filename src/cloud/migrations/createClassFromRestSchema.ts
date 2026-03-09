export const createClassFromRestSchema = async (
  restSchema: Parse.TypedRestSchema,
) => {
  const { className, fields, classLevelPermissions } = restSchema;

  const schema = new Parse.Schema(className);

  const exists = await schema
    .get()
    .then((_) => true)
    .catch((_) => false);

  for (const [key, def] of Object.entries(fields)) {
    switch (def.type) {
      case "String":
        schema.addString(key, {
          required: def.required,
          defaultValue: def.defaultValue,
        });
        break;
      case "Number":
        schema.addNumber(key, {
          required: def.required,
          defaultValue: def.defaultValue,
        });
        break;
      case "Boolean":
        schema.addBoolean(key, {
          required: def.required,
          defaultValue: def.defaultValue,
        });
        break;
      case "Date":
        schema.addDate(key, {
          required: def.required,
          defaultValue: def.defaultValue,
        });
        break;
      case "File":
        schema.addFile(key, {
          required: def.required,
          defaultValue: def.defaultValue,
        });
        break;
      case "GeoPoint":
        schema.addGeoPoint(key, {
          required: def.required,
          defaultValue: def.defaultValue,
        });
        break;
      case "Polygon":
        schema.addPolygon(key, {
          required: def.required,
          defaultValue: def.defaultValue,
        });
        break;
      case "Array":
        schema.addArray(key, {
          required: def.required,
          defaultValue: def.defaultValue,
        });
        break;
      case "Object":
        schema.addObject(key, {
          required: def.required,
          defaultValue: def.defaultValue,
        });
        break;
      case "Pointer":
        schema.addPointer(key, def.targetClass, { required: def.required });
        break;
      case "Relation":
        schema.addRelation(key, def.targetClass);
        break;
      default:
        console.warn(`Unsupported field type: ${(def as any).type}`);
    }
  }

  if (restSchema.indexes) {
    for (const [name, index] of Object.entries(restSchema.indexes)) {
      schema.addIndex(name, index);
    }
  }

  schema.setCLP(classLevelPermissions as any);

  try {
    if (exists) {
      await schema.update();
      console.log(`Schema '${className}' updated successfully.`);
    } else {
      await schema.save();
      console.log(`Schema '${className}' created successfully.`);
    }
  } catch (error) {
    console.log("Error saving schema:", error);
  }
};
