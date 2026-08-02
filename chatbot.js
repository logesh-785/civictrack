const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// A lightweight, rule-based assistant. No external AI API key is required,
// so the chatbot works fully offline / on any server without extra setup.
// Swap runReply() for a call to your preferred AI provider later if desired.

const FAQ = [
  {
    keywords: ["report", "how to report", "raise", "complain", "complaint", "new issue"],
    reply:
      "To report an issue: log in, go to 'Report Issue', add a title, category, description, an optional photo, and your location — then submit. You'll get a tracking status right away.",
  },
  {
    keywords: ["track", "status", "where is my", "my issue", "my complaint"],
    reply:
      "You can track every issue you've reported from 'My Dashboard'. Each one shows its current stage: Reported, In Progress, or Resolved.",
  },
  {
    keywords: ["upvote", "vote", "support"],
    reply:
      "Upvoting lets you support an issue someone else already reported, so widespread problems get noticed faster. Just open an issue from 'Browse Issues' and click Upvote.",
  },
  {
    keywords: ["category", "categories", "type of issue", "types"],
    reply:
      "Common categories include Road & Potholes, Streetlights, Garbage & Sanitation, Water Supply, Drainage, and Public Property. Pick the closest match when reporting.",
  },
  {
    keywords: ["admin", "authority", "department", "assign"],
    reply:
      "Authorities use the Admin Dashboard to review new issues, assign them to the right department, and update their status until resolved.",
  },
  {
    keywords: ["register", "sign up", "create account", "account"],
    reply: "You can create a free citizen account from the Register page using your name, email, and a password.",
  },
  {
    keywords: ["login", "log in", "sign in", "password"],
    reply:
      "Citizens log in with their registered email and password. Administrators use the separate Admin Login page.",
  },
  {
    keywords: ["photo", "image", "upload"],
    reply: "When reporting an issue you can attach one photo (JPG, PNG or WEBP, up to 5MB) as proof.",
  },
  {
    keywords: ["resolve", "resolved", "how long", "time"],
    reply:
      "Resolution time depends on the issue and department workload. You'll see the status change to 'Resolved' on your dashboard once it's fixed.",
  },
  {
    keywords: ["contact", "help", "support", "human"],
    reply: "For anything I can't help with, please reach out to your local municipal helpdesk directly.",
  },
];

const GREETINGS = ["hi", "hello", "hey", "vanakkam", "hai"];

function findReply(message) {
  const msg = message.toLowerCase();

  if (GREETINGS.some((g) => msg.trim() === g || msg.startsWith(g + " "))) {
    return "Hi! I'm the Civic Assist bot 👋 Ask me how to report an issue, track a complaint, or use the dashboard.";
  }

  for (const item of FAQ) {
    if (item.keywords.some((k) => msg.includes(k))) {
      return item.reply;
    }
  }

  return "I'm not fully sure about that yet. Try asking about reporting an issue, tracking status, upvoting, or logging in — or check the Help section.";
}

// ---------- POST /api/chatbot ----------
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ reply: "Please type a question first." });
    }

    // A couple of "live data" intents pull real numbers from the DB.
    const msg = message.toLowerCase();
    if (msg.includes("how many") && msg.includes("issue")) {
      const [[row]] = await pool.query("SELECT COUNT(*) AS total FROM issues");
      return res.json({ reply: `There are currently ${row.total} issues logged in the system.` });
    }

    res.json({ reply: findReply(message) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again." });
  }
});

module.exports = router;
