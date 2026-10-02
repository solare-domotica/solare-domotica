/**
 * SOLARIS — relais "prospects abandonnés"
 * ----------------------------------------
 * Reçoit les signaux envoyés par le site (assets/js/main.js → sendLead)
 * et, uniquement quand un visiteur quitte le simulateur SANS le terminer,
 * ajoute une ligne au fichier texte `leads/abandoned.txt` du dépôt GitHub,
 * via l'API GitHub (lecture du fichier existant, ajout de la ligne,
 * réécriture). Les étapes "in_progress" et "completed" sont ignorées ici
 * volontairement : "in_progress" n'est qu'un filet de sécurité côté
 * navigateur, et "completed" part déjà par WhatsApp — seul "abandoned"
 * doit atterrir dans ce fichier.
 *
 * Si le fichier est vidé (ou supprimé) directement sur GitHub, la ligne
 * suivante repart d'un fichier vide : aucune trace de ce qui a été
 * supprimé n'est conservée nulle part.
 *
 * Variables à configurer dans Cloudflare (Worker → Settings → Variables) :
 *   GITHUB_TOKEN   (Secret)  — fine-grained PAT, permission "Contents: Read and write" sur le repo
 *   GITHUB_OWNER   (Text)    — ex. "maxmcneil"
 *   GITHUB_REPO    (Text)    — ex. "solaris"
 *   GITHUB_PATH    (Text)    — ex. "leads/abandoned.txt"
 *   GITHUB_BRANCH  (Text)    — ex. "main"
 *
 * Voir LEAD-CAPTURE-SETUP.md à la racine du site pour la mise en place complète.
 */

const COLUMNS = [
  "when", "lang", "page", "stepLabel",
  "type", "goal", "budget", "address",
  "firstname", "lastname", "phone", "email"
];

function toLine(data) {
  const stepLabel = `${data.step || ""}/${data.totalSteps || ""}`;
  const row = {
    when: data.when || new Date().toISOString(),
    lang: data.lang || "",
    page: data.page || "",
    stepLabel,
    type: data.type || "",
    goal: data.goal || "",
    budget: data.budget || "",
    address: data.address || "",
    firstname: data.firstname || "",
    lastname: data.lastname || "",
    phone: data.phone || "",
    email: data.email || ""
  };
  return COLUMNS
    .map((key) => String(row[key] || "").replace(/[\t\n\r]+/g, " ").trim())
    .join("\t") + "\n";
}

function b64EncodeUtf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64DecodeUtf8(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ""))));
}

async function appendLineToGitHubFile(env, line) {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_PATH, GITHUB_BRANCH, GITHUB_TOKEN } = env;
  const branch = GITHUB_BRANCH || "main";
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
  const headers = {
    "Authorization": `Bearer ${GITHUB_TOKEN}`,
    "User-Agent": "solaris-leads-worker",
    "Accept": "application/vnd.github+json"
  };

  // 1) Read the current file (if any) to get its content + sha.
  let sha;
  let existing = "";
  const getResp = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
  if (getResp.status === 200) {
    const json = await getResp.json();
    sha = json.sha;
    existing = b64DecodeUtf8(json.content);
  } else if (getResp.status !== 404) {
    throw new Error(`GitHub read failed: ${getResp.status}`);
  }

  // 2) Append the new line and write the file back (creates it on first run).
  const header = existing ? "" : COLUMNS.join("\t") + "\n";
  const newContent = existing + header + line;
  // Note: header is only inserted once, when the file doesn't exist yet.
  // If `existing` already has content, no header is re-added.

  const putResp = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `lead abandonné — ${new Date().toISOString()}`,
      content: b64EncodeUtf8(newContent),
      branch,
      sha // omit (undefined) when creating the file for the first time
    })
  });

  if (!putResp.ok) {
    const text = await putResp.text();
    throw new Error(`GitHub write failed: ${putResp.status} ${text}`);
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    let data;
    try {
      data = JSON.parse(await request.text());
    } catch (e) {
      return new Response("Bad request", { status: 400, headers: corsHeaders });
    }

    // Only genuinely abandoned sessions are written to the file.
    if (data.status !== "abandoned") {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      await appendLineToGitHubFile(env, toLine(data));
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: String(err) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
