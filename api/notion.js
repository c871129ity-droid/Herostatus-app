export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DBS = {
    hero: process.env.HERO_DB,
    habits: process.env.HABITS_DB,
    quests: process.env.QUESTS_DB,
    accounts: process.env.ACCOUNTS_DB,
  };

  const type = req.query?.type || new URL(req.url, "http://localhost").searchParams.get("type");

  async function queryDB(dbId) {
    const r = await fetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );
    if (!r.ok) throw new Error(`Notion API error: ${r.status}`);
    return r.json();
  }

  try {
    if (type === "hero") {
      const data = await queryDB(DBS.hero);
      const props = data.results[0]?.properties || {};
      return res.status(200).json({
        name: props["角色名稱"]?.title?.[0]?.plain_text || "英雄",
        title: props["職業稱號"]?.select?.name || "街頭浪人",
        exp: props["當前經驗值_EXP"]?.number || 0,
      });
    }
    if (type === "habits") {
  const data = await queryDB(DBS.habits);
  return res.status(200).json(
    data.results.map((p) => ({
      id: p.id,
      name: p.properties["訓練/修復項目"]?.title?.[0]?.plain_text || "",
      difficulty: p.properties["難度評級"]?.select?.name || "E級：微習慣",
      exp: 10,
      streak: p.properties["連續達成天數_Streak"]?.number || 0,
      done: p.properties["當日狀態"]?.checkbox || false,
    }))
  );
}
    if (type === "quests") {
      const data = await queryDB(DBS.quests);
      return res.status(200).json(
        data.results.map((p) => ({
          id: p.id,
          name: p.properties["任務名稱"]?.title?.[0]?.plain_text || "",
          difficulty: p.properties["任務難度"]?.select?.name || "D級：雜魚",
          exp: p.properties["獎勵_EXP"]?.number || 0,
          gold: p.properties["獎勵_金幣"]?.number || 0,
          done: p.properties["狀態"]?.checkbox || false,
        }))
      );
    }
    if (type === "accounts") {
      const data = await queryDB(DBS.accounts);
      return res.status(200).json(
        data.results.map((p) => ({
          id: p.id,
          name: p.properties["名稱"]?.title?.[0]?.plain_text || "",
          type: p.properties["類別"]?.select?.name || "資產",
          balance: p.properties["快照餘額"]?.number || 0,
        }))
      );
    }
    return res.status(400).json({ error: "Unknown type" });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
