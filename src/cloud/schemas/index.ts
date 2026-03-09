import { ProfileSchema } from "./profile.schema";
import { TestSchema } from "./test.schema";

export { ProfileSchema, TestSchema };

export const schemaDefinitions: Parse.TypedRestSchema[] = [
  ProfileSchema,
  TestSchema,
];
