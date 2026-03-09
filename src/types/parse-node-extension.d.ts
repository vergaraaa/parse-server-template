import parse from "parse/node";

declare global {
  namespace Parse {
    type TypedField =
      | { type: "String"; required?: boolean; defaultValue?: string }
      | { type: "Number"; required?: boolean; defaultValue?: number }
      | { type: "Boolean"; required?: boolean; defaultValue?: boolean }
      | { type: "Date"; required?: boolean; defaultValue?: Date }
      | {
          type: "Object";
          required?: boolean;
          defaultValue?: Record<string, any>;
        }
      | { type: "Array"; required?: boolean; defaultValue?: any[] }
      | { type: "GeoPoint"; required?: boolean; defaultValue?: Parse.GeoPoint }
      | { type: "File"; required?: boolean; defaultValue?: Parse.File }
      | { type: "Bytes"; required?: boolean; defaultValue?: string }
      | { type: "Polygon"; required?: boolean; defaultValue?: Parse.Polygon }
      | { type: "Pointer"; targetClass: string; required?: boolean }
      | { type: "Relation"; targetClass: string };

    interface RestSchemaCLPField {
      "*"?: boolean;
      requiresAuthentication?: boolean;
      [userIdOrRoleName: string]: boolean | undefined;
    }

    interface RestSchemaCLP {
      find?: RestSchemaCLPField;
      get?: RestSchemaCLPField;
      count?: RestSchemaCLPField;
      create?: RestSchemaCLPField;
      update?: RestSchemaCLPField;
      delete?: RestSchemaCLPField;
      addField?: RestSchemaCLPField;
      readUserFields?: readonly string[];
      writeUserFields?: readonly string[];
      protectedFields?: Record<string, readonly string[]>;
    }

    interface TypedRestSchema extends Omit<
      Parse.RestSchema,
      "fields" | "classLevelPermissions"
    > {
      fields: { [key: string]: TypedField };
      classLevelPermissions: RestSchemaCLP;
    }

    type MapParseType<T> = T extends { type: "String" | "Bytes" }
      ? string
      : T extends { type: "Number" }
        ? number
        : T extends { type: "Boolean" }
          ? boolean
          : T extends { type: "Date" }
            ? Date
            : T extends { type: "Pointer"; targetClass: "_User" }
              ? Parse.User
              : T extends { type: "Pointer" }
                ? Parse.Object
                : T extends { type: "Array" }
                  ? any[]
                  : T extends { type: "Object" }
                    ? Record<string, any>
                    : T extends { type: "File" }
                      ? Parse.File
                      : T extends { type: "GeoPoint" }
                        ? Parse.GeoPoint
                        : T extends { type: "Polygon" }
                          ? Parse.Polygon
                          : T extends { type: "Relation" }
                            ? Parse.Relation
                            : any;

    type ExtractRequired<Fields> = {
      [K in keyof Fields as Fields[K] extends { required: true }
        ? K
        : never]: MapParseType<Fields[K]>;
    };

    type ExtractOptional<Fields> = {
      [K in keyof Fields as Fields[K] extends { required: true }
        ? never
        : K]?: MapParseType<Fields[K]>;
    };

    type AttributesFromSchema<Schema extends { fields: any }> = ExtractRequired<
      Schema["fields"]
    > &
      ExtractOptional<Schema["fields"]>;

    interface JSONBaseAttributes {
      ACL: Parse.ACL;
    }

    namespace Cloud {
      interface FunctionRequest {
        headers: Record<string, string | undefined>;
        functionName: string;
      }
    }
  }
}
