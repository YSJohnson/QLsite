// 文件路径：api/task-status.js
module.exports = async function handler(req, res) {
  // 设置 CORS（同 run.js）
  const ALLOWED_ORIGINS = [
    'https://ysjohnson.top',
    'https://ysjohnson.github.io',
    'https://ql.ysjohnson.top',
    'https://qlsite.vercel.app'
  ];

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const QL_HOST = process.env.QL_HOST;
    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const TASK_ID = parseInt(process.env.TASK_ID, 10);

    if (!QL_HOST || !CLIENT_ID || !CLIENT_SECRET || isNaN(TASK_ID)) {
      return res.status(500).json({ error: "Missing environment variables" });
    }

    // 获取 token
    const tokenUrl = `${QL_HOST}/open/auth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.data?.token) {
      return res.status(500).json({ error: "Failed to get auth token" });
    }
    const token = tokenData.data.token;

    // 获取任务状态（青龙 API：GET /open/crons/{id}）
    const cronUrl = `${QL_HOST}/open/crons/${TASK_ID}`;
    const cronRes = await fetch(cronUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!cronRes.ok) {
      return res.status(500).json({ error: "Failed to fetch cron info" });
    }

    const cron = await cronRes.json();
    const isRunning = cron?.data?.isRunning || false; // 青龙返回字段可能是 isRunning

    res.status(200).json({ running: isRunning });
  } catch (error) {
    console.error("Task status check error:", error);
    res.status(500).json({ error: "Internal error", message: error.message });
  }
};
