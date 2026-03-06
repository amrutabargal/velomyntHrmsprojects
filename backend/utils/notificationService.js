const Notification = require('../models/Notification');
const User = require('../models/User');

const toMonthDay = (dateObj) => {
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
};

const todayDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
};

const ensureBirthdayNotificationsForToday = async () => {
  const now = new Date();
  const monthDay = toMonthDay(now);
  const dateKey = todayDateKey();

  const activeUsers = await User.find({ status: 'active' }).select('_id name date_of_birth');
  if (!activeUsers.length) return;

  const birthdayUsers = activeUsers.filter((u) => {
    if (!u.date_of_birth) return false;
    return toMonthDay(new Date(u.date_of_birth)) === monthDay;
  });
  if (!birthdayUsers.length) return;

  const ops = [];
  for (const bUser of birthdayUsers) {
    for (const recipient of activeUsers) {
      const dedupeKey = `birthday:${bUser._id.toString()}:${recipient._id.toString()}:${dateKey}`;
      ops.push({
        updateOne: {
          filter: { dedupe_key: dedupeKey },
          update: {
            $setOnInsert: {
              user: recipient._id,
              type: 'birthday_wish',
              title: 'Birthday Notification',
              message: `Today is ${bUser.name}'s birthday. Wish them a wonderful year ahead!`,
              related_type: 'system',
              dedupe_key: dedupeKey,
              created_at: new Date(),
              is_read: false,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (ops.length) {
    await Notification.bulkWrite(ops, { ordered: false });
  }
};

const broadcastNotification = async ({ senderRole, type, title, message, recipientRoles, senderId }) => {
  const users = await User.find({
    status: 'active',
    ...(recipientRoles?.length ? { role: { $in: recipientRoles } } : {}),
  }).select('_id');

  if (!users.length) return 0;

  const ts = Date.now();
  const docs = users.map((u) => ({
    user: u._id,
    type,
    title,
    message,
    related_type: 'system',
    dedupe_key: `broadcast:${type}:${u._id.toString()}:${ts}:${senderId || 'na'}`,
  }));
  await Notification.insertMany(docs);
  return docs.length;
};

module.exports = {
  ensureBirthdayNotificationsForToday,
  broadcastNotification,
};
