const { checkSubscriptionsExpiration } = require('../backend/cron');
const { connectDB } = require('../backend/config/database');

async function test() {
    await connectDB();
    await checkSubscriptionsExpiration();
    process.exit(0);
}

test();
