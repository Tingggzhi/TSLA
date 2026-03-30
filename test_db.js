const { getDashboardData } = require('./src/db/database');
(async () => {
    try {
        const data = await getDashboardData();
        console.log(JSON.stringify(data, null, 2));
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
})();
