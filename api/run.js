module.exports = async function handler(req, res) {
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

    console.log("✅ QL_HOST:", QL_HOST);
    console.log("✅ TASK_ID:", TASK_ID, "(type:", typeof TASK_ID, ")");

    if (!QL_HOST || !CLIENT_ID || !CLIENT_SECRET || isNaN(TASK_ID)) {
      return res.status(500).json({ error: "Missing or invalid environment variables" });
    }

    // Step 1: 获取 token
    const tokenUrl = `${QL_HOST}/open/auth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const tokenRes = await fetch(tokenUrl, { method: 'GET' });

    const tokenText = await tokenRes.text();
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
      return res.status(500).json({ error: "Token not found", response: tokenData });
    }

    // ✅ Step 2: 使用 PUT + JSON 数组 body（新版青龙要求！）
    const runUrl = `${QL_HOST}/open/crons/run`;
    console.log("🚀 Sending PUT request to:", runUrl);
    console.log("📦 Body payload:", [TASK_ID]);

    const runRes = await fetch(runUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([TASK_ID]) // ← 关键：传 [41]，不是 {id:41}，也不是 URL 参数
    });

    const runBody = await runRes.text();
    console.log("📡 Status:", runRes.status);
    console.log("📄 Response:", runBody);

    if (!runRes.ok) {
      return res.status(500).json({
        error: "Failed to trigger script",
        status: runRes.status,
        body: runBody
      });
    }

    res.status(200).json({ success: true, message: "脚本已成功启动！" });

  } catch (error) {
    console.error("💥 Fatal error:", error.message);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
};


