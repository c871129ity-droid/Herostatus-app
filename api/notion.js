export const config = { runtime: "edge" };

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const HERO_DB = process.env.HERO_DB;
const HABITS_DB = process.env.HABITS_DB;
const QUESTS_DB = process.env.QUESTS_DB;
const ACCOUNTS_DB = process.env.ACCOUNTS_DB;

async function queryDB(dbId) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  return res.json();
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    if (type === "hero") {
      const data = await queryDB(HERO_DB);
      const page = data.results[0];
      const props = page.properties;
      return Response.json({
        name: props["角色名稱"]?.title?.[0]?.plain_text || "英雄",
        title: props["職業稱號"]?.select?.name || "街頭浪人",
        exp: props["當前經驗值_EXP"]?.number || 0,
      });
    }

    if (type === "habits") {
      const data = await queryDB(HABITS_DB);
      return Response.json(data.results.map(p => ({
        id: p.id,
        name: p.properties["項目名稱"]?.title?.[0]?.plain_text || "",
        difficulty: p.properties["難度評級"]?.select?.name || "E級",
        exp: p.properties["EXP產出"]?.number || 0,
        streak: p.properties["連續達成天數"]?.number || 0,
        done: p.properties["當日狀態"]?.checkbox || false,
      })));
    }

    if (type === "quests") {
      const data = await queryDB(QUESTS_DB);
      return Response.json(data.results.map(p => ({
        id: p.id,
        name: p.properties["任務名稱"]?.title?.[0]?.plain_text || "",
        difficulty: p.properties["任務難度"]?.select?.name || "D級：雜魚",
        exp: p.properties["獎勵_EXP"]?.number || 0,
        gold: p.properties["獎勵_金幣"]?.number || 0,
        done: p.properties["狀態"]?.checkbox || false,
      })));
    }

    if (type === "accounts") {
      const data = await queryDB(ACCOUNTS_DB);
      return Response.json(data.results.map(p => ({
        id: p.id,
        name: p.properties["名稱"]?.title?.[0]?.plain_text || "",
        type: p.properties["類別"]?.select?.name || "資產",
        balance: p.properties["快照餘額"]?.number || 0,
      })));
    }

    return Response.json({ error: "Unknown type" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
