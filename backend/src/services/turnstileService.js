import fetch from "node-fetch";
import { db } from "../../firebase-admin.js"; 
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const CF_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/challenges/widgets`;
const DOMAIN_LIMIT = 10;

export async function provisionTurnstileDomain(newDomain) {
  const widgetsRef = db.collection('turnstile_widgets');
  
  const availableWidgetsSnapshot = await widgetsRef
    .where('domainCount', '<', DOMAIN_LIMIT)
    .limit(1)
    .get();

  if (!availableWidgetsSnapshot.empty) {
    const widgetDoc = availableWidgetsSnapshot.docs[0];
    const widgetData = widgetDoc.data();
    
    if (widgetData.domains.includes(newDomain)) {
        return { sitekey: widgetData.sitekey, secret: widgetData.secret }; 
    }

    const updatedDomains = [...widgetData.domains, newDomain];

    await updateCloudflareWidget(widgetData.sitekey, updatedDomains, widgetData.name);

    await widgetDoc.ref.update({
      domains: updatedDomains,
      domainCount: updatedDomains.length,
      updatedAt: new Date().toISOString()
    });

    logger.info(`Added domain ${newDomain} to existing Turnstile widget ${widgetData.sitekey}`);
    return { sitekey: widgetData.sitekey, secret: widgetData.secret };
  }

  logger.info(`Creating a new widget for domain: ${newDomain}`);
  const widgetName = `Auto-Provisioned Widget - ${Date.now()}`;
  
  const cfResponse = await fetch(CF_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: widgetName,
      domains: [newDomain],
      mode: 'invisible' // Fixed to invisible!
    })
  });

  if (!cfResponse.ok) {
    const errorData = await cfResponse.json();
    logger.error("Failed to create Cloudflare Turnstile widget", { errorData });
    throw new Error("Cloudflare API Widget Creation Failed");
  }

  const { result } = await cfResponse.json();

  await widgetsRef.doc(result.sitekey).set({
    sitekey: result.sitekey,
    secret: result.secret,
    name: widgetName,
    domains: [newDomain],
    domainCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  logger.info(`Successfully created new Turnstile widget ${result.sitekey}`);
  return { sitekey: result.sitekey, secret: result.secret };
}

// NEW FUNCTION: Kills the Zombie Domains
export async function removeTurnstileDomain(domainToRemove) {
  if (!domainToRemove) return;

  const widgetsRef = db.collection('turnstile_widgets');
  
  // Find the specific widget holding this zombie domain
  const snapshot = await widgetsRef
    .where('domains', 'array-contains', domainToRemove)
    .limit(1)
    .get();

  if (snapshot.empty) {
    logger.info(`Domain ${domainToRemove} not found in any Turnstile widgets. Skipping removal.`);
    return;
  }

  const widgetDoc = snapshot.docs[0];
  const widgetData = widgetDoc.data();

  // Filter the domain out of the array
  const updatedDomains = widgetData.domains.filter(d => d !== domainToRemove);

  try {
    await updateCloudflareWidget(widgetData.sitekey, updatedDomains, widgetData.name);

    await widgetDoc.ref.update({
      domains: updatedDomains,
      domainCount: updatedDomains.length,
      updatedAt: new Date().toISOString()
    });

    logger.info(`Successfully removed zombie domain ${domainToRemove}. Widget ${widgetData.sitekey} now has ${updatedDomains.length} slots taken.`);
  } catch (error) {
    logger.error(`Failed to remove zombie domain ${domainToRemove}`, { error: error.message });
  }
}

async function updateCloudflareWidget(sitekey, domains, name) {
  const cfResponse = await fetch(`${CF_API_BASE}/${sitekey}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name,
      domains: domains,
      mode: 'invisible' // Fixed to invisible!
    })
  });

  if (!cfResponse.ok) {
    const errorData = await cfResponse.json();
    logger.error(`Failed to update Turnstile widget ${sitekey}`, { errorData });
    throw new Error("Cloudflare API Widget Update Failed");
  }
}