import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { escape } from "jsr:@std/html/entities";

const homeDir = Deno.env.get("HOME");
const xdgDataHome = Deno.env.get("XDG_DATA_HOME") ||
  (homeDir ? path.join(homeDir, ".local", "share") : null);

if (!xdgDataHome) {
  throw new Error(
    "Neither XDG_DATA_HOME nor HOME environment variables are set.",
  );
}

const db = new DatabaseSync(path.join(xdgDataHome, "newsboat", "cache.db"));

try {
  db.exec(`
    UPDATE rss_item
    SET unread = 0
    WHERE feedurl IN (SELECT feedurl
                      FROM rss_item
                      GROUP BY feedurl
                      HAVING min(unread) = 1)
      AND id NOT IN (SELECT id
                     FROM (SELECT id, max(pubDate)
                           FROM rss_item
                           GROUP BY feedurl));
  `);

  const unreadItems = db.prepare(`
    SELECT id, url, pubDate
    FROM rss_item
    WHERE unread = 1
    ORDER BY pubDate;
  `);

  const markItemAsRead = db.prepare(`
    UPDATE rss_item
    SET unread = 0
    WHERE id = ?;
  `);

  const botToken = Deno.env.get("BOT_TOKEN");
  if (!botToken) throw new Error("BOT_TOKEN environment variable is missing.");
  const chatId = Deno.env.get("CHAT_ID");
  if (!chatId) throw new Error("CHAT_ID environment variable is missing.");

  for (const item of unreadItems.iterate()) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            parse_mode: "HTML",
            link_preview_options: {
              url: item.url,
              prefer_small_media: true,
              show_above_text: true,
            },
            text: `<i><tg-time unix="${item.pubDate}" format="wDT">${
              escape(new Date(item.pubDate * 1000).toUTCString())
            }</tg-time></i>`,
          }),
        },
      );
      if (response.ok) {
        markItemAsRead.run(item.id);
      } else {
        const errorBody = await response.text();
        console.error(
          `Failed to send message for item ${item.id}: [${response.status}] ${response.statusText}`,
        );
        console.error(`Telegram API Response: ${errorBody}`);
      }
    } catch (error) {
      console.error(`Network error sending item ${item.id}:`, error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
} finally {
  db.close();
}
