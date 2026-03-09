import { ProfileObject } from "../parseObjects";

Parse.Cloud.beforeSave<ProfileObject>(ProfileObject, async (request) => {
  const { object, user } = request;

  if (object.isNew()) {
    if (!user) {
      throw new Parse.Error(
        Parse.Error.SCRIPT_FAILED,
        "You must be logged in to create a Profile.",
      );
    }

    object.set("owner", user);

    const acl = new Parse.ACL(user);
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(false);

    object.setACL(acl);
  }
});
