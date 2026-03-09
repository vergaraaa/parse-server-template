export const TestSchema = {
  className: "Test",
  fields: {
    test: { type: "String" },
    owner: { type: "Pointer", targetClass: "_User" },
  },
  classLevelPermissions: {
    find: { requiresAuthentication: true },
    get: { requiresAuthentication: true },
    create: { requiresAuthentication: true },
    update: { "role:Admin": true },
    delete: { "role:Admin": true },
  },
} as const satisfies Parse.TypedRestSchema;
