export const formatLeadData = (firestoreFields) => {
  const emailBody = [];
  let smsBody = "";

  for (const [fieldId, val] of Object.entries(firestoreFields)) {
    if (["timestamp", "formId"].includes(fieldId)) continue;

    if (val.mapValue && val.mapValue.fields) {
      const label = val.mapValue.fields.label?.stringValue || fieldId;
      const fieldValue = val.mapValue.fields.value;

      let value = "—";

      if (fieldValue?.stringValue !== undefined && fieldValue?.stringValue !== null) {
        value = (fieldValue.stringValue || "").trim() || "—";
      } else if (fieldValue?.arrayValue !== undefined) {
        const arr = fieldValue.arrayValue.values || [];
        const joined = arr
          .map(item =>
            item.stringValue ||
            item.integerValue ||
            item.doubleValue ||
            (item.booleanValue !== undefined ? (item.booleanValue ? "Yes" : "No") : "")
          )
          .filter(v => v !== "")
          .join(", ");
        value = joined || "—";
      } else if (fieldValue?.mapValue !== undefined) {
        const vals = Object.values(fieldValue.mapValue.fields || {})
          .map(item => item.stringValue || "")
          .filter(v => v !== "");
        value = vals.length ? vals.join(", ") : "—";
      } else if (fieldValue?.integerValue !== undefined) {
        value = fieldValue.integerValue.toString();
      } else if (fieldValue?.doubleValue !== undefined) {
        value = fieldValue.doubleValue.toString();
      } else if (fieldValue?.booleanValue !== undefined) {
        value = fieldValue.booleanValue ? "Yes" : "No";
      }

      emailBody.push(`<p><strong>${label}:</strong> ${value}</p>`);
      smsBody += `\n${label}: ${value}`;
    } else {
      // Handles the fallback block originally only present in the email loop
      const value =
        val.stringValue ||
        val.integerValue ||
        val.doubleValue ||
        (val.booleanValue !== undefined ? (val.booleanValue ? "Yes" : "No") : "—");
      emailBody.push(`<p><strong>${fieldId}:</strong> ${value}</p>`);
    }
  }

  return {
    leadHTML: emailBody.join(""),
    leadText: smsBody,
  };
};