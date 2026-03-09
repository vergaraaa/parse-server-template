import "./migrations";
import "./parseObjects";
import "./profile";
import "./schemas";

// 1. Define the exact shape of the parameters your function expects
interface IUpdateStatusParams {
  status: string;
  reason?: string;
}

Parse.Cloud.define(
  "updateUserStatus",
  async (request) => {
    // 2. Cast request.params to your interface for perfect autocomplete!
    const { status, reason } = request.params as IUpdateStatusParams;

    // Now TypeScript knows 'status' is a string, and 'reason' might be undefined.
    // We also don't need to check if the user is logged in, because the
    // validator object below already guaranteed it!
    const user = request.user!;

    // user.set("status", status);
    // if (reason) user.set("statusReason", reason);

    // await user.save(null, { useMasterKey: true });
    return "Status updated successfully.";
  },
  {
    requireUser: true, // MUST be logged in
    fields: {
      status: {
        required: true,
        type: String, // Note: This uses the JS String constructor
        options: ["active", "inactive", "banned"],
        // error: "Status must be a valid state: active, inactive, or banned.",
      },
      reason: {
        required: true,
        type: String,
        options: (val: any) => val.length < 100,
        error: "Reason must be under 100 characters.",
      },
    },
  },
);
