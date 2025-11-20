// api/run.js
export default async function handler(req, res) {
  // 从环境变量读取配置（在 Vercel 后台设置）
  const QL_HOST = process.env.QL_HOST;
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const TASK_ID = process.env.TASK_ID;

  // 校验环境变量
  if (!QL_HOST || !CLIENT_ID || !CLIENT_SECRET || !TASK_ID) {
    return res.status(500).json({ error: "Missing environment variables in Vercel" });
  }

  try {
    // Step 1: 获取 Qinglong Token
    const tokenUrl = `${QL_HOST}/open/auth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.data?.token) {
      console.error("Token fetch failed:", tokenData);
      return res.status(500).json({ error: "Failed to get Qinglong token" });
    }

    const token = tokenData.data.token;

    // Step 2: 触发脚本运行（通过任务 ID）
    const runUrl = `${QL_HOST}/open/crons/run`;
    const runRes = await fetch(runUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: [parseInt(TASK_ID, 10)] }),
    });

    if (!runRes.ok) {
      const err = await runRes.text();
      console.error("Run script failed:", err);
      return res.status(500).json({ error: "Failed to trigger script" });
    }

    // 成功响应
    res.status(200).json({ success: true, message: "脚本已启动，请稍后查看日志！" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}