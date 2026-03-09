import { ProfileSchema } from "../schemas";

export type IProfileAttributes = Parse.AttributesFromSchema<
  typeof ProfileSchema
>;

export class ProfileObject extends Parse.Object<IProfileAttributes> {
  constructor(attributes?: IProfileAttributes) {
    super(ProfileSchema.className, attributes);
  }

  getFirstName(): string {
    return this.get("firstName");
  }

  getLastName(): string {
    return this.get("lastName");
  }

  getDateOfBirth(): Date | undefined {
    return this.get("dateOfBirth");
  }

  getOwner(): Parse.User {
    return this.get("owner");
  }

  static async create(data: IProfileAttributes): Promise<ProfileObject> {
    const profile = new ProfileObject();

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        profile.set(key as keyof IProfileAttributes, value);
      }
    }

    const acl = new Parse.ACL(data.owner);
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(false);
    profile.setACL(acl);

    try {
      return await profile.save(null, { useMasterKey: true });
    } catch (error) {
      console.error("Failed to create Profile:", error);
      throw new Parse.Error(
        Parse.Error.CONNECTION_FAILED,
        "Could not save Profile",
      );
    }
  }
}

Parse.Object.registerSubclass(ProfileSchema.className, ProfileObject);
