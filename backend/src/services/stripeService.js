import { logger } from "../utils/logger.js";

export async function createCheckoutSession({ stripe, email, uid, successUrl, cancelUrl }) {
  let customer;

  const customers = await stripe.customers.list({ email });
  if (customers.data.length > 0) {
    customer = customers.data[0];
  } else {
    customer = await stripe.customers.create({ email, metadata: { uid } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    customer: customer.id,
    metadata: { uid },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 30,
    },
  });

  return session.url;
}

export async function createPortalSession({ stripe, db, uid, returnUrl }) {
  const bizSnap = await db.collection("businesses").doc(uid).get();
  const data = bizSnap.data();

  if (!data?.stripeCustomerId) {
    throw new Error("No Stripe customer ID found");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: data.stripeCustomerId,
    return_url: returnUrl || "https://barnegon.com/dashboard.html",
  });

  return portalSession.url;
}

/**
 * Handles Stripe webhook events to update business status in Firestore.
 */
export async function handleWebhookEvent(event, db) {
  const type = event.type;

  // 1. Idempotency Check using Firestore .create()
  const eventRef = db.collection("stripe_events").doc(event.id);
  try {
    // This fails atomically if the event.id already exists in the database
    await eventRef.create({
      type: event.type,
      processedAt: new Date().toISOString()
    });
  } catch (err) {
    // 6 is the gRPC status code for ALREADY_EXISTS used by Firebase Admin
    if (err.code === 6) { 
      logger.info("stripe_event_duplicate_skipped", { eventId: event.id, type });
      return; 
    }
    throw err;
  }

  // 2. Checkout Completed -> Activate Account
  if (type === "checkout.session.completed") {
    const session = event.data.object;
    const uid = session.metadata?.uid;
    const customerId = session.customer;

    if (!uid) {
      logger.warn("stripe_webhook_missing_uid", { eventId: event.id });
      return;
    }

    try {
      await db.collection("businesses").doc(uid).set(
        { isActive: true, stripeCustomerId: customerId },
        { merge: true }
      );
      logger.info("user_activated", { uid, eventId: event.id });
    } catch (err) {
      logger.error("user_activation_failed", err, { uid, eventId: event.id });
      throw err;
    }
    return;
  }

  // 3. Subscription Deleted or Payment Failed -> Deactivate Account
  if (type === "customer.subscription.deleted" || type === "invoice.payment_failed") {
    const obj = event.data.object;
    const customerId = obj.customer;

    try {
      const snapshot = await db
        .collection("businesses")
        .where("stripeCustomerId", "==", customerId)
        .get();

      if (snapshot.empty) {
        logger.warn("stripe_customer_not_found_in_db", { customerId, eventId: event.id });
        return;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.set(doc.ref, { isActive: false }, { merge: true });
      });
      await batch.commit();

      logger.info("users_deactivated", { count: snapshot.size, type, customerId, eventId: event.id });
    } catch (err) {
      logger.error("user_deactivation_failed", err, { customerId, eventId: event.id });
      throw err;
    }
  }
}