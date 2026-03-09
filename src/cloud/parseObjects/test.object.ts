import { TestSchema } from "../schemas/test.schema";

// Automatically extracts { test?: string, owner?: Parse.User }
export type ITestObjectAttributes = Parse.AttributesFromSchema<
  typeof TestSchema
>;

export class TestObject extends Parse.Object<ITestObjectAttributes> {
  constructor(attributes?: ITestObjectAttributes) {
    super(TestSchema.className, attributes as any);
  }

  // --- INSTANCE METHODS (Getters) ---
  getTest(): string | undefined {
    return this.get("test");
  }
  getOwner(): Parse.User | undefined {
    return this.get("owner");
  }

  // --- REPOSITORY METHODS (Static) ---
  static async findByOwner(user: Parse.User): Promise<TestObject[]> {
    const query = new Parse.Query(TestObject);
    query.equalTo("owner", user);
    return await query.find({ useMasterKey: true }); // Secure internal query
  }

  static async create(
    testString: string,
    owner: Parse.User,
  ): Promise<TestObject> {
    const testObj = new TestObject({ test: testString, owner });
    return await testObj.save(null, { useMasterKey: true });
  }
}

Parse.Object.registerSubclass(TestSchema.className, TestObject);
