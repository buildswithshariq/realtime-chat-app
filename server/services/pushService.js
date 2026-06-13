const webpush = require("web-push");
const User = require("../models/User");

const sendPushNotification = async ({ recipient, payload }) => {
    if (!recipient.pushSubscriptions || recipient.pushSubscriptions.length === 0) {
        return;
    }

    const payloadString = JSON.stringify(payload);
    const deadSubscriptions = [];

    const sendPromises = recipient.pushSubscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: sub.keys,
                },
                payloadString
            );
        } catch (error) {
            console.error("Error sending push notification to endpoint:", sub.endpoint, error.statusCode);
            if (error.statusCode === 404 || error.statusCode === 410) {
                deadSubscriptions.push(sub._id);
            }
        }
    });

    await Promise.allSettled(sendPromises);

    // Cleanup dead subscriptions
    if (deadSubscriptions.length > 0) {
        try {
            await User.findByIdAndUpdate(recipient._id, {
                $pull: { pushSubscriptions: { _id: { $in: deadSubscriptions } } }
            });
            console.log(`Cleaned up ${deadSubscriptions.length} dead push subscriptions for user ${recipient._id}`);
        } catch (cleanupError) {
            console.error("Failed to clean up push subscriptions:", cleanupError);
        }
    }
};

module.exports = { sendPushNotification };
