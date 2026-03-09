export const ProfileSchema = {
  className: "Profile",
  fields: {
    firstName: { type: "String", required: true },
    lastName: { type: "String", required: true },
    dateOfBirth: { type: "Date" },
    owner: { type: "Pointer", targetClass: "_User", required: true },
  },
  classLevelPermissions: {
    find: { requiresAuthentication: true },
    get: { requiresAuthentication: true },
    create: { requiresAuthentication: true },
    writeUserFields: ["owner"],
  },
  indexes: {},
} as const satisfies Parse.TypedRestSchema;
