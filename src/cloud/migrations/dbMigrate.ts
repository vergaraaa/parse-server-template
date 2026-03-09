import { schemaDefinitions } from "../schemas";
import { createClassFromRestSchema } from "./createClassFromRestSchema";

Parse.Cloud.define(
  "dbMigrate",
  async () => {
    const createClassFromSchemaPromises: Promise<void>[] = [];

    schemaDefinitions.forEach((schemaDefinition) => {
      createClassFromSchemaPromises.push(
        createClassFromRestSchema(schemaDefinition),
      );
    });

    await Promise.all(createClassFromSchemaPromises);
  },
  {
    requireMaster: true,
    validateMasterKey: true,
  },
);
