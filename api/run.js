module.exports = async function handler(req, res) {
  // CORS headers
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

    // 调试日志
    console.log("✅ QL_HOST:", QL_HOST);
    console.log("✅ TASK_ID:", TASK_ID, "(type:", typeof TASK_ID, ")");

    if (!QL_HOST || !CLIENT_ID || !CLIENT_SECRET || isNaN(TASK_ID)) {
      return res.status(500).json({ error: "Missing or invalid environment variables" });
    }

    // Step 1: 获取 token
    const tokenUrl = `${QL_HOST}/open/auth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const tokenRes = await fetch(tokenUrl, { method: 'GET' });

    let tokenText = await tokenRes.text();
    if (!tokenRes.ok) {
      console.error("❌ Token fetch failed:", tokenText);
      return res.status(500).json({ error: "Failed to get token", details: tokenText });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      console.error("❌ Invalid token JSON:", tokenText);
      return res.status(500).json({ error: "Invalid token response" });
    }

    const token = tokenData?.data?.token;
    if (!token) {
      return res.status(500).json({ error: "Token not found in response", response: tokenData });
    }

    // Step 2: 触发任务 —— 方法2：手动拼接 URL（确保无多余字符）
    const runUrl = `${QL_HOST}/open/crons/run?id=${TASK_ID}`;
    console.log("🚀 Triggering task at URL:", runUrl);

    const runRes = await fetch(runUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const runStatus = runRes.status;
    const runBody = await runRes.text(); // 只读一次！

    console.log("📡 Run response status:", runStatus);
    console.log("📄 Run response body:", runBody);

    if (runStatus !== 200) {
      return res.status(500).json({
        error: "Failed to trigger script",
        status: runStatus,
        body: runBody
      });
    }

    // 成功返回
    res.status(200).json({ success: true, message: "脚本已成功启动！" });

  } catch (error) {
    console.error("💥 Unhandled error:", error.message);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
};
