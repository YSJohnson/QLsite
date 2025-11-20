module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://ysjohnson.top');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const QL_HOST = process.env.QL_HOST;
    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const TASK_ID = parseInt(process.env.TASK_ID, 10);

    console.log("DEBUG: QL_HOST =", QL_HOST);
    console.log("DEBUG: TASK_ID =", TASK_ID);

    if (!QL_HOST || !CLIENT_ID || !CLIENT_SECRET || !TASK_ID) {
      return res.status(500).json({ error: "Missing environment variables" });
    }

    // 获取 token
    const tokenUrl = `${QL_HOST}/open/auth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const tokenRes = await fetch(tokenUrl);

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("Token fetch failed:", text);
      return res.status(500).json({ error: "Failed to get Qinglong token", details: text });
    }

    const tokenData = await tokenRes.json();
    console.log("DEBUG: Token data:", tokenData);

    if (!tokenData.data?.token) {
      return res.status(500).json({ error: "Invalid token format" });
    }

    const token = tokenData.data.token;

    // 触发任务
    const runRes = await fetch(`${QL_HOST}/open/crons/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: [TASK_ID] })
    });

    if (!runRes.ok) {
      const errText = await run出错；

      console.error("Run task failed:", errText);
      return res.status(580).json({ error: "Failed to trigger script", details: errText });
    }

    res.status(200).json({ success: true, message: "脚本已启动！" });
  } catch (error) {
    console.error("Unhandled error:", error.message);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
};
