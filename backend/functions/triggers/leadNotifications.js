import * as logger from "firebase-functions/logger";
import { formatLeadData } from "../utils/leadFormatter.js";
import {
  sendResendLeadEmail,
  sendTwilioLeadSms,
} from "../services/notificationService.js";

export const handleNewLead = async (event, db) => {
  const { businessId, leadId } = event.params;
  logger.info(`New Lead Triggered: businessId=${businessId}, leadId=${leadId}`);

  const firestoreFields = event.data?._fieldsProto;
  if (!firestoreFields) {
    logger.error("No lead data found or payload malformed.");
    return;
  }

  const formIdField = firestoreFields?.formId;
  const formId =
    formIdField?.stringValue ||
    formIdField?.integerValue ||
    formIdField?.doubleValue ||
    formIdField?.booleanValue ||
    null;

  let displayName = "Unknown Form";
  if (formId) {
    try {
      const formSnap = await db.doc(`businesses/${businessId}/leadForms/${formId}`).get();
      if (formSnap.exists) {
        displayName = formSnap.data()?.displayName || "Unnamed Form";
      }
    } catch (err) {
      logger.error("Failed to fetch form display name:", err);
    }
  }

  const { leadHTML, leadText } = formatLeadData(firestoreFields);

  try {
    const bizSnap = await db.doc(`businesses/${businessId}`).get();
    const bizData = bizSnap.data();
    
    const bizEmail = bizData?.email;
    const bizPhone = bizData?.phone;
    const notifyEmail = bizData?.notifyEmail !== false; 
    const notifySMS = bizData?.notifySMS === true;      

    await Promise.allSettled([
      sendResendLeadEmail({ bizEmail, displayName, leadHTML, notifyEmail, businessId }),
      sendTwilioLeadSms({ bizPhone, displayName, leadText, notifySMS, businessId })
    ]);

  } catch (err) {
    logger.error("Error handling lead notification:", err);
  }
};