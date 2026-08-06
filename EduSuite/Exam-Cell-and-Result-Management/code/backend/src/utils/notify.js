import Notification from '../models/Notification.js';

// Creates a notification for a single recipient. Fails silently (logged) so
// a notification failure never breaks the primary action that triggered it.
export const notifyUser = async ({ recipient, title, message, type = 'info', link }) => {
  try {
    await Notification.create({ recipient, title, message, type, link });
  } catch (err) {
    console.error('Notification create failed:', err.message);
  }
};

// Creates the same notification for many recipients at once.
export const notifyMany = async (recipientIds, { title, message, type = 'info', link }) => {
  try {
    const docs = recipientIds.map((recipient) => ({ recipient, title, message, type, link }));
    if (docs.length) await Notification.insertMany(docs);
  } catch (err) {
    console.error('Bulk notification create failed:', err.message);
  }
};
