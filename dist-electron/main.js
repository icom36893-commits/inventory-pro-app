"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const require$$1 = require("electron");
const path$n = require("node:path");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const require$$1$1 = require("path");
const fs$j = require("fs");
const fs$k = require("node:fs");
const node_child_process = require("node:child_process");
const node_events = require("node:events");
const node_stream = require("node:stream");
const promises = require("node:stream/promises");
const util$3 = require("node:util");
const http = require("node:http");
const https = require("node:https");
const node_buffer = require("node:buffer");
const require$$0 = require("crypto");
const require$$0$1 = require("constants");
const require$$0$2 = require("stream");
const require$$4 = require("util");
const require$$5 = require("assert");
const require$$1$3 = require("child_process");
const require$$0$3 = require("events");
const require$$1$2 = require("tty");
const require$$2 = require("os");
const require$$2$1 = require("url");
const require$$14 = require("zlib");
const require$$4$1 = require("http");
const isDev$1 = !require$$1.app.isPackaged;
const dbPath$1 = isDev$1 ? require$$1$1.join(process.cwd(), "database", "inventory.db") : require$$1$1.join(require$$1.app.getPath("userData"), "inventory.db");
const dbDir = require$$1$1.dirname(dbPath$1);
if (!fs$j.existsSync(dbDir)) {
  fs$j.mkdirSync(dbDir, { recursive: true });
}
let dbInstance = null;
async function closeDb() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await sqlite.open({
    filename: dbPath$1,
    driver: sqlite3.Database
  });
  const tables = await dbInstance.all("SELECT name FROM sqlite_master WHERE type='table'");
  if (tables.length === 0) {
    const schemaPath = isDev$1 ? require$$1$1.join(process.cwd(), "database", "schema.sql") : require$$1$1.join(process.resourcesPath, "database", "schema.sql");
    if (fs$j.existsSync(schemaPath)) {
      const schema2 = fs$j.readFileSync(schemaPath, "utf8");
      await dbInstance.exec(schema2);
      console.log("Database initialized successfully");
      await dbInstance.run(
        `
        INSERT INTO company_settings (name, tax_number, phone, email, address, currency, tax_rate, tax_enabled, theme)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        "",
        "",
        "",
        "",
        "",
        "IQD",
        0,
        0,
        "light"
      );
      await dbInstance.run(`INSERT INTO warehouses (name, location) VALUES ('المستودع الرئيسي', 'الرياض')`);
      await dbInstance.run(`INSERT INTO product_categories (name, description) VALUES ('أجهزة إلكترونية', 'أجهزة كمبيوتر وشاشات')`);
      await dbInstance.run(`INSERT INTO product_categories (name, description) VALUES ('إكسسوارات', 'كابلات وملحقات')`);
      await dbInstance.run(`INSERT INTO units (name) VALUES ('قطعة')`);
      await dbInstance.run(`INSERT INTO units (name) VALUES ('كرتون')`);
      await dbInstance.run(`INSERT INTO units (name) VALUES ('متر')`);
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('مدفوعات العملاء', 'income', 1)`);
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('مدفوعات الموردين', 'expense', 1)`);
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('رواتب', 'expense', 0)`);
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('إيجار', 'expense', 0)`);
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('رأس مال', 'income', 0)`);
    }
  }
  const tryAlter = async (sql) => {
    try {
      if (dbInstance) await dbInstance.exec(sql);
    } catch (e) {
      if (e && e.message && !e.message.includes("duplicate column name")) {
        console.error("Migration error for", sql, e);
      }
    }
  };
  try {
    await tryAlter("ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'IQD'");
    await tryAlter("ALTER TABLE invoices ADD COLUMN buyer_name TEXT");
    await tryAlter("ALTER TABLE treasury_transactions ADD COLUMN currency TEXT DEFAULT 'IQD'");
    await tryAlter("ALTER TABLE products ADD COLUMN currency TEXT DEFAULT 'IQD'");
    await tryAlter("ALTER TABLE party_transactions ADD COLUMN currency TEXT DEFAULT 'IQD'");
    await tryAlter("ALTER TABLE party_transactions ADD COLUMN balance_iqd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE party_transactions ADD COLUMN balance_usd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN currency TEXT DEFAULT 'SAR'");
    await tryAlter("ALTER TABLE parties ADD COLUMN opening_balance_iqd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE parties ADD COLUMN opening_balance_usd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE parties ADD COLUMN current_balance_iqd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE products ADD COLUMN allow_negative_stock INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE parties ADD COLUMN current_balance_usd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN print_primary_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN print_template_style TEXT DEFAULT 'modern'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN print_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN print_show_logo INTEGER DEFAULT 1");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_logo_size INTEGER DEFAULT 60");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_logo_size INTEGER DEFAULT 60");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_logo_size INTEGER DEFAULT 60");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_logo_size INTEGER DEFAULT 60");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_logo_size INTEGER DEFAULT 60");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN auto_backup_enabled INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN auto_backup_frequency TEXT DEFAULT 'daily'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN auto_backup_path TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN last_backup_date TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN logo TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_bot_token TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_chat_id TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_bot_enabled INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_sales_report INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_income_statement INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_purchases_report INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_inventory_movement INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_customer_balances INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_balance_sheet INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_purchase_prices INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN last_low_stock_alert_date TEXT DEFAULT ''");
  } catch (e) {
    console.error("Global migration error:", e);
  }
  try {
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS system_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        type TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error("Error creating system_notifications:", e);
  }
  try {
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS inventory_stocktakes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stocktake_number TEXT UNIQUE NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'draft',
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stocktake_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stocktake_id INTEGER REFERENCES inventory_stocktakes(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        system_qty REAL NOT NULL DEFAULT 0,
        actual_qty REAL NOT NULL DEFAULT 0,
        difference REAL NOT NULL DEFAULT 0,
        notes TEXT
      );
    `);
  } catch (e) {
    console.error("Error creating stocktake tables:", e);
  }
  return dbInstance;
}
const dbManager = {
  getDb,
  closeDb
};
function namespaceEnabled(namespace) {
  const env = process.env.DEBUG ?? "";
  if (!env)
    return false;
  return env.split(/[\s,]+/).filter(Boolean).some((pattern) => {
    if (pattern === "*")
      return true;
    if (pattern.endsWith("*"))
      return namespace.startsWith(pattern.slice(0, -1));
    return pattern === namespace;
  });
}
function format(arg, formatter) {
  if (formatter === "%j")
    return JSON.stringify(arg);
  if (typeof arg === "object")
    return JSON.stringify(arg);
  return String(arg);
}
function createDebug(namespace) {
  const enabled = namespaceEnabled(namespace);
  return (template, ...rest) => {
    if (!enabled)
      return;
    let i = 0;
    const expanded = template.replace(/%[sdjOo%]/g, (token) => {
      if (token === "%%")
        return "%";
      const value = rest[i++];
      return format(value, token);
    });
    console.error(`  ${namespace} ${expanded}`);
  };
}
class BaseError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    __publicField(this, "code");
    this.code = code;
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
  toJSON() {
    return { code: this.code, message: this.message };
  }
}
class FatalError extends BaseError {
  constructor(data) {
    const message = typeof data === "string" ? data : data.message;
    super("EFATAL", message);
    __publicField(this, "cause");
    if (typeof data !== "string") {
      this.stack = data.stack;
      this.cause = data;
    }
  }
}
class ParseError extends BaseError {
  constructor(message, response) {
    super("EPARSE", message);
    __publicField(this, "response");
    this.response = response;
  }
}
class TelegramError extends BaseError {
  constructor(message, response) {
    super("ETELEGRAM", message);
    __publicField(this, "response");
    this.response = response;
  }
}
const errors = { BaseError, FatalError, ParseError, TelegramError };
const errors$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BaseError,
  FatalError,
  ParseError,
  TelegramError,
  errors
}, Symbol.toStringTag, { value: "Module" }));
function startsWith(buf, bytes, offset = 0) {
  if (buf.length < offset + bytes.length)
    return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buf[offset + i] !== bytes[i])
      return false;
  }
  return true;
}
function detectFileType(buf) {
  if (!buf || buf.length < 4)
    return null;
  if (startsWith(buf, [137, 80, 78, 71]))
    return { ext: "png", mime: "image/png" };
  if (startsWith(buf, [255, 216, 255]))
    return { ext: "jpg", mime: "image/jpeg" };
  if (startsWith(buf, [71, 73, 70, 56]))
    return { ext: "gif", mime: "image/gif" };
  if (startsWith(buf, [82, 73, 70, 70]) && buf.length >= 12 && startsWith(buf, [87, 69, 66, 80], 8))
    return { ext: "webp", mime: "image/webp" };
  if (startsWith(buf, [66, 77]))
    return { ext: "bmp", mime: "image/bmp" };
  if (startsWith(buf, [37, 80, 68, 70, 45]))
    return { ext: "pdf", mime: "application/pdf" };
  if (startsWith(buf, [80, 75, 3, 4]))
    return { ext: "zip", mime: "application/zip" };
  if (startsWith(buf, [73, 68, 51]) || startsWith(buf, [255, 251]))
    return { ext: "mp3", mime: "audio/mpeg" };
  if (startsWith(buf, [79, 103, 103, 83]))
    return { ext: "ogg", mime: "audio/ogg" };
  if (startsWith(buf, [102, 76, 97, 67]))
    return { ext: "flac", mime: "audio/flac" };
  if (startsWith(buf, [82, 73, 70, 70]) && buf.length >= 12 && startsWith(buf, [87, 65, 86, 69], 8))
    return { ext: "wav", mime: "audio/wav" };
  if (buf.length >= 12 && startsWith(buf, [102, 116, 121, 112], 4)) {
    const major2 = buf.slice(8, 12).toString("ascii");
    if (major2.startsWith("M4A"))
      return { ext: "m4a", mime: "audio/mp4" };
    if (major2.startsWith("qt"))
      return { ext: "mov", mime: "video/quicktime" };
    return { ext: "mp4", mime: "video/mp4" };
  }
  if (startsWith(buf, [26, 69, 223, 163]))
    return { ext: "webm", mime: "video/webm" };
  return null;
}
const MIME_BY_EXT = {
  // Audio
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  // Video
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  // Image
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  // Documents
  pdf: "application/pdf",
  zip: "application/zip",
  json: "application/json",
  txt: "text/plain",
  csv: "text/csv",
  html: "text/html",
  htm: "text/html",
  xml: "application/xml",
  // Telegram-specific
  tgs: "application/x-tgsticker",
  // Stream / fallback
  bin: "application/octet-stream",
  pem: "application/x-pem-file",
  crt: "application/x-x509-ca-cert"
};
function lookupMime(filename) {
  const dot = filename.lastIndexOf(".");
  if (dot === -1)
    return null;
  const ext = filename.slice(dot + 1).toLowerCase();
  return MIME_BY_EXT[ext] ?? null;
}
function stringify$5(data) {
  if (typeof data === "string")
    return data;
  return JSON.stringify(data);
}
const deprecate = /* @__PURE__ */ (() => {
  const issued = /* @__PURE__ */ new Set();
  return (msg) => {
    if (issued.has(msg))
      return;
    issued.add(msg);
    util$3.deprecate(() => {
    }, msg, "node-telegram-bot-api")();
  };
})();
function filenameFromStream(stream) {
  const maybe = stream.path;
  if (!maybe)
    return void 0;
  return path$n.basename(typeof maybe === "string" ? maybe : maybe.toString());
}
function isReadable(value) {
  return !!value && typeof value === "object" && !Buffer.isBuffer(value) && typeof value.pipe === "function";
}
async function prepareFile(data, meta = {}, filepathLookup = true) {
  if (data === void 0 || data === null) {
    return { file: null, fileId: null };
  }
  let { filename, contentType } = meta;
  if (Buffer.isBuffer(data)) {
    if (!contentType) {
      const detected = detectFileType(data);
      if (detected) {
        contentType = detected.mime;
        if (!filename)
          filename = `data.${detected.ext}`;
      }
    }
    filename = filename ?? "file";
    contentType = contentType ?? lookupMime(filename) ?? "application/octet-stream";
    return { file: { value: data, filename, contentType }, fileId: null };
  }
  if (isReadable(data)) {
    if (!filename)
      filename = filenameFromStream(data) ?? "file";
    contentType = contentType ?? lookupMime(filename) ?? "application/octet-stream";
    return { file: { value: data, filename, contentType }, fileId: null };
  }
  if (typeof data === "string") {
    if (filepathLookup && fs$k.existsSync(data)) {
      const stream = fs$k.createReadStream(data);
      filename = filename ?? path$n.basename(data);
      contentType = contentType ?? lookupMime(filename) ?? "application/octet-stream";
      return { file: { value: stream, filename, contentType }, fileId: null };
    }
    return { file: null, fileId: data };
  }
  throw new FatalError(`Unsupported file input: ${typeof data}`);
}
async function prepareFiles(attachKey, inputs, defaultMeta = {}, filepathLookup = true) {
  const formData = {};
  const fileIds = {};
  for (let index = 0; index < inputs.length; index++) {
    const item = inputs[index];
    const value = item.media ?? item.data;
    const meta = { ...defaultMeta, ...item.fileOptions };
    const { file: file2, fileId } = await prepareFile(value, meta, filepathLookup);
    if (file2) {
      formData[`${attachKey}_${index}`] = file2;
    } else if (fileId !== null) {
      fileIds[index] = fileId;
    }
  }
  return { formData, fileIds };
}
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
const debug$7 = createDebug("node-telegram-bot-api:http");
const ERROR_CODE_TOO_MANY_REQUESTS = 429;
const DEFAULT_MAX_RETRIES_ON_429 = 2;
const RETRY_AFTER_BUFFER_SECONDS = 1;
function toStringValue(value) {
  if (value === void 0 || value === null)
    return void 0;
  if (typeof value === "string")
    return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}
function appendForm(target, fields) {
  if (!fields)
    return;
  for (const [key, value] of Object.entries(fields)) {
    const stringified = toStringValue(value);
    if (stringified !== void 0)
      target.append(key, stringified);
  }
}
async function buildBody(opts) {
  if (opts.formData && Object.keys(opts.formData).length > 0) {
    for (const file2 of Object.values(opts.formData)) {
      if (!Buffer.isBuffer(file2.value) && typeof file2.value.pipe === "function") {
        file2.value = await streamToBuffer(file2.value);
      }
    }
    const fd = new FormData();
    appendForm(fd, opts.form);
    for (const [name, file2] of Object.entries(opts.formData)) {
      const buffer = file2.value;
      const blob = new Blob([buffer], { type: file2.contentType });
      fd.append(name, blob, file2.filename);
    }
    return { body: fd };
  }
  const params = new URLSearchParams();
  appendForm(params, opts.form);
  return { body: params.toString(), contentType: "application/x-www-form-urlencoded" };
}
class HttpClient {
  constructor(token, options = {}) {
    __publicField(this, "token");
    __publicField(this, "options");
    this.token = token;
    this.options = options;
  }
  buildURL(method) {
    const base = this.options.baseApiUrl ?? "https://api.telegram.org";
    const tail = this.options.testEnvironment ? "/test" : "";
    return `${base}/bot${this.token}${tail}/${method}`;
  }
  async request(method, opts = {}) {
    var _a, _b, _c, _d, _e;
    if (!this.token)
      throw new FatalError("Telegram Bot Token not provided!");
    const url = this.buildURL(method);
    const { body, contentType } = await buildBody(opts);
    const headers = {
      ...((_a = this.options.request) == null ? void 0 : _a.headers) ?? {}
    };
    if (contentType)
      headers["content-type"] = contentType;
    debug$7("HTTP POST %s form=%j", url, opts.form);
    const timeoutMs = opts.timeoutMs ?? ((_b = this.options.request) == null ? void 0 : _b.timeoutMs);
    const maxRetries = ((_c = this.options.request) == null ? void 0 : _c.maxRetriesOn429) ?? DEFAULT_MAX_RETRIES_ON_429;
    for (let attempt = 0; ; attempt++) {
      const { status, parsed } = await this._attempt(url, body, headers, timeoutMs, opts.signal);
      if (parsed.ok)
        return parsed.result;
      const retryAfter = (_d = parsed.parameters) == null ? void 0 : _d.retry_after;
      const canRetry = parsed.error_code === ERROR_CODE_TOO_MANY_REQUESTS && typeof retryAfter === "number" && attempt < maxRetries && !((_e = opts.signal) == null ? void 0 : _e.aborted);
      if (canRetry) {
        const delayMs = (retryAfter + RETRY_AFTER_BUFFER_SECONDS) * 1e3;
        debug$7("429 Too Many Requests, sleeping %dms then retrying (attempt %d/%d)", delayMs, attempt + 1, maxRetries);
        await sleep(delayMs);
        continue;
      }
      throw new TelegramError(`${parsed.error_code ?? status} ${parsed.description ?? "Unknown error"}`, makeResponseInfo(status, parsed));
    }
  }
  /**
   * Perform a single HTTP attempt: fire the request (honoring the per-call
   * timeout and abort signal) and parse Telegram's envelope. Throws
   * {@link FatalError} on a transport failure and {@link ParseError} on an
   * unparseable body; otherwise returns the HTTP status and parsed envelope
   * (ok or not) for the caller's retry/throw decision.
   */
  async _attempt(url, body, headers, timeoutMs, signal) {
    var _a, _b;
    const controller = new AbortController();
    let onExternalAbort = null;
    if (signal) {
      if (signal.aborted)
        controller.abort(signal.reason);
      else {
        onExternalAbort = () => controller.abort(signal.reason);
        signal.addEventListener("abort", onExternalAbort, { once: true });
      }
    }
    const timer = timeoutMs ? setTimeout(() => controller.abort(new Error("HTTP timeout")), timeoutMs) : null;
    const fetchImpl = ((_a = this.options.request) == null ? void 0 : _a.fetch) ?? fetch;
    const extraInit = (_b = this.options.request) == null ? void 0 : _b.fetchOptions;
    let response;
    try {
      response = await fetchImpl(url, {
        ...extraInit,
        method: "POST",
        body,
        headers,
        signal: controller.signal
      });
    } catch (err) {
      throw new FatalError(err);
    } finally {
      if (timer)
        clearTimeout(timer);
      if (signal && onExternalAbort)
        signal.removeEventListener("abort", onExternalAbort);
    }
    const status = response.status;
    const text = await response.text();
    debug$7("response %s %s", status, text.length > 1e3 ? `${text.slice(0, 1e3)}…` : text);
    try {
      return { status, parsed: JSON.parse(text) };
    } catch {
      throw new ParseError(`Error parsing response: ${text}`, makeResponseInfo(status, text));
    }
  }
}
function sleep(ms2) {
  return new Promise((resolve) => setTimeout(resolve, ms2));
}
function makeResponseInfo(status, body) {
  return { status, body };
}
const debug$6 = createDebug("node-telegram-bot-api:polling");
const ANOTHER_WEB_HOOK_USED = 409;
class TelegramBotPolling {
  constructor(bot2, options = {}) {
    __publicField(this, "bot");
    __publicField(this, "interval");
    __publicField(this, "params");
    __publicField(this, "_abort", false);
    __publicField(this, "_abortController");
    __publicField(this, "_activeRequest", null);
    __publicField(this, "_pollingTimeout", null);
    __publicField(this, "_running", false);
    this.bot = bot2;
    this.interval = typeof options.interval === "number" ? options.interval : 300;
    const params = options.params ?? {};
    this.params = {
      ...params,
      offset: typeof params.offset === "number" ? params.offset : 0,
      timeout: typeof params.timeout === "number" ? params.timeout : 10
    };
    if (typeof options.timeout === "number") {
      this.params.timeout = options.timeout;
    }
  }
  /**
   * Start polling. If polling is already running, the call resolves immediately
   * unless `restart: true` is passed (in which case the previous loop is cancelled
   * before a fresh one is started).
   */
  async start(options = {}) {
    if (this._running) {
      if (!options.restart)
        return;
      await this.stop({ cancel: true, reason: "Polling restart" });
    }
    this._running = true;
    this._abort = false;
    void this._loop();
  }
  /**
   * Stop polling. Resolves once the current `getUpdates` call has completed.
   */
  async stop(options = {}) {
    if (!this._running)
      return;
    this._running = false;
    if (this._pollingTimeout) {
      clearTimeout(this._pollingTimeout);
      this._pollingTimeout = null;
    }
    if (options.cancel && this._abortController) {
      this._abortController.abort(options.reason ?? "Polling stop");
    }
    this._abort = true;
    if (this._activeRequest) {
      try {
        await this._activeRequest;
      } catch {
      }
    }
  }
  isPolling() {
    return this._running;
  }
  _emitError(err) {
    if (!this.bot.listeners("polling_error").length) {
      console.error(`${(/* @__PURE__ */ new Date()).toISOString()} error: [polling_error] %j`, err);
      return;
    }
    this.bot.emit("polling_error", err);
  }
  _scheduleNext() {
    if (!this._running || this._abort) {
      debug$6("Polling aborted");
      return;
    }
    debug$6("setTimeout for %s milliseconds", this.interval);
    this._pollingTimeout = setTimeout(() => void this._loop(), this.interval);
  }
  async _loop() {
    const request = this._poll();
    this._activeRequest = request;
    try {
      await request;
    } finally {
      this._activeRequest = null;
      this._scheduleNext();
    }
  }
  async _poll() {
    try {
      const updates = await this._getUpdates();
      debug$6("polling data %j", updates);
      for (const update of updates) {
        this.params.offset = update.update_id + 1;
        debug$6("updated offset: %s", this.params.offset);
        try {
          this.bot.processUpdate(update);
        } catch (err) {
          err._processing = true;
          throw err;
        }
      }
    } catch (err) {
      const flagged = err;
      debug$6("polling error: %s", err.message);
      if (!flagged._processing) {
        this._emitError(err);
        return;
      }
      delete flagged._processing;
      try {
        await this.bot.getUpdates({
          offset: this.params.offset,
          limit: 1,
          timeout: 0
        });
        this._emitError(err);
      } catch (requestErr) {
        console.error(`${(/* @__PURE__ */ new Date()).toISOString()} error: Internal handling of The Offset Infinite Loop failed`, requestErr);
        this.bot.emit("error", new FatalError(err));
      }
    }
  }
  async _getUpdates() {
    var _a;
    debug$6("polling with options: %j", this.params);
    try {
      return await this.bot.getUpdates(this.params);
    } catch (err) {
      const status = (_a = err.response) == null ? void 0 : _a.status;
      if (status === ANOTHER_WEB_HOOK_USED) {
        debug$6("unsetting webhook because polling is in use");
        await this.bot.deleteWebHook();
        return this.bot.getUpdates(this.params);
      }
      throw err;
    }
  }
}
const debug$5 = createDebug("node-telegram-bot-api:webhook");
const MAX_PAYLOAD_BYTES = 50 * 1024 * 1024;
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_PAYLOAD_BYTES) {
        reject(new Error("Webhook payload exceeds 50MB safety cap"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(node_buffer.Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
class TelegramBotWebHook {
  constructor(bot2, options = {}) {
    __publicField(this, "bot");
    __publicField(this, "host");
    __publicField(this, "port");
    __publicField(this, "healthEndpoint");
    __publicField(this, "_secretToken");
    __publicField(this, "_server");
    __publicField(this, "_open", false);
    __publicField(this, "_handleRequest", async (req, res) => {
      debug$5("WebHook request URL: %s", req.url ?? "");
      const url = req.url ?? "";
      const pathname = url.split("?")[0];
      if (pathname === this.healthEndpoint) {
        debug$5("WebHook health check passed");
        res.statusCode = 200;
        res.end("OK");
        return;
      }
      if (!pathname.includes(this.bot.token)) {
        debug$5("WebHook request unauthorized");
        res.statusCode = 401;
        res.end();
        return;
      }
      if (req.method !== "POST") {
        debug$5("WebHook request isn't a POST");
        res.statusCode = 418;
        res.end();
        return;
      }
      if (this._secretToken) {
        const provided = req.headers["x-telegram-bot-api-secret-token"];
        if (provided !== this._secretToken) {
          debug$5("WebHook secret-token mismatch");
          res.statusCode = 401;
          res.end();
          return;
        }
      }
      try {
        const buffer = await readBody(req);
        let update;
        try {
          update = JSON.parse(buffer.toString("utf8"));
        } catch (parseError) {
          this._emitError(new ParseError(parseError.message));
          res.statusCode = 400;
          res.end("Bad Request");
          return;
        }
        this.bot.processUpdate(update);
        res.end("OK");
      } catch (err) {
        this._emitError(err instanceof BaseError ? err : new FatalError(err));
        res.statusCode = 500;
        res.end("Server Error");
      }
    });
    this.bot = bot2;
    this.host = options.host ?? "0.0.0.0";
    this.port = options.port ?? 8443;
    this.healthEndpoint = options.healthEndpoint ?? "/healthz";
    this._secretToken = options.secretToken;
    const httpsOptions = { ...options.https ?? {} };
    if (options.key && options.cert) {
      debug$5("HTTPS WebHook enabled (by key/cert)");
      httpsOptions.key = fs$k.readFileSync(options.key);
      httpsOptions.cert = fs$k.readFileSync(options.cert);
      this._server = https.createServer(httpsOptions, this._handleRequest);
    } else if (options.pfx) {
      debug$5("HTTPS WebHook enabled (by pfx)");
      httpsOptions.pfx = fs$k.readFileSync(options.pfx);
      this._server = https.createServer(httpsOptions, this._handleRequest);
    } else if (Object.keys(httpsOptions).length) {
      debug$5("HTTPS WebHook enabled (by https options)");
      this._server = https.createServer(httpsOptions, this._handleRequest);
    } else {
      debug$5("HTTP WebHook enabled");
      this._server = http.createServer(this._handleRequest);
    }
  }
  /** Begin listening for incoming Telegram webhook requests. */
  async open() {
    if (this.isOpen())
      return;
    await new Promise((resolve, reject) => {
      const onError = (err) => reject(err);
      this._server.once("error", onError);
      this._server.listen(this.port, this.host, () => {
        this._server.off("error", onError);
        debug$5("WebHook listening on %s:%s", this.host, this.port);
        this._open = true;
        resolve();
      });
    });
  }
  /** Stop accepting requests. Resolves once existing connections drain. */
  async close() {
    if (!this.isOpen())
      return;
    await new Promise((resolve, reject) => {
      this._server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        this._open = false;
        resolve();
      });
    });
  }
  isOpen() {
    return this._open;
  }
  _emitError(err) {
    if (!this.bot.listeners("webhook_error").length) {
      console.error(`${(/* @__PURE__ */ new Date()).toISOString()} error: [webhook_error] %j`, err);
      return;
    }
    this.bot.emit("webhook_error", err);
  }
}
const MESSAGE_TYPES = [
  "text",
  "animation",
  "audio",
  "channel_chat_created",
  "contact",
  "delete_chat_photo",
  "dice",
  "document",
  "game",
  "group_chat_created",
  "invoice",
  "left_chat_member",
  "location",
  "migrate_from_chat_id",
  "migrate_to_chat_id",
  "new_chat_members",
  "new_chat_photo",
  "new_chat_title",
  "passport_data",
  "photo",
  "pinned_message",
  "poll",
  "sticker",
  "successful_payment",
  "supergroup_chat_created",
  "video",
  "video_note",
  "voice",
  "video_chat_started",
  "video_chat_ended",
  "video_chat_participants_invited",
  "video_chat_scheduled",
  "message_auto_delete_timer_changed",
  "chat_invite_link",
  "chat_member_updated",
  "web_app_data",
  "message_reaction"
];
const UPDATE_TYPES = [
  "message",
  "edited_message",
  "channel_post",
  "edited_channel_post",
  "business_connection",
  "business_message",
  "edited_business_message",
  "deleted_business_messages",
  "guest_message",
  "message_reaction",
  "message_reaction_count",
  "inline_query",
  "chosen_inline_result",
  "callback_query",
  "shipping_query",
  "pre_checkout_query",
  "purchased_paid_media",
  "poll",
  "poll_answer",
  "my_chat_member",
  "chat_member",
  "chat_join_request",
  "chat_boost",
  "removed_chat_boost",
  "managed_bot"
];
const debug$4 = createDebug("node-telegram-bot-api");
const _deprecatedMessageTypes = ["new_chat_participant", "left_chat_participant"];
const _TelegramBot = class _TelegramBot extends node_events.EventEmitter {
  constructor(token, options = {}) {
    super();
    /** The Telegram Bot API token. */
    __publicField(this, "token");
    /** The fully-resolved bot configuration (both transport flags always present). */
    __publicField(this, "options");
    /** Underlying HTTP client. Accessible for advanced extensions. */
    __publicField(this, "http");
    __publicField(this, "_polling", null);
    __publicField(this, "_webHook", null);
    __publicField(this, "_textRegexpCallbacks", []);
    __publicField(this, "_replyListenerId", 0);
    __publicField(this, "_replyListeners", []);
    this.token = token;
    this.options = {
      ...options,
      polling: options.polling ?? false,
      webHook: options.webHook ?? false,
      baseApiUrl: options.baseApiUrl ?? "https://api.telegram.org",
      filepath: options.filepath ?? true,
      badRejection: options.badRejection ?? false
    };
    this.http = new HttpClient(token, {
      baseApiUrl: this.options.baseApiUrl,
      testEnvironment: this.options.testEnvironment,
      request: this.options.request
    });
    if (this.options.polling) {
      const pollingOpts = typeof this.options.polling === "boolean" ? {} : this.options.polling;
      const autoStart = pollingOpts.autoStart ?? true;
      this._polling = new TelegramBotPolling(this, pollingOpts);
      if (autoStart)
        void this._polling.start();
    } else if (this.options.webHook) {
      const webhookOpts = typeof this.options.webHook === "boolean" ? {} : this.options.webHook;
      const autoOpen = webhookOpts.autoOpen ?? true;
      this._webHook = new TelegramBotWebHook(this, webhookOpts);
      if (autoOpen)
        void this._webHook.open();
    }
  }
  on(event, listener) {
    if (_deprecatedMessageTypes.includes(event)) {
      const url = "https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#events";
      console.warn(`Events ${_deprecatedMessageTypes.join(",")} are deprecated. See: ${url}`);
    }
    return super.on(event, listener);
  }
  // --- internal helpers ---------------------------------------------------
  _request(method, opts = {}) {
    if (opts.form) {
      this._fixReplyMarkup(opts.form);
      this._fixEntitiesField(opts.form);
      this._fixReplyParameters(opts.form);
      this._fixMessageIds(opts.form);
      this._fixSuggestedPostParameters(opts.form);
      this._fixLinkPreviewOptions(opts.form);
      this._fixStoryAreas(opts.form);
      this._fixJsonFields(opts.form);
    }
    return this.http.request(method, opts);
  }
  _fixReplyMarkup(obj) {
    const replyMarkup = obj.reply_markup;
    if (replyMarkup && typeof replyMarkup !== "string") {
      obj.reply_markup = stringify$5(replyMarkup);
    }
  }
  _fixEntitiesField(obj) {
    for (const key of ["entities", "caption_entities", "explanation_entities", "description_entities", "question_entities", "title_entities", "text_entities"]) {
      const value = obj[key];
      if (value && typeof value !== "string")
        obj[key] = stringify$5(value);
    }
  }
  _fixReplyParameters(obj) {
    if (Object.prototype.hasOwnProperty.call(obj, "reply_parameters") && typeof obj.reply_parameters !== "string") {
      obj.reply_parameters = stringify$5(obj.reply_parameters);
    }
  }
  _fixSuggestedPostParameters(obj) {
    if (Object.prototype.hasOwnProperty.call(obj, "suggested_post_parameters") && typeof obj.suggested_post_parameters !== "string") {
      obj.suggested_post_parameters = stringify$5(obj.suggested_post_parameters);
    }
  }
  _fixLinkPreviewOptions(obj) {
    const value = obj.link_preview_options;
    if (value && typeof value !== "string") {
      obj.link_preview_options = stringify$5(value);
    }
  }
  _fixStoryAreas(obj) {
    const value = obj.areas;
    if (value && typeof value !== "string") {
      obj.areas = stringify$5(value);
    }
  }
  _fixMessageIds(obj) {
    const messageIds = obj.message_ids;
    if (messageIds && typeof messageIds !== "string") {
      obj.message_ids = stringify$5(messageIds);
    }
  }
  /**
   * JSON-stringify the remaining structured fields that the Bot API expects as
   * strings on a form body. Each is left untouched when already a string (a
   * caller may pre-serialize) or absent, so methods can pass the typed value
   * straight through and let normalization happen here.
   */
  _fixJsonFields(obj) {
    for (const key of [
      "button",
      "menu_button",
      "checklist",
      "custom_emoji_ids",
      "emoji_list",
      "errors",
      "keywords",
      "mask_position",
      "results",
      "sticker",
      "rich_message"
    ]) {
      const value = obj[key];
      if (value !== void 0 && value !== null && typeof value !== "string") {
        obj[key] = stringify$5(value);
      }
    }
  }
  /** Submit a request whose body is a flat form. Internal helper. */
  _form(method, form) {
    return this._request(method, { form });
  }
  /**
   * Common pattern: a method that uploads exactly one file (sendPhoto / sendAudio / etc).
   * Falls back to a string when `data` is a Telegram fileId or HTTPS URL.
   */
  async _sendFile(method, fieldName, data, form, fileMeta = {}, extraThumbnail) {
    const opts = { form };
    const { file: file2, fileId } = await prepareFile(data, fileMeta, this.options.filepath);
    if (file2) {
      opts.formData = { [fieldName]: file2 };
    } else if (fileId) {
      form[fieldName] = fileId;
    }
    if (extraThumbnail) {
      const candidate = extraThumbnail.thumbnail ?? extraThumbnail.thumb;
      if (candidate) {
        const { file: thumbFile, fileId: thumbId } = await prepareFile(candidate, {}, this.options.filepath);
        if (thumbFile) {
          opts.formData = opts.formData ?? {};
          opts.formData["thumbnail"] = thumbFile;
          form.thumbnail = "attach://thumbnail";
        } else if (thumbId) {
          form.thumbnail = thumbId;
        }
      }
    }
    return this._request(method, opts);
  }
  /**
   * Build the `media` array + multipart `formData` shared by `sendMediaGroup`
   * and `sendPaidMedia`. Every file-bearing field of each item is treated
   * alike -- the primary `media`, plus `thumbnail` / `cover` (video, animation,
   * audio, document) and `photo` (a live photo's still image): a Buffer /
   * stream / local path is uploaded under a `<index>_<field>` part name and the
   * field is rewritten to an `attach://` reference, while a fileId / URL string
   * passes through unchanged. The caller serializes the returned `inputMedia`
   * into the request's `media` field.
   */
  async _buildMediaItems(media) {
    const formData = {};
    const inputMedia = [];
    for (const [index, item] of media.entries()) {
      const payload = { ...item };
      delete payload.fileOptions;
      for (const field of ["media", "thumbnail", "cover", "photo"]) {
        const value = payload[field];
        if (value === void 0 || value === null)
          continue;
        const attachName = `${index}_${field}`;
        const meta = field === "media" ? item.fileOptions : void 0;
        const { file: file2, fileId } = await prepareFile(value, meta, this.options.filepath);
        if (file2) {
          formData[attachName] = file2;
          payload[field] = `attach://${attachName}`;
        } else if (fileId) {
          payload[field] = fileId;
        }
      }
      inputMedia.push(payload);
    }
    return { inputMedia, formData };
  }
  /**
   * Resolve an array of {@link InputStickerInput} into the docs-faithful
   * {@link InputSticker}[] wire shape plus the multipart `formData`. A
   * file-bearing `sticker` (Buffer / stream / local path) is uploaded under a
   * `sticker<index>` part name and rewritten to an `attach://` reference; a
   * file_id / URL string passes through unchanged. Shared by
   * `createNewStickerSet` and `addStickerToSet`.
   */
  async _buildStickerItems(stickers) {
    const formData = {};
    const resolved = [];
    for (const [index, item] of stickers.entries()) {
      const { sticker: data, fileOptions, ...rest } = item;
      const attachName = `sticker${index}`;
      const { file: file2, fileId } = await prepareFile(data, fileOptions, this.options.filepath);
      if (file2) {
        formData[attachName] = file2;
        resolved.push({ ...rest, sticker: `attach://${attachName}` });
      } else {
        resolved.push({ ...rest, sticker: fileId ?? "" });
      }
    }
    return { stickers: resolved, formData };
  }
  // --- High-level lifecycle ----------------------------------------------
  /** Start polling. */
  async startPolling(options = {}) {
    if (this.hasOpenWebHook()) {
      throw new FatalError("Polling and WebHook are mutually exclusive");
    }
    if (!this._polling) {
      const pollingOpts = typeof this.options.polling === "object" ? this.options.polling : {};
      this._polling = new TelegramBotPolling(this, pollingOpts);
    }
    return this._polling.start({ restart: options.restart ?? false });
  }
  /** Stop polling. */
  async stopPolling(options = {}) {
    if (!this._polling)
      return;
    return this._polling.stop(options);
  }
  isPolling() {
    var _a;
    return ((_a = this._polling) == null ? void 0 : _a.isPolling()) ?? false;
  }
  async openWebHook() {
    if (this.isPolling())
      throw new FatalError("WebHook and Polling are mutually exclusive");
    if (!this._webHook) {
      const webhookOpts = typeof this.options.webHook === "object" ? this.options.webHook : {};
      this._webHook = new TelegramBotWebHook(this, webhookOpts);
    }
    return this._webHook.open();
  }
  async closeWebHook() {
    if (!this._webHook)
      return;
    return this._webHook.close();
  }
  hasOpenWebHook() {
    var _a;
    return ((_a = this._webHook) == null ? void 0 : _a.isOpen()) ?? false;
  }
  // --- Reply / regexp listeners ------------------------------------------
  onText(regexp, callback) {
    const compiled = regexp instanceof RegExp ? regexp : new RegExp(regexp);
    this._textRegexpCallbacks.push({ regexp: compiled, callback });
  }
  removeTextListener(regexp) {
    const index = this._textRegexpCallbacks.findIndex((listener) => String(listener.regexp) === String(regexp));
    if (index === -1)
      return null;
    return this._textRegexpCallbacks.splice(index, 1)[0] ?? null;
  }
  clearTextListeners() {
    this._textRegexpCallbacks = [];
  }
  onReplyToMessage(chatId, messageId, callback) {
    const id = ++this._replyListenerId;
    this._replyListeners.push({ id, chatId, messageId, callback });
    return id;
  }
  removeReplyListener(replyListenerId) {
    const index = this._replyListeners.findIndex((entry) => entry.id === replyListenerId);
    if (index === -1)
      return null;
    return this._replyListeners.splice(index, 1)[0] ?? null;
  }
  clearReplyListeners() {
    const removed = this._replyListeners;
    this._replyListeners = [];
    return removed;
  }
  // --- Update processing -------------------------------------------------
  /**
   * Dispatch a single Update. Use this if you obtain updates from a source other
   * than this library's polling/webhook (e.g. AWS Lambda, custom proxy, tests).
   */
  processUpdate(update) {
    debug$4("Process Update %j", update);
    const m = update.message;
    if (m) {
      const metadata = { type: _TelegramBot.messageTypes.find((t2) => m[t2]) };
      this.emit("message", m, metadata);
      if (metadata.type)
        this.emit(metadata.type, m, metadata);
      if (m.text) {
        for (const reg of this._textRegexpCallbacks) {
          const result = reg.regexp.exec(m.text);
          if (!result)
            continue;
          reg.regexp.lastIndex = 0;
          reg.callback(m, result);
          if (this.options.onlyFirstMatch)
            break;
        }
      }
      if (m.reply_to_message) {
        for (const reply of this._replyListeners) {
          if (reply.chatId === m.chat.id && reply.messageId === m.reply_to_message.message_id) {
            reply.callback(m);
          }
        }
      }
      return;
    }
    for (const key of UPDATE_TYPES) {
      const value = update[key];
      if (value === void 0)
        continue;
      debug$4("Process Update %s %j", key, value);
      this.emit(key, value);
      if (key === "edited_message") {
        const em = value;
        if (em.text)
          this.emit("edited_message_text", em);
        if (em.caption)
          this.emit("edited_message_caption", em);
      }
      if (key === "edited_channel_post") {
        const ep = value;
        if (ep.text)
          this.emit("edited_channel_post_text", ep);
        if (ep.caption)
          this.emit("edited_channel_post_caption", ep);
      }
      return;
    }
  }
  // ===================================================================
  // Telegram Bot API methods
  // ===================================================================
  // --- Files & downloads -------------------------------------------------
  /** Resolve a file id to the public download URL on Telegram's servers. */
  async getFileLink(fileId, options = {}) {
    const file2 = await this.getFile(fileId, options);
    return `${this.options.baseApiUrl}/file/bot${this.token}/${file2.file_path}`;
  }
  /**
   * Stream the contents of a Telegram file. The returned stream emits an `info`
   * event with the resolved URI before the bytes start flowing.
   */
  getFileStream(fileId, options = {}) {
    const out2 = new node_stream.PassThrough();
    out2.path = fileId;
    void (async () => {
      try {
        const uri = await this.getFileLink(fileId, options);
        out2.emit("info", { uri });
        const response = await fetch(uri);
        if (!response.ok || !response.body) {
          throw new FatalError(`Failed to fetch file: HTTP ${response.status}`);
        }
        await promises.pipeline(node_stream.Readable.fromWeb(response.body), out2);
      } catch (err) {
        out2.emit("error", err);
      }
    })();
    return out2;
  }
  /**
   * Download a Telegram file to a local directory and resolve to the resulting path.
   */
  async downloadFile(fileId, downloadDir, options = {}) {
    const uri = await this.getFileLink(fileId, options);
    const fileName = uri.slice(uri.lastIndexOf("/") + 1);
    const filePath = path$n.join(downloadDir, fileName);
    const response = await fetch(uri);
    if (!response.ok || !response.body) {
      throw new FatalError(`Failed to download file: HTTP ${response.status}`);
    }
    const out2 = fs$k.createWriteStream(filePath);
    await promises.pipeline(node_stream.Readable.fromWeb(response.body), out2);
    return filePath;
  }
  // --- Updates / webhook -------------------------------------------------
  getUpdates(form = {}) {
    if (Array.isArray(form.allowed_updates)) {
      form.allowed_updates = stringify$5(form.allowed_updates);
    }
    return this._form("getUpdates", form);
  }
  async setWebhook(url, options = {}, fileOptions = {}) {
    const { certificate, ...rest } = options;
    const form = { ...rest, url };
    if (Array.isArray(form.allowed_updates))
      form.allowed_updates = stringify$5(form.allowed_updates);
    if (certificate) {
      const { file: file2, fileId } = await prepareFile(certificate, fileOptions, this.options.filepath);
      if (file2) {
        return this._request("setWebhook", { form, formData: { certificate: file2 } });
      }
      form.certificate = fileId;
    }
    return this._request("setWebhook", { form });
  }
  deleteWebhook(form = {}) {
    return this._form("deleteWebhook", form);
  }
  getWebhookInfo(form = {}) {
    return this._form("getWebhookInfo", form);
  }
  /** @deprecated Renamed to {@link TelegramBot.setWebhook} to match the Bot API casing. */
  setWebHook(url, options = {}, fileOptions = {}) {
    deprecate("setWebHook(...) is deprecated; use setWebhook(...) instead.");
    return this.setWebhook(url, options, fileOptions);
  }
  /** @deprecated Renamed to {@link TelegramBot.deleteWebhook} to match the Bot API casing. */
  deleteWebHook(form = {}) {
    deprecate("deleteWebHook(...) is deprecated; use deleteWebhook(...) instead.");
    return this.deleteWebhook(form);
  }
  /** @deprecated Renamed to {@link TelegramBot.getWebhookInfo} to match the Bot API casing. */
  getWebHookInfo(form = {}) {
    deprecate("getWebHookInfo(...) is deprecated; use getWebhookInfo(...) instead.");
    return this.getWebhookInfo(form);
  }
  // --- Bot identity ------------------------------------------------------
  getMe(form = {}) {
    return this._form("getMe", form);
  }
  logOut(form = {}) {
    return this._form("logOut", form);
  }
  close(form = {}) {
    return this._form("close", form);
  }
  // --- Messages ----------------------------------------------------------
  sendMessage(chatId, text, form = {}) {
    return this._form("sendMessage", {
      ...form,
      chat_id: chatId,
      text
    });
  }
  sendRichMessage(chatId, richMessage, form = {}) {
    return this._form("sendRichMessage", {
      ...form,
      chat_id: chatId,
      rich_message: richMessage
    });
  }
  forwardMessage(chatId, fromChatId, messageId, form = {}) {
    return this._form("forwardMessage", {
      ...form,
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId
    });
  }
  forwardMessages(chatId, fromChatId, messageIds, form = {}) {
    return this._form("forwardMessages", {
      ...form,
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_ids: messageIds
    });
  }
  copyMessage(chatId, fromChatId, messageId, form = {}) {
    return this._form("copyMessage", {
      ...form,
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId
    });
  }
  copyMessages(chatId, fromChatId, messageIds, form = {}) {
    return this._form("copyMessages", {
      ...form,
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_ids: stringify$5(messageIds)
    });
  }
  // --- Send file methods -------------------------------------------------
  sendPhoto(chatId, photo, options = {}, fileOptions = {}) {
    return this._sendFile("sendPhoto", "photo", photo, { ...options, chat_id: chatId }, fileOptions);
  }
  async sendLivePhoto(chatId, livePhoto, photo, options = {}, fileOptions = {}) {
    const form = { ...options, chat_id: chatId };
    const opts = { form };
    const liveResult = await prepareFile(livePhoto, fileOptions, this.options.filepath);
    if (liveResult.file) {
      opts.formData = { live_photo: liveResult.file };
      form.live_photo = "attach://live_photo";
    } else if (liveResult.fileId) {
      form.live_photo = liveResult.fileId;
    }
    const photoResult = await prepareFile(photo, {}, this.options.filepath);
    if (photoResult.file) {
      opts.formData = opts.formData ?? {};
      opts.formData.photo = photoResult.file;
      form.photo = "attach://photo";
    } else if (photoResult.fileId) {
      form.photo = photoResult.fileId;
    }
    return this._request("sendLivePhoto", opts);
  }
  sendAudio(chatId, audio, options = {}, fileOptions = {}) {
    return this._sendFile("sendAudio", "audio", audio, { ...options, chat_id: chatId }, fileOptions, { thumbnail: options.thumbnail });
  }
  sendDocument(chatId, doc, options = {}, fileOptions = {}) {
    return this._sendFile("sendDocument", "document", doc, { ...options, chat_id: chatId }, fileOptions, { thumbnail: options.thumbnail });
  }
  sendVideo(chatId, video, options = {}, fileOptions = {}) {
    return this._sendFile("sendVideo", "video", video, { ...options, chat_id: chatId }, fileOptions, { thumbnail: options.thumbnail });
  }
  sendAnimation(chatId, animation, options = {}, fileOptions = {}) {
    return this._sendFile("sendAnimation", "animation", animation, { ...options, chat_id: chatId }, fileOptions, { thumbnail: options.thumbnail });
  }
  sendVoice(chatId, voice, options = {}, fileOptions = {}) {
    return this._sendFile("sendVoice", "voice", voice, { ...options, chat_id: chatId }, fileOptions);
  }
  sendVideoNote(chatId, videoNote, options = {}, fileOptions = {}) {
    return this._sendFile("sendVideoNote", "video_note", videoNote, { ...options, chat_id: chatId }, fileOptions, { thumbnail: options.thumbnail });
  }
  /**
   * Send paid media. Each item's file fields are widened to accept uploads: the
   * primary `media` plus any `thumbnail` / `cover` (video) or `photo` (live photo)
   * may be a Buffer / stream / local path (uploaded as a multipart part) or a
   * file_id / URL string (passed through). {@link _buildMediaItems} resolves them.
   */
  async sendPaidMedia(chatId, starCount, media, options = {}) {
    const form = { ...options, chat_id: chatId, star_count: starCount };
    const { inputMedia, formData } = await this._buildMediaItems(media);
    form.media = stringify$5(inputMedia);
    return this._request("sendPaidMedia", { form, formData });
  }
  /**
   * Send a group of photos / videos / etc as an album. Each item's file fields are
   * widened to accept uploads: the primary `media` plus any `thumbnail` / `cover`
   * (video) or `photo` (live photo) may be a Buffer / stream / local path (uploaded
   * as a multipart part) or a file_id / URL string (passed through).
   * {@link _buildMediaItems} resolves every file field of every item, shared with
   * {@link sendPaidMedia} and {@link editMessageMedia}.
   */
  async sendMediaGroup(chatId, media, options = {}) {
    const form = { ...options, chat_id: chatId };
    const { inputMedia, formData } = await this._buildMediaItems(media);
    form.media = stringify$5(inputMedia);
    return this._request("sendMediaGroup", { form, formData });
  }
  sendLocation(chatId, latitude, longitude, form = {}) {
    return this._form("sendLocation", {
      ...form,
      chat_id: chatId,
      latitude,
      longitude
    });
  }
  sendVenue(chatId, latitude, longitude, title, address, form = {}) {
    return this._form("sendVenue", {
      ...form,
      chat_id: chatId,
      latitude,
      longitude,
      title,
      address
    });
  }
  sendContact(chatId, phoneNumber, firstName, form = {}) {
    return this._form("sendContact", {
      ...form,
      chat_id: chatId,
      phone_number: phoneNumber,
      first_name: firstName
    });
  }
  sendPoll(chatId, question, pollOptions, form = {}) {
    const out2 = { ...form, chat_id: chatId, question, options: stringify$5(pollOptions) };
    if (out2.country_codes)
      out2.country_codes = stringify$5(out2.country_codes);
    if (out2.correct_option_ids)
      out2.correct_option_ids = stringify$5(out2.correct_option_ids);
    return this._form("sendPoll", out2);
  }
  sendChecklist(businessConnectionId, chatId, checklist, form = {}) {
    return this._form("sendChecklist", {
      ...form,
      business_connection_id: businessConnectionId,
      chat_id: chatId,
      checklist: stringify$5(checklist)
    });
  }
  sendDice(chatId, options = {}) {
    return this._form("sendDice", {
      ...options,
      chat_id: chatId
    });
  }
  sendMessageDraft(chatId, draftId, text, form = {}) {
    return this._form("sendMessageDraft", {
      ...form,
      chat_id: chatId,
      draft_id: draftId,
      text
    });
  }
  sendRichMessageDraft(chatId, draftId, richMessage, form = {}) {
    return this._form("sendRichMessageDraft", {
      ...form,
      chat_id: chatId,
      draft_id: draftId,
      rich_message: richMessage
    });
  }
  sendChatAction(chatId, action, form = {}) {
    return this._form("sendChatAction", {
      ...form,
      chat_id: chatId,
      action
    });
  }
  setMessageReaction(chatId, messageId, form = {}) {
    const out2 = { ...form, chat_id: chatId, message_id: messageId };
    if (out2.reaction)
      out2.reaction = stringify$5(out2.reaction);
    return this._form("setMessageReaction", out2);
  }
  editMessageLiveLocation(latitude, longitude, form = {}) {
    return this._form("editMessageLiveLocation", {
      ...form,
      latitude,
      longitude
    });
  }
  stopMessageLiveLocation(form = {}) {
    return this._form("stopMessageLiveLocation", form);
  }
  // --- Users -------------------------------------------------------------
  getUserProfilePhotos(userId, form = {}) {
    return this._form("getUserProfilePhotos", {
      ...form,
      user_id: userId
    });
  }
  getUserProfileAudios(userId, form = {}) {
    return this._form("getUserProfileAudios", {
      ...form,
      user_id: userId
    });
  }
  setUserEmojiStatus(userId, form = {}) {
    return this._form("setUserEmojiStatus", {
      ...form,
      user_id: userId
    });
  }
  getFile(fileId, form = {}) {
    return this._form("getFile", {
      ...form,
      file_id: fileId
    });
  }
  getUserPersonalChatMessages(userId, limit) {
    return this._form("getUserPersonalChatMessages", {
      user_id: userId,
      limit
    });
  }
  // --- Chat membership --------------------------------------------------
  banChatMember(chatId, userId, form = {}) {
    return this._form("banChatMember", {
      ...form,
      chat_id: chatId,
      user_id: userId
    });
  }
  unbanChatMember(chatId, userId, form = {}) {
    return this._form("unbanChatMember", {
      ...form,
      chat_id: chatId,
      user_id: userId
    });
  }
  restrictChatMember(chatId, userId, permissions, form = {}) {
    return this._form("restrictChatMember", {
      ...form,
      chat_id: chatId,
      user_id: userId,
      permissions: stringify$5(permissions)
    });
  }
  promoteChatMember(chatId, userId, form = {}) {
    return this._form("promoteChatMember", {
      ...form,
      chat_id: chatId,
      user_id: userId
    });
  }
  setChatAdministratorCustomTitle(chatId, userId, customTitle, form = {}) {
    return this._form("setChatAdministratorCustomTitle", {
      ...form,
      chat_id: chatId,
      user_id: userId,
      custom_title: customTitle
    });
  }
  setChatMemberTag(chatId, userId, form = {}) {
    return this._form("setChatMemberTag", {
      ...form,
      chat_id: chatId,
      user_id: userId
    });
  }
  banChatSenderChat(chatId, senderChatId, form = {}) {
    return this._form("banChatSenderChat", {
      ...form,
      chat_id: chatId,
      sender_chat_id: senderChatId
    });
  }
  unbanChatSenderChat(chatId, senderChatId, form = {}) {
    return this._form("unbanChatSenderChat", {
      ...form,
      chat_id: chatId,
      sender_chat_id: senderChatId
    });
  }
  setChatPermissions(chatId, permissions, form = {}) {
    return this._form("setChatPermissions", {
      ...form,
      chat_id: chatId,
      permissions: stringify$5(permissions)
    });
  }
  // --- Chat invite links ------------------------------------------------
  exportChatInviteLink(chatId, form = {}) {
    return this._form("exportChatInviteLink", {
      ...form,
      chat_id: chatId
    });
  }
  createChatInviteLink(chatId, form = {}) {
    return this._form("createChatInviteLink", {
      ...form,
      chat_id: chatId
    });
  }
  editChatInviteLink(chatId, inviteLink, form = {}) {
    return this._form("editChatInviteLink", {
      ...form,
      chat_id: chatId,
      invite_link: inviteLink
    });
  }
  createChatSubscriptionInviteLink(chatId, subscriptionPeriod, subscriptionPrice, form = {}) {
    return this._form("createChatSubscriptionInviteLink", {
      ...form,
      chat_id: chatId,
      subscription_period: subscriptionPeriod,
      subscription_price: subscriptionPrice
    });
  }
  editChatSubscriptionInviteLink(chatId, inviteLink, form = {}) {
    return this._form("editChatSubscriptionInviteLink", {
      ...form,
      chat_id: chatId,
      invite_link: inviteLink
    });
  }
  revokeChatInviteLink(chatId, inviteLink, form = {}) {
    return this._form("revokeChatInviteLink", {
      ...form,
      chat_id: chatId,
      invite_link: inviteLink
    });
  }
  approveChatJoinRequest(chatId, userId, form = {}) {
    return this._form("approveChatJoinRequest", {
      ...form,
      chat_id: chatId,
      user_id: userId
    });
  }
  declineChatJoinRequest(chatId, userId, form = {}) {
    return this._form("declineChatJoinRequest", {
      ...form,
      chat_id: chatId,
      user_id: userId
    });
  }
  answerChatJoinRequestQuery(chatJoinRequestQueryId, result, form = {}) {
    return this._form("answerChatJoinRequestQuery", {
      ...form,
      chat_join_request_query_id: chatJoinRequestQueryId,
      result
    });
  }
  sendChatJoinRequestWebApp(chatJoinRequestQueryId, webAppUrl, form = {}) {
    return this._form("sendChatJoinRequestWebApp", {
      ...form,
      chat_join_request_query_id: chatJoinRequestQueryId,
      web_app_url: webAppUrl
    });
  }
  // --- Chat metadata ---------------------------------------------------
  /**
   * Set the chat photo. The photo must be a JPEG: Telegram's chat-photo backend
   * silently stalls on a non-JPEG (e.g. a PNG) until the request times out
   * (EFATAL); no layer here validates or converts, so the caller must pass a JPEG.
   */
  setChatPhoto(chatId, photo, options = {}, fileOptions = {}) {
    return this._sendFile("setChatPhoto", "photo", photo, { ...options, chat_id: chatId }, fileOptions);
  }
  deleteChatPhoto(chatId, form = {}) {
    return this._form("deleteChatPhoto", {
      ...form,
      chat_id: chatId
    });
  }
  setChatTitle(chatId, title, form = {}) {
    return this._form("setChatTitle", {
      ...form,
      chat_id: chatId,
      title
    });
  }
  setChatDescription(chatId, description, form = {}) {
    return this._form("setChatDescription", {
      ...form,
      chat_id: chatId,
      description
    });
  }
  pinChatMessage(chatId, messageId, form = {}) {
    return this._form("pinChatMessage", {
      ...form,
      chat_id: chatId,
      message_id: messageId
    });
  }
  unpinChatMessage(chatId, form = {}) {
    return this._form("unpinChatMessage", {
      ...form,
      chat_id: chatId
    });
  }
  unpinAllChatMessages(chatId, form = {}) {
    return this._form("unpinAllChatMessages", {
      ...form,
      chat_id: chatId
    });
  }
  leaveChat(chatId, form = {}) {
    return this._form("leaveChat", {
      ...form,
      chat_id: chatId
    });
  }
  getChat(chatId, form = {}) {
    return this._form("getChat", {
      ...form,
      chat_id: chatId
    });
  }
  getChatAdministrators(chatId, form = {}) {
    return this._form("getChatAdministrators", {
      ...form,
      chat_id: chatId
    });
  }
  getChatMemberCount(chatId, form = {}) {
    return this._form("getChatMemberCount", {
      ...form,
      chat_id: chatId
    });
  }
  getChatMember(chatId, userId, form = {}) {
    return this._form("getChatMember", {
      ...form,
      chat_id: chatId,
      user_id: userId
    });
  }
  setChatStickerSet(chatId, stickerSetName, form = {}) {
    return this._form("setChatStickerSet", {
      ...form,
      chat_id: chatId,
      sticker_set_name: stickerSetName
    });
  }
  deleteChatStickerSet(chatId, form = {}) {
    return this._form("deleteChatStickerSet", {
      ...form,
      chat_id: chatId
    });
  }
  // --- Forum topics -----------------------------------------------------
  getForumTopicIconStickers(form = {}) {
    return this._form("getForumTopicIconStickers", form);
  }
  createForumTopic(chatId, name, form = {}) {
    return this._form("createForumTopic", {
      ...form,
      chat_id: chatId,
      name
    });
  }
  editForumTopic(chatId, messageThreadId, form = {}) {
    return this._form("editForumTopic", {
      ...form,
      chat_id: chatId,
      message_thread_id: messageThreadId
    });
  }
  closeForumTopic(chatId, messageThreadId, form = {}) {
    return this._form("closeForumTopic", {
      ...form,
      chat_id: chatId,
      message_thread_id: messageThreadId
    });
  }
  reopenForumTopic(chatId, messageThreadId, form = {}) {
    return this._form("reopenForumTopic", {
      ...form,
      chat_id: chatId,
      message_thread_id: messageThreadId
    });
  }
  deleteForumTopic(chatId, messageThreadId, form = {}) {
    return this._form("deleteForumTopic", {
      ...form,
      chat_id: chatId,
      message_thread_id: messageThreadId
    });
  }
  unpinAllForumTopicMessages(chatId, messageThreadId, form = {}) {
    return this._form("unpinAllForumTopicMessages", {
      ...form,
      chat_id: chatId,
      message_thread_id: messageThreadId
    });
  }
  editGeneralForumTopic(chatId, name, form = {}) {
    return this._form("editGeneralForumTopic", {
      ...form,
      chat_id: chatId,
      name
    });
  }
  closeGeneralForumTopic(chatId, form = {}) {
    return this._form("closeGeneralForumTopic", {
      ...form,
      chat_id: chatId
    });
  }
  reopenGeneralForumTopic(chatId, form = {}) {
    return this._form("reopenGeneralForumTopic", {
      ...form,
      chat_id: chatId
    });
  }
  hideGeneralForumTopic(chatId, form = {}) {
    return this._form("hideGeneralForumTopic", {
      ...form,
      chat_id: chatId
    });
  }
  unhideGeneralForumTopic(chatId, form = {}) {
    return this._form("unhideGeneralForumTopic", {
      ...form,
      chat_id: chatId
    });
  }
  unpinAllGeneralForumTopicMessages(chatId, form = {}) {
    return this._form("unpinAllGeneralForumTopicMessages", {
      ...form,
      chat_id: chatId
    });
  }
  // --- Callback / inline queries ---------------------------------------
  answerCallbackQuery(callbackQueryId, form = {}) {
    return this._form("answerCallbackQuery", {
      ...form,
      callback_query_id: callbackQueryId
    });
  }
  answerGuestQuery(guestQueryId, result) {
    return this._form("answerGuestQuery", {
      guest_query_id: guestQueryId,
      result: stringify$5(result)
    });
  }
  savePreparedInlineMessage(userId, result, form = {}) {
    return this._form("savePreparedInlineMessage", {
      ...form,
      user_id: userId,
      result: stringify$5(result)
    });
  }
  savePreparedKeyboardButton(userId, button, form = {}) {
    return this._form("savePreparedKeyboardButton", {
      ...form,
      user_id: userId,
      button
    });
  }
  getUserChatBoosts(chatId, userId, form = {}) {
    return this._form("getUserChatBoosts", {
      ...form,
      chat_id: chatId,
      user_id: userId
    });
  }
  getBusinessConnection(businessConnectionId, form = {}) {
    return this._form("getBusinessConnection", {
      ...form,
      business_connection_id: businessConnectionId
    });
  }
  getManagedBotToken(userId, form = {}) {
    return this._form("getManagedBotToken", {
      ...form,
      user_id: userId
    });
  }
  replaceManagedBotToken(userId, form = {}) {
    return this._form("replaceManagedBotToken", {
      ...form,
      user_id: userId
    });
  }
  getManagedBotAccessSettings(userId, form = {}) {
    return this._form("getManagedBotAccessSettings", {
      ...form,
      user_id: userId
    });
  }
  setManagedBotAccessSettings(userId, isAccessRestricted, form = {}) {
    const out2 = {
      user_id: userId,
      is_access_restricted: isAccessRestricted
    };
    if (form.added_user_ids)
      out2.added_user_ids = stringify$5(form.added_user_ids);
    return this._form("setManagedBotAccessSettings", out2);
  }
  // --- Bot identity (self-management) ----------------------------------
  setMyCommands(commands, form = {}) {
    const out2 = { ...form, commands: stringify$5(commands) };
    if (out2.scope)
      out2.scope = stringify$5(out2.scope);
    return this._form("setMyCommands", out2);
  }
  deleteMyCommands(form = {}) {
    const out2 = { ...form };
    if (out2.scope)
      out2.scope = stringify$5(out2.scope);
    return this._form("deleteMyCommands", out2);
  }
  getMyCommands(form = {}) {
    const out2 = { ...form };
    if (out2.scope)
      out2.scope = stringify$5(out2.scope);
    return this._form("getMyCommands", out2);
  }
  setMyName(form = {}) {
    return this._form("setMyName", form);
  }
  getMyName(form = {}) {
    return this._form("getMyName", form);
  }
  setMyDescription(form = {}) {
    return this._form("setMyDescription", form);
  }
  getMyDescription(form = {}) {
    return this._form("getMyDescription", form);
  }
  setMyShortDescription(form = {}) {
    return this._form("setMyShortDescription", form);
  }
  getMyShortDescription(form = {}) {
    return this._form("getMyShortDescription", form);
  }
  /**
   * Set the bot's profile photo.
   *
   * ⚠️ A `static` photo **must be a JPEG**. Telegram's backend
   * (`photos.uploadProfilePhoto`) only accepts JPEG and no layer in the stack
   * — this library, the Bot API server, or TDLib — validates or converts the
   * format, so the raw bytes are forwarded as-is. A non-JPEG (e.g. PNG) is not
   * rejected cleanly: the upstream call typically returns `504 Gateway Timeout`
   * (an `ETELEGRAM` error) or stalls until the request times out. Convert to
   * JPEG before calling.
   */
  async setMyProfilePhoto(photo, form = {}) {
    const fieldName = photo.type === "static" ? "photo" : "animation";
    const fileInput = photo[fieldName];
    const { file: file2 } = await prepareFile(fileInput, {}, this.options.filepath);
    if (!file2) {
      throw new FatalError("setMyProfilePhoto only supports file uploads (Buffer, Stream, or local path)");
    }
    const struct = { ...photo, [fieldName]: `attach://${fieldName}` };
    return this._request("setMyProfilePhoto", {
      form: { ...form, photo: stringify$5(struct) },
      formData: { [fieldName]: file2 }
    });
  }
  removeMyProfilePhoto(form = {}) {
    return this._form("removeMyProfilePhoto", form);
  }
  setChatMenuButton(form = {}) {
    return this._form("setChatMenuButton", form);
  }
  getChatMenuButton(form = {}) {
    return this._form("getChatMenuButton", form);
  }
  setMyDefaultAdministratorRights(form = {}) {
    return this._form("setMyDefaultAdministratorRights", form);
  }
  getMyDefaultAdministratorRights(form = {}) {
    return this._form("getMyDefaultAdministratorRights", form);
  }
  editMessageText(textOrForm, form = {}) {
    if (typeof textOrForm === "string") {
      return this._form("editMessageText", { ...form, text: textOrForm });
    }
    return this._form("editMessageText", textOrForm);
  }
  editMessageCaption(caption, form = {}) {
    return this._form("editMessageCaption", {
      ...form,
      caption
    });
  }
  /**
   * Edit a message's media. The `media` (and its `thumbnail` / `cover`) accept a
   * file (Buffer / stream / local path, uploaded via an `attach://` part) or a
   * file_id / URL string (passed through), resolved by {@link _buildMediaItems}
   * like {@link sendMediaGroup}. The legacy `attach://<local-path>` form is still
   * accepted for the primary `media`.
   */
  async editMessageMedia(media, form = {}) {
    const item = { ...media };
    if (typeof item.media === "string" && item.media.startsWith("attach://")) {
      item.media = item.media.slice("attach://".length);
    }
    const { inputMedia, formData } = await this._buildMediaItems([item]);
    const out2 = {
      ...form,
      media: stringify$5(inputMedia[0])
    };
    return this._request("editMessageMedia", { form: out2, formData });
  }
  editMessageChecklist(businessConnectionId, chatId, messageId, checklist, form = {}) {
    return this._form("editMessageChecklist", {
      ...form,
      business_connection_id: businessConnectionId,
      chat_id: chatId,
      message_id: messageId,
      checklist
    });
  }
  editMessageReplyMarkup(replyMarkup, form = {}) {
    return this._form("editMessageReplyMarkup", {
      ...form,
      reply_markup: replyMarkup
    });
  }
  stopPoll(chatId, pollId, form = {}) {
    return this._form("stopPoll", {
      ...form,
      chat_id: chatId,
      message_id: pollId
    });
  }
  // --- Suggested posts --------------------------------------------------
  approveSuggestedPost(chatId, messageId, form = {}) {
    return this._form("approveSuggestedPost", {
      ...form,
      chat_id: chatId,
      message_id: messageId
    });
  }
  declineSuggestedPost(chatId, messageId, form = {}) {
    return this._form("declineSuggestedPost", {
      ...form,
      chat_id: chatId,
      message_id: messageId
    });
  }
  // --- Stickers --------------------------------------------------------
  sendSticker(chatId, sticker, options = {}, fileOptions = {}) {
    return this._sendFile("sendSticker", "sticker", sticker, { ...options, chat_id: chatId }, fileOptions);
  }
  getStickerSet(name, form = {}) {
    return this._form("getStickerSet", {
      ...form,
      name
    });
  }
  getCustomEmojiStickers(customEmojiIds, form = {}) {
    return this._form("getCustomEmojiStickers", {
      ...form,
      custom_emoji_ids: customEmojiIds
    });
  }
  uploadStickerFile(userId, sticker, stickerFormat = "static", options = {}, fileOptions = {}) {
    return this._sendFile("uploadStickerFile", "sticker", sticker, { ...options, user_id: userId, sticker_format: stickerFormat }, fileOptions);
  }
  /**
   * Create a new sticker set owned by a user. Each entry in `stickers` is an
   * {@link InputStickerInput} whose `sticker` accepts a file (Buffer / stream /
   * local path, uploaded as an `attach://` part) or a file_id / URL string, plus
   * the sticker's `format`, `emoji_list`, and optional `mask_position`/`keywords`.
   * @see https://core.telegram.org/bots/api#createnewstickerset
   */
  async createNewStickerSet(params) {
    const { stickers: stickerInputs, ...rest } = params;
    const { stickers, formData } = await this._buildStickerItems(stickerInputs);
    const form = { ...rest };
    form.stickers = stringify$5(stickers);
    return this._request("createNewStickerSet", { form, formData });
  }
  /**
   * Add a sticker to an existing set. The `sticker` is an
   * {@link InputStickerInput} whose `sticker` field accepts a file (Buffer /
   * stream / local path, uploaded as an `attach://` part) or a file_id / URL string.
   * @see https://core.telegram.org/bots/api#addstickertoset
   */
  async addStickerToSet(params) {
    const { sticker, ...rest } = params;
    const { stickers, formData } = await this._buildStickerItems([sticker]);
    const form = { ...rest };
    form.sticker = stringify$5(stickers[0]);
    return this._request("addStickerToSet", { form, formData });
  }
  setStickerPositionInSet(sticker, position, form = {}) {
    return this._form("setStickerPositionInSet", {
      ...form,
      sticker,
      position
    });
  }
  deleteStickerFromSet(sticker, form = {}) {
    return this._form("deleteStickerFromSet", {
      ...form,
      sticker
    });
  }
  replaceStickerInSet(userId, name, oldSticker, form) {
    return this._form("replaceStickerInSet", {
      ...form,
      user_id: userId,
      name,
      old_sticker: oldSticker
    });
  }
  setStickerEmojiList(sticker, emojiList, form = {}) {
    return this._form("setStickerEmojiList", {
      ...form,
      sticker,
      emoji_list: emojiList
    });
  }
  setStickerKeywords(sticker, form = {}) {
    return this._form("setStickerKeywords", { ...form, sticker });
  }
  setStickerMaskPosition(sticker, form = {}) {
    return this._form("setStickerMaskPosition", { ...form, sticker });
  }
  setStickerSetTitle(name, title, form = {}) {
    return this._form("setStickerSetTitle", {
      ...form,
      name,
      title
    });
  }
  setStickerSetThumbnail(userId, name, thumbnail, options = {}, fileOptions = {}) {
    return this._sendFile("setStickerSetThumbnail", "thumbnail", thumbnail, { ...options, user_id: userId, name }, fileOptions);
  }
  setCustomEmojiStickerSetThumbnail(name, form = {}) {
    return this._form("setCustomEmojiStickerSetThumbnail", {
      ...form,
      name
    });
  }
  deleteStickerSet(name, form = {}) {
    return this._form("deleteStickerSet", {
      ...form,
      name
    });
  }
  // --- Inline / web app -------------------------------------------------
  answerInlineQuery(inlineQueryId, results, form = {}) {
    return this._form("answerInlineQuery", {
      ...form,
      inline_query_id: inlineQueryId,
      results
    });
  }
  answerWebAppQuery(webAppQueryId, result, form = {}) {
    return this._form("answerWebAppQuery", {
      ...form,
      web_app_query_id: webAppQueryId,
      result: stringify$5(result)
    });
  }
  // --- Payments --------------------------------------------------------
  sendInvoice(chatId, title, description, payload, providerToken, currency, prices, form = {}) {
    const out2 = {
      ...form,
      chat_id: chatId,
      title,
      description,
      payload,
      provider_token: providerToken,
      currency,
      prices: stringify$5(prices)
    };
    if (out2.provider_data !== void 0)
      out2.provider_data = stringify$5(out2.provider_data);
    if (out2.suggested_tip_amounts)
      out2.suggested_tip_amounts = stringify$5(out2.suggested_tip_amounts);
    return this._form("sendInvoice", out2);
  }
  createInvoiceLink(title, description, payload, providerToken, currency, prices, form = {}) {
    return this._form("createInvoiceLink", {
      ...form,
      title,
      description,
      payload,
      provider_token: providerToken,
      currency,
      prices: stringify$5(prices)
    });
  }
  answerShippingQuery(shippingQueryId, ok, form = {}) {
    const out2 = { ...form, shipping_query_id: shippingQueryId, ok };
    if (out2.shipping_options)
      out2.shipping_options = stringify$5(out2.shipping_options);
    return this._form("answerShippingQuery", out2);
  }
  answerPreCheckoutQuery(preCheckoutQueryId, ok, form = {}) {
    return this._form("answerPreCheckoutQuery", {
      ...form,
      pre_checkout_query_id: preCheckoutQueryId,
      ok
    });
  }
  // --- Telegram Passport ------------------------------------------------
  setPassportDataErrors(userId, errors2, form = {}) {
    return this._form("setPassportDataErrors", {
      ...form,
      user_id: userId,
      errors: errors2
    });
  }
  // --- Telegram Stars --------------------------------------------------
  getMyStarBalance(form = {}) {
    return this._form("getMyStarBalance", form);
  }
  getStarTransactions(form = {}) {
    return this._form("getStarTransactions", form);
  }
  refundStarPayment(userId, telegramPaymentChargeId, form = {}) {
    return this._form("refundStarPayment", {
      ...form,
      user_id: userId,
      telegram_payment_charge_id: telegramPaymentChargeId
    });
  }
  editUserStarSubscription(userId, telegramPaymentChargeId, isCanceled, form = {}) {
    return this._form("editUserStarSubscription", {
      ...form,
      user_id: userId,
      telegram_payment_charge_id: telegramPaymentChargeId,
      is_canceled: isCanceled
    });
  }
  // --- Games -----------------------------------------------------------
  sendGame(chatId, gameShortName, form = {}) {
    return this._form("sendGame", {
      ...form,
      chat_id: chatId,
      game_short_name: gameShortName
    });
  }
  setGameScore(userId, score, form = {}) {
    return this._form("setGameScore", {
      ...form,
      user_id: userId,
      score
    });
  }
  getGameHighScores(userId, form = {}) {
    return this._form("getGameHighScores", {
      ...form,
      user_id: userId
    });
  }
  // --- Delete messages ------------------------------------------------
  deleteMessage(chatId, messageId, form = {}) {
    return this._form("deleteMessage", {
      ...form,
      chat_id: chatId,
      message_id: messageId
    });
  }
  deleteMessages(chatId, messageIds, form = {}) {
    return this._form("deleteMessages", {
      ...form,
      chat_id: chatId,
      message_ids: stringify$5(messageIds)
    });
  }
  deleteMessageReaction(chatId, messageId, form = {}) {
    return this._form("deleteMessageReaction", {
      ...form,
      chat_id: chatId,
      message_id: messageId
    });
  }
  deleteAllMessageReactions(chatId, form = {}) {
    return this._form("deleteAllMessageReactions", {
      ...form,
      chat_id: chatId
    });
  }
  // --- Gifts -----------------------------------------------------------
  getAvailableGifts(form = {}) {
    return this._form("getAvailableGifts", form);
  }
  sendGift(giftId, form = {}) {
    return this._form("sendGift", {
      ...form,
      gift_id: giftId
    });
  }
  giftPremiumSubscription(userId, monthCount, starCount, form = {}) {
    return this._form("giftPremiumSubscription", {
      ...form,
      user_id: userId,
      month_count: monthCount,
      star_count: starCount
    });
  }
  // --- Verification ---------------------------------------------------
  verifyUser(userId, form = {}) {
    return this._form("verifyUser", {
      ...form,
      user_id: userId
    });
  }
  verifyChat(chatId, form = {}) {
    return this._form("verifyChat", {
      ...form,
      chat_id: chatId
    });
  }
  removeUserVerification(userId, form = {}) {
    return this._form("removeUserVerification", {
      ...form,
      user_id: userId
    });
  }
  removeChatVerification(chatId, form = {}) {
    return this._form("removeChatVerification", {
      ...form,
      chat_id: chatId
    });
  }
  // --- Business accounts ----------------------------------------------
  readBusinessMessage(businessConnectionId, chatId, messageId, form = {}) {
    return this._form("readBusinessMessage", {
      ...form,
      business_connection_id: businessConnectionId,
      chat_id: chatId,
      message_id: messageId
    });
  }
  deleteBusinessMessages(businessConnectionId, messageIds, form = {}) {
    return this._form("deleteBusinessMessages", {
      ...form,
      business_connection_id: businessConnectionId,
      message_ids: messageIds
    });
  }
  setBusinessAccountName(businessConnectionId, firstName, form = {}) {
    return this._form("setBusinessAccountName", {
      ...form,
      business_connection_id: businessConnectionId,
      first_name: firstName
    });
  }
  setBusinessAccountUsername(businessConnectionId, form = {}) {
    return this._form("setBusinessAccountUsername", {
      ...form,
      business_connection_id: businessConnectionId
    });
  }
  setBusinessAccountBio(businessConnectionId, form = {}) {
    return this._form("setBusinessAccountBio", {
      ...form,
      business_connection_id: businessConnectionId
    });
  }
  async setBusinessAccountProfilePhoto(businessConnectionId, photo, form = {}) {
    const fieldName = photo.type === "static" ? "photo" : "animation";
    const fileInput = photo[fieldName];
    const { file: file2 } = await prepareFile(fileInput, {}, this.options.filepath);
    if (!file2) {
      throw new FatalError("setBusinessAccountProfilePhoto only supports file uploads (Buffer, Stream, or local path)");
    }
    const struct = { ...photo, [fieldName]: `attach://${fieldName}` };
    return this._request("setBusinessAccountProfilePhoto", {
      form: { ...form, photo: stringify$5(struct), business_connection_id: businessConnectionId },
      formData: { [fieldName]: file2 }
    });
  }
  removeBusinessAccountProfilePhoto(businessConnectionId, form = {}) {
    return this._form("removeBusinessAccountProfilePhoto", {
      ...form,
      business_connection_id: businessConnectionId
    });
  }
  setBusinessAccountGiftSettings(businessConnectionId, showGiftButton, acceptedGiftTypes, form = {}) {
    return this._form("setBusinessAccountGiftSettings", {
      ...form,
      business_connection_id: businessConnectionId,
      show_gift_button: showGiftButton,
      accepted_gift_types: acceptedGiftTypes
    });
  }
  getBusinessAccountStarBalance(businessConnectionId, form = {}) {
    return this._form("getBusinessAccountStarBalance", {
      ...form,
      business_connection_id: businessConnectionId
    });
  }
  transferBusinessAccountStars(businessConnectionId, starCount, form = {}) {
    return this._form("transferBusinessAccountStars", {
      ...form,
      business_connection_id: businessConnectionId,
      star_count: starCount
    });
  }
  getBusinessAccountGifts(businessConnectionId, form = {}) {
    return this._form("getBusinessAccountGifts", {
      ...form,
      business_connection_id: businessConnectionId
    });
  }
  getUserGifts(userId, form = {}) {
    return this._form("getUserGifts", {
      ...form,
      user_id: userId
    });
  }
  getChatGifts(chatId, form = {}) {
    return this._form("getChatGifts", {
      ...form,
      chat_id: chatId
    });
  }
  convertGiftToStars(businessConnectionId, ownedGiftId, form = {}) {
    return this._form("convertGiftToStars", {
      ...form,
      business_connection_id: businessConnectionId,
      owned_gift_id: ownedGiftId
    });
  }
  upgradeGift(businessConnectionId, ownedGiftId, form = {}) {
    return this._form("upgradeGift", {
      ...form,
      business_connection_id: businessConnectionId,
      owned_gift_id: ownedGiftId
    });
  }
  transferGift(businessConnectionId, ownedGiftId, newOwnerChatId, form = {}) {
    return this._form("transferGift", {
      ...form,
      business_connection_id: businessConnectionId,
      owned_gift_id: ownedGiftId,
      new_owner_chat_id: newOwnerChatId
    });
  }
  // --- Stories --------------------------------------------------------
  async postStory(businessConnectionId, content, activePeriod, options = {}) {
    if (!content.type)
      throw new FatalError("content.type is required");
    const form = {
      ...options,
      business_connection_id: businessConnectionId,
      active_period: activePeriod
    };
    const fileInput = content[content.type];
    const { formData, fileIds } = await prepareFiles(content.type, [{ media: fileInput }], {}, this.options.filepath);
    const inputContent = { ...content };
    inputContent[content.type] = fileIds[0] ?? `attach://${content.type}_0`;
    form.content = stringify$5(inputContent);
    return this._request("postStory", { form, formData });
  }
  repostStory(businessConnectionId, fromChatId, fromStoryId, activePeriod, form = {}) {
    return this._form("repostStory", {
      ...form,
      business_connection_id: businessConnectionId,
      from_chat_id: fromChatId,
      from_story_id: fromStoryId,
      active_period: activePeriod
    });
  }
  async editStory(businessConnectionId, storyId, content, options = {}) {
    if (!content.type)
      throw new FatalError("content.type is required");
    const form = {
      ...options,
      business_connection_id: businessConnectionId,
      story_id: storyId
    };
    const fileInput = content[content.type];
    const { formData, fileIds } = await prepareFiles(content.type, [{ media: fileInput }], {}, this.options.filepath);
    const inputContent = { ...content };
    inputContent[content.type] = fileIds[0] ?? `attach://${content.type}_0`;
    form.content = stringify$5(inputContent);
    return this._request("editStory", { form, formData });
  }
  deleteStory(businessConnectionId, storyId, form = {}) {
    return this._form("deleteStory", {
      ...form,
      business_connection_id: businessConnectionId,
      story_id: storyId
    });
  }
};
/** Static reference to the error classes the library throws. */
__publicField(_TelegramBot, "errors", errors$1);
/** The set of message-type events the library understands. */
__publicField(_TelegramBot, "messageTypes", MESSAGE_TYPES);
let TelegramBot = _TelegramBot;
let bot = null;
let currentToken = null;
const userStates = {};
const getTodayDateString = () => {
  const today = /* @__PURE__ */ new Date();
  const offset = today.getTimezoneOffset() * 6e4;
  return new Date(today.getTime() - offset).toISOString().split("T")[0];
};
const getRelativeDateString = (daysOffset) => {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() + daysOffset);
  const offset = date.getTimezoneOffset() * 6e4;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};
const getMonthStartEnd = (offsetMonths = 0) => {
  const date = /* @__PURE__ */ new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const tzOffsetStart = start.getTimezoneOffset() * 6e4;
  const tzOffsetEnd = end.getTimezoneOffset() * 6e4;
  return {
    start: new Date(start.getTime() - tzOffsetStart).toISOString().split("T")[0],
    end: new Date(end.getTime() - tzOffsetEnd).toISOString().split("T")[0]
  };
};
const getYearStartEnd = () => {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`
  };
};
async function initTelegramBot() {
  try {
    const db = await getDb();
    const settings = await db.get("SELECT * FROM company_settings LIMIT 1");
    if (!settings) return;
    const {
      telegram_bot_token,
      telegram_bot_enabled,
      telegram_chat_id
    } = settings;
    if (!telegram_bot_enabled || !telegram_bot_token) {
      if (bot) {
        try {
          await bot.stopPolling();
        } catch (e) {
          console.error("Error stopping telegram bot", e);
        }
        bot = null;
        currentToken = null;
        console.log("Telegram Bot stopped.");
      }
      return;
    }
    if (telegram_bot_token !== currentToken || !bot) {
      if (bot) {
        await bot.stopPolling();
      }
      bot = new TelegramBot(telegram_bot_token, { polling: true });
      bot.on("polling_error", (error2) => {
        if (error2.code === "EFATAL") {
        } else {
          console.error("Telegram Bot Polling Error:", error2.message || error2);
        }
      });
      currentToken = telegram_bot_token;
      console.log("Telegram Bot started.");
      setupBotCommands(bot);
      if (telegram_chat_id) {
        bot.sendMessage(telegram_chat_id, "✅ النظام يعمل الآن، البوت متصل. أرسل /start لعرض القائمة.").catch((e) => console.error("Could not send startup message", e));
      }
    }
  } catch (error2) {
    console.error("Failed to initialize Telegram Bot:", error2);
  }
}
function getMainMenuKeyboard(settings) {
  const keyboard = [];
  let row = [];
  if (settings.telegram_sales_report) row.push({ text: "📊 مبيعات اليوم" });
  if (settings.telegram_income_statement) row.push({ text: "💰 دخل اليوم" });
  if (row.length === 2) {
    keyboard.push(row);
    row = [];
  }
  if (settings.telegram_purchases_report) row.push({ text: "🛒 مشتريات اليوم" });
  if (settings.telegram_inventory_movement) row.push({ text: "🔄 حركة اليوم" });
  if (row.length === 2) {
    keyboard.push(row);
    row = [];
  }
  if (settings.telegram_customer_balances) row.push({ text: "👥 العملاء والموردين" });
  if (settings.telegram_balance_sheet) row.push({ text: "⚖️ الميزانية" });
  if (row.length === 2) {
    keyboard.push(row);
    row = [];
  }
  if (settings.telegram_purchase_prices) row.push({ text: "🏷️ أسعار اليوم" });
  if (row.length > 0) {
    keyboard.push(row);
  }
  keyboard.push([{ text: "📄 كشف تفصيلي" }]);
  return {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      is_persistent: true
    }
  };
}
function getDetailedMenuKeyboard(settings) {
  const keyboard = [];
  let row = [];
  if (settings.telegram_sales_report) row.push({ text: "📊 مبيعات تفصيلي" });
  if (settings.telegram_income_statement) row.push({ text: "💰 دخل تفصيلي" });
  if (row.length === 2) {
    keyboard.push(row);
    row = [];
  }
  if (settings.telegram_purchases_report) row.push({ text: "🛒 مشتريات تفصيلي" });
  if (settings.telegram_inventory_movement) row.push({ text: "🔄 حركة المخزون" });
  if (row.length === 2) {
    keyboard.push(row);
    row = [];
  }
  if (settings.telegram_customer_balances) row.push({ text: "👥 أرصدة العملاء" });
  if (settings.telegram_balance_sheet) row.push({ text: "⚖️ الميزانية العمومية" });
  if (row.length === 2) {
    keyboard.push(row);
    row = [];
  }
  if (settings.telegram_purchase_prices) row.push({ text: "🏷️ كشف تغيير الأسعار" });
  if (row.length > 0) {
    keyboard.push(row);
  }
  keyboard.push([{ text: "🔙 رجوع للقائمة الرئيسية" }]);
  return {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      is_persistent: true
    }
  };
}
function getPriceVariationsKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: "🔍 كشف سعر مادة" }, { text: "📋 كشف جميع المواد" }],
        [{ text: "🔙 الرجوع للقائمة التفصيلية" }]
      ],
      resize_keyboard: true,
      is_persistent: true
    }
  };
}
function getPartiesMenuKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: "👥 العملاء" }, { text: "🏢 الموردين" }],
        [{ text: "🔙 رجوع للقائمة الرئيسية" }]
      ],
      resize_keyboard: true,
      is_persistent: true
    }
  };
}
function getDateSelectionKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: "📅 اليوم" }, { text: "📅 الأمس" }],
        [{ text: "📅 آخر 7 أيام" }, { text: "📅 هذا الشهر" }],
        [{ text: "📅 الشهر الماضي" }, { text: "📅 هذه السنة" }],
        [{ text: "⌨️ إدخال تاريخ مخصص" }],
        [{ text: "🔙 إلغاء والرجوع للقائمة" }]
      ],
      resize_keyboard: true,
      is_persistent: true
    }
  };
}
function setupBotCommands(bot2) {
  const commandsList = [];
  commandsList.push({ command: "start", description: "عرض القائمة الرئيسية" });
  bot2.setMyCommands(commandsList).catch((e) => console.error("Error setting bot commands:", e));
  bot2.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const db = await getDb();
    const settings = await db.get("SELECT * FROM company_settings LIMIT 1");
    if (!settings) return;
    if (settings.telegram_chat_id && settings.telegram_chat_id !== String(chatId)) {
      return bot2.sendMessage(chatId, "⛔ غير مصرح لك باستخدام هذا البوت.");
    }
    userStates[chatId] = { step: "MAIN_MENU" };
    const welcomeMsg = `📦 مرحبآ بك في نظام المخزن برو 
🏢 هذا البوت مخصص الى شركة الاسرة (ادارة المخازن)
💻 تم التطوير البوت : المطور برو الحلول البرمجية
🌐 الموقع الاكتروني https://pro.iqa5.site/
✅ الرجاء اختيار أحد التقارير من القائمة :`;
    bot2.sendMessage(chatId, welcomeMsg, getMainMenuKeyboard(settings));
  });
  bot2.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "";
    if (text === "/start") return;
    const db = await getDb();
    const settings = await db.get("SELECT * FROM company_settings LIMIT 1");
    if (!settings) return;
    if (settings.telegram_chat_id && settings.telegram_chat_id !== String(chatId)) {
      bot2.sendMessage(chatId, "⛔ المعذرة، غير مصرح لك بطلب التقارير.");
      return;
    }
    if (!userStates[chatId]) {
      userStates[chatId] = { step: "MAIN_MENU" };
    }
    const state = userStates[chatId];
    const today = getTodayDateString();
    if (text === "🔙 رجوع للقائمة الرئيسية") {
      state.step = "MAIN_MENU";
      return bot2.sendMessage(chatId, "تم العودة للقائمة الرئيسية.", getMainMenuKeyboard(settings));
    }
    if (text === "🔙 إلغاء والرجوع للقائمة") {
      if (state.reportType === "📋 كشف جميع المواد" || state.reportType === "🔍 كشف سعر مادة") {
        state.step = "PRICE_VARIATIONS_MENU";
        state.reportType = void 0;
        return bot2.sendMessage(chatId, "تم إلغاء تحديد التاريخ.", getPriceVariationsKeyboard());
      } else {
        state.step = "DETAILED_MENU";
        state.reportType = void 0;
        return bot2.sendMessage(chatId, "تم إلغاء تحديد التاريخ.", getDetailedMenuKeyboard(settings));
      }
    }
    if (text === "🔙 الرجوع للقائمة التفصيلية") {
      state.step = "DETAILED_MENU";
      return bot2.sendMessage(chatId, "تم العودة للقائمة التفصيلية.", getDetailedMenuKeyboard(settings));
    }
    if (text === "📄 كشف تفصيلي") {
      state.step = "DETAILED_MENU";
      return bot2.sendMessage(chatId, "اختر التقرير التفصيلي الذي تريده:", getDetailedMenuKeyboard(settings));
    }
    if (state.step === "MAIN_MENU") {
      if (text === "📊 مبيعات اليوم" || text === "/sales") return sendSalesReport(chatId, today, today, db, settings);
      if (text === "💰 دخل اليوم" || text === "/income") return sendIncomeStatement(chatId, today, today, db, settings);
      if (text === "🛒 مشتريات اليوم" || text === "/purchases") return sendPurchasesReport(chatId, today, today, db, settings);
      if (text === "🔄 حركة اليوم" || text === "/inventory") return sendInventoryMovement(chatId, today, today, db, settings);
      if (text === "👥 العملاء والموردين" || text === "/parties") {
        state.step = "PARTIES_MENU";
        return bot2.sendMessage(chatId, "اختر نوع الحسابات:", getPartiesMenuKeyboard());
      }
      if (text === "⚖️ الميزانية" || text === "/balancesheet") return sendBalanceSheet(chatId, db, settings);
      if (text === "🏷️ أسعار اليوم" || text === "/prices") return sendPriceVariationsReport(chatId, today, today, null, db, settings);
    }
    if (state.step === "DETAILED_MENU") {
      if (text === "🏷️ كشف تغيير الأسعار") {
        state.step = "PRICE_VARIATIONS_MENU";
        return bot2.sendMessage(chatId, "اختر نوع كشف تغير الأسعار:", getPriceVariationsKeyboard());
      }
      if (text === "👥 أرصدة العملاء") return sendCustomersReport(chatId, db, settings);
      if (text === "⚖️ الميزانية العمومية") return sendBalanceSheet(chatId, db, settings);
      const requiresDate = ["📊 مبيعات تفصيلي", "💰 دخل تفصيلي", "🛒 مشتريات تفصيلي", "🔄 حركة المخزون"].includes(text);
      if (requiresDate) {
        state.step = "DATE_SELECTION";
        state.reportType = text;
        return bot2.sendMessage(chatId, `اختر الفترة الزمنية لـ (${text}):`, getDateSelectionKeyboard());
      }
    }
    if (state.step === "PRICE_VARIATIONS_MENU") {
      if (text === "📋 كشف جميع المواد") {
        state.step = "DATE_SELECTION";
        state.reportType = text;
        return bot2.sendMessage(chatId, `اختر الفترة الزمنية لكشف جميع المواد:`, getDateSelectionKeyboard());
      }
      if (text === "🔍 كشف سعر مادة") {
        state.step = "PRICE_VAR_ITEM_NAME";
        return bot2.sendMessage(chatId, "يرجى كتابة اسم المادة (الصنف) للبحث عنها:", { reply_markup: { remove_keyboard: true } });
      }
    }
    if (state.step === "PRICE_VAR_ITEM_NAME") {
      state.itemName = text;
      state.step = "DATE_SELECTION";
      state.reportType = "🔍 كشف سعر مادة";
      return bot2.sendMessage(chatId, `لقد اخترت المادة: ${text}
الآن اختر الفترة الزمنية:`, getDateSelectionKeyboard());
    }
    if (state.step === "PARTIES_MENU") {
      if (text === "👥 العملاء") return sendCustomersReport(chatId, db, settings);
      if (text === "🏢 الموردين") return sendSuppliersReport(chatId, db, settings);
    }
    if (state.step === "DATE_SELECTION") {
      if (text === "⌨️ إدخال تاريخ مخصص") {
        state.step = "CUSTOM_DATE_INPUT";
        return bot2.sendMessage(chatId, "أدخل التاريخ بالصيغة التالية:\n`YYYY-MM-DD الى YYYY-MM-DD`\nأو يوم واحد:\n`YYYY-MM-DD`", {
          parse_mode: "Markdown",
          reply_markup: { remove_keyboard: true }
          // hide keyboard temporarily
        });
      }
      let start = today, end = today;
      if (text === "📅 اليوم") {
        start = today;
        end = today;
      } else if (text === "📅 الأمس") {
        const yesterday = getRelativeDateString(-1);
        start = yesterday;
        end = yesterday;
      } else if (text === "📅 آخر 7 أيام") {
        start = getRelativeDateString(-6);
        end = today;
      } else if (text === "📅 هذا الشهر") {
        const p = getMonthStartEnd(0);
        start = p.start;
        end = p.end;
      } else if (text === "📅 الشهر الماضي") {
        const p = getMonthStartEnd(-1);
        start = p.start;
        end = p.end;
      } else if (text === "📅 هذه السنة") {
        const p = getYearStartEnd();
        start = p.start;
        end = p.end;
      } else return;
      return handleDetailedReportTrigger(chatId, start, end, state, db, settings);
    }
    if (state.step === "CUSTOM_DATE_INPUT") {
      let start, end;
      if (text.includes("الى")) {
        const parts = text.split("الى").map((s) => s.trim());
        start = parts[0];
        end = parts[1];
      } else {
        start = text.trim();
        end = text.trim();
      }
      if (!start.match(/^\d{4}-\d{2}-\d{2}$/) || !end.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return bot2.sendMessage(chatId, "❌ صيغة التاريخ غير صحيحة. يرجى الإدخال بصيغة YYYY-MM-DD (مثال: 2026-01-01)");
      }
      return handleDetailedReportTrigger(chatId, start, end, state, db, settings);
    }
  });
  async function handleDetailedReportTrigger(chatId, start, end, state, db, settings) {
    const reportType = state.reportType;
    state.step = "DETAILED_MENU";
    state.reportType = void 0;
    bot2.sendMessage(chatId, `جاري استخراج البيانات من ${start} إلى ${end}...`);
    if (reportType === "📊 مبيعات تفصيلي") await sendSalesReport(chatId, start, end, db, settings);
    else if (reportType === "💰 دخل تفصيلي") await sendIncomeStatement(chatId, start, end, db, settings);
    else if (reportType === "🛒 مشتريات تفصيلي") await sendPurchasesReport(chatId, start, end, db, settings);
    else if (reportType === "🔄 حركة المخزون") await sendInventoryMovement(chatId, start, end, db, settings);
    else if (reportType === "📋 كشف جميع المواد") await sendPriceVariationsReport(chatId, start, end, null, db, settings);
    else if (reportType === "🔍 كشف سعر مادة") await sendPriceVariationsReport(chatId, start, end, state.itemName || null, db, settings);
    bot2.sendMessage(chatId, "اختر تقريراً آخر أو ارجع للقائمة:", getDetailedMenuKeyboard(settings));
  }
  const formatNum = (num) => {
    if (num === null || num === void 0 || isNaN(num)) return "0";
    return Number(num).toLocaleString("en-US");
  };
  async function sendSalesReport(chatId, start, end, db, settings) {
    if (!settings.telegram_sales_report) return bot2.sendMessage(chatId, "⚠️ تقرير المبيعات غير مفعل.");
    try {
      const sales = await db.all(`
        SELECT i.invoice_number, i.total, i.currency, i.date, p.name as party_name
        FROM invoices i LEFT JOIN parties p ON i.party_id = p.id
        WHERE i.type = 'sale' AND i.date BETWEEN ? AND ?
        ORDER BY i.date ASC
      `, [start, end]);
      let reply = `📊 *تقرير المبيعات*
من ${start} إلى ${end}

`;
      let totalSales = 0;
      sales.forEach((s) => {
        reply += `- [${s.date}] ${s.invoice_number}: ${formatNum(s.total)} ${s.currency} (${s.party_name || "نقدي"})
`;
        totalSales += s.total;
      });
      reply += `
*الإجمالي للفترة: ${formatNum(totalSales)}*`;
      bot2.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (e) {
      bot2.sendMessage(chatId, "❌ حدث خطأ أثناء جلب تقرير المبيعات.");
    }
  }
  async function sendIncomeStatement(chatId, start, end, db, settings) {
    var _a, _b;
    if (!settings.telegram_income_statement) return bot2.sendMessage(chatId, "⚠️ قائمة الدخل غير مفعلة.");
    try {
      const revenues = await db.all(`SELECT SUM(amount) as value FROM treasury_transactions WHERE type = 'income' AND date BETWEEN ? AND ?`, [start, end]);
      const expenses = await db.all(`SELECT SUM(amount) as value FROM treasury_transactions WHERE type = 'expense' AND date BETWEEN ? AND ?`, [start, end]);
      const rev = ((_a = revenues[0]) == null ? void 0 : _a.value) || 0;
      const exp = ((_b = expenses[0]) == null ? void 0 : _b.value) || 0;
      const net = rev - exp;
      let reply = `💰 *قائمة الدخل*
من ${start} إلى ${end}

`;
      reply += `🟢 الإيرادات: ${formatNum(rev)}
`;
      reply += `🔴 المصروفات: ${formatNum(exp)}
`;
      reply += `================
`;
      reply += `*صافي الدخل: ${formatNum(net)}*`;
      bot2.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (e) {
      bot2.sendMessage(chatId, "❌ حدث خطأ أثناء جلب قائمة الدخل.");
    }
  }
  async function sendPurchasesReport(chatId, start, end, db, settings) {
    if (!settings.telegram_purchases_report) return bot2.sendMessage(chatId, "⚠️ تقرير المشتريات غير مفعل.");
    try {
      const purchases = await db.all(`
        SELECT i.invoice_number, i.total, i.currency, i.date, p.name as party_name
        FROM invoices i LEFT JOIN parties p ON i.party_id = p.id
        WHERE i.type = 'purchase' AND i.date BETWEEN ? AND ?
        ORDER BY i.date ASC
      `, [start, end]);
      let reply = `🛒 *تقرير المشتريات*
من ${start} إلى ${end}

`;
      let totalPurchases = 0;
      purchases.forEach((s) => {
        reply += `- [${s.date}] ${s.invoice_number}: ${formatNum(s.total)} ${s.currency} (${s.party_name || "نقدي"})
`;
        totalPurchases += s.total;
      });
      reply += `
*الإجمالي للفترة: ${formatNum(totalPurchases)}*`;
      bot2.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (e) {
      bot2.sendMessage(chatId, "❌ حدث خطأ أثناء جلب المشتريات.");
    }
  }
  async function sendInventoryMovement(chatId, start, end, db, settings) {
    if (!settings.telegram_inventory_movement) return bot2.sendMessage(chatId, "⚠️ تقرير حركة المخزون غير مفعل.");
    try {
      const movement = await db.all(`
        SELECT p.name, 
               SUM(CASE WHEN i.type = 'purchase' OR i.type = 'sale_return' THEN ii.quantity ELSE 0 END) as inward, 
               SUM(CASE WHEN i.type = 'sale' OR i.type = 'purchase_return' THEN ii.quantity ELSE 0 END) as outward
        FROM products p 
        LEFT JOIN invoice_items ii ON p.id = ii.product_id 
        LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.date BETWEEN ? AND ?
        GROUP BY p.id HAVING inward > 0 OR outward > 0
      `, [start, end]);
      let reply = `🔄 *حركة المخزون*
من ${start} إلى ${end}

`;
      if (movement.length === 0) reply += "لا توجد حركة في هذه الفترة.";
      movement.forEach((m) => {
        reply += `📦 ${m.name}: +${formatNum(m.inward)} | -${formatNum(m.outward)}
`;
      });
      bot2.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (e) {
      bot2.sendMessage(chatId, "❌ حدث خطأ أثناء جلب حركة المخزون.");
    }
  }
  async function sendCustomersReport(chatId, db, settings) {
    if (!settings.telegram_customer_balances) return bot2.sendMessage(chatId, "⚠️ أرصدة العملاء غير مفعلة.");
    try {
      const customers = await db.all(`SELECT name, current_balance_iqd, current_balance_usd FROM parties WHERE type = 'customer' ORDER BY current_balance_iqd DESC LIMIT 30`);
      let reply = `👥 *أرصدة العملاء الحالية (أعلى 30)*

`;
      if (customers.length === 0) reply += "لا يوجد عملاء مسجلين.";
      customers.forEach((c) => {
        reply += `👤 ${c.name}: ${formatNum(c.current_balance_iqd)} دينار | ${formatNum(c.current_balance_usd)} دولار
`;
      });
      bot2.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (e) {
      bot2.sendMessage(chatId, "❌ حدث خطأ أثناء جلب أرصدة العملاء.");
    }
  }
  async function sendSuppliersReport(chatId, db, settings) {
    if (!settings.telegram_customer_balances) return bot2.sendMessage(chatId, "⚠️ أرصدة الموردين غير مفعلة.");
    try {
      const suppliers = await db.all(`SELECT name, current_balance_iqd, current_balance_usd FROM parties WHERE type = 'supplier' ORDER BY current_balance_iqd DESC LIMIT 30`);
      let reply = `🏢 *أرصدة الموردين الحالية (أعلى 30)*

`;
      if (suppliers.length === 0) reply += "لا يوجد موردين مسجلين.";
      suppliers.forEach((s) => {
        reply += `🏢 ${s.name}: ${formatNum(s.current_balance_iqd)} دينار | ${formatNum(s.current_balance_usd)} دولار
`;
      });
      bot2.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (e) {
      bot2.sendMessage(chatId, "❌ حدث خطأ أثناء جلب أرصدة الموردين.");
    }
  }
  async function sendBalanceSheet(chatId, db, settings) {
    if (!settings.telegram_balance_sheet) return bot2.sendMessage(chatId, "⚠️ الميزانية العمومية غير مفعلة.");
    try {
      const treasury = await db.get(`SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as balance FROM treasury_transactions`);
      const inventory = await db.get(`SELECT SUM(current_stock * purchase_price) as value FROM products`);
      const customers = await db.get(`SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'customer'`);
      const suppliers = await db.get(`SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'supplier'`);
      let reply = `⚖️ *الميزانية العمومية الحالية*

`;
      reply += `*الأصول:*
`;
      reply += `- نقدية بالخزينة: ${formatNum((treasury == null ? void 0 : treasury.balance) || 0)}
`;
      reply += `- قيمة المخزون: ${formatNum((inventory == null ? void 0 : inventory.value) || 0)}
`;
      reply += `- ذمم عملاء: ${formatNum((customers == null ? void 0 : customers.total) || 0)}

`;
      reply += `*الخصوم:*
`;
      reply += `- ذمم موردين: ${formatNum((suppliers == null ? void 0 : suppliers.total) || 0)}
`;
      bot2.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (e) {
      bot2.sendMessage(chatId, "❌ حدث خطأ أثناء جلب الميزانية.");
    }
  }
  async function sendPriceVariationsReport(chatId, start, end, itemName, db, settings) {
    if (!settings.telegram_purchase_prices) return bot2.sendMessage(chatId, "⚠️ كشف تغيير الأسعار غير مفعل.");
    try {
      let query = `
        SELECT p.name, ii.unit_price, ii.quantity, i.date, i.invoice_number
        FROM invoice_items ii 
        JOIN invoices i ON ii.invoice_id = i.id 
        JOIN products p ON ii.product_id = p.id
        WHERE i.type = 'purchase' AND i.date BETWEEN ? AND ?
      `;
      const params = [start, end];
      if (itemName && itemName.trim() !== "") {
        query += ` AND p.name LIKE ?`;
        params.push(`%${itemName}%`);
      }
      query += ` ORDER BY i.date DESC LIMIT 50`;
      const prices = await db.all(query, ...params);
      let reply = itemName ? `🔍 *كشف سعر مادة (${itemName})*
من ${start} إلى ${end}

` : `📋 *كشف تغير أسعار جميع المواد*
من ${start} إلى ${end}

`;
      if (prices.length === 0) reply += "لا توجد حركات شراء خلال هذه الفترة.";
      prices.forEach((p) => {
        reply += `🔹 المادة: ${p.name}
السعر: ${formatNum(p.unit_price)} | الكمية: ${p.quantity}
التاريخ: ${p.date} | الفاتورة: ${p.invoice_number}

`;
      });
      bot2.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (e) {
      bot2.sendMessage(chatId, "❌ حدث خطأ أثناء جلب كشف تغير الأسعار.");
    }
  }
}
const isDev = !require$$1.app.isPackaged;
const dbPath = isDev ? path$n.join(process.cwd(), "database", "inventory.db") : path$n.join(require$$1.app.getPath("userData"), "inventory.db");
function initSettingsIpc() {
  require$$1.ipcMain.handle("settings:get", async () => {
    try {
      const db = await getDb();
      const settings = await db.get("SELECT * FROM company_settings LIMIT 1");
      return settings || {
        name: "المخزون برو",
        currency: "SAR",
        tax_rate: 15,
        tax_enabled: 1
      };
    } catch (error2) {
      console.error("Error fetching settings:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("settings:update", async (_, data) => {
    try {
      const db = await getDb();
      const keys = Object.keys(data);
      const setClause = keys.map((key) => `${key} = ?`).join(", ");
      const values = Object.values(data);
      const existing = await db.get("SELECT id FROM company_settings LIMIT 1");
      if (existing) {
        await db.run(`UPDATE company_settings SET ${setClause} WHERE id = ?`, ...values, existing.id);
      } else {
        const columns = keys.join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        await db.run(`INSERT INTO company_settings (${columns}) VALUES (${placeholders})`, ...values);
      }
      initTelegramBot();
      return { success: true };
    } catch (error2) {
      console.error("Error updating settings:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("settings:exportBackup", async () => {
    try {
      const now = /* @__PURE__ */ new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const dd = pad(now.getDate());
      const mm = pad(now.getMonth() + 1);
      const yyyy = now.getFullYear();
      const hh = pad(now.getHours());
      const min = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      const dateStr = `${dd}-${mm}-${yyyy}_${hh}-${min}-${ss}`;
      const win2 = require$$1.BrowserWindow.getFocusedWindow();
      const options = {
        title: "حفظ نسخة احتياطية",
        defaultPath: `Inventory_Pro_System_${dateStr}.db`,
        filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }, { name: "All Files", extensions: ["*"] }]
      };
      const { canceled, filePath } = win2 ? await require$$1.dialog.showSaveDialog(win2, options) : await require$$1.dialog.showSaveDialog(options);
      if (!canceled && filePath) {
        const db = await getDb();
        await db.run(`VACUUM INTO '${filePath}'`);
        return { success: true, filePath };
      }
      return { success: false, canceled: true };
    } catch (error2) {
      console.error("Error exporting backup:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("settings:importBackup", async () => {
    try {
      const { canceled, filePaths } = await require$$1.dialog.showOpenDialog({
        title: "استيراد نسخة احتياطية",
        properties: ["openFile"],
        filters: [{ name: "Database Files", extensions: ["db", "sqlite"] }]
      });
      if (!canceled && filePaths.length > 0) {
        await closeDb();
        const walPath = dbPath + "-wal";
        const shmPath = dbPath + "-shm";
        if (fs$k.existsSync(walPath)) fs$k.unlinkSync(walPath);
        if (fs$k.existsSync(shmPath)) fs$k.unlinkSync(shmPath);
        fs$k.copyFileSync(filePaths[0], dbPath);
        await getDb();
        const windows = require$$1.BrowserWindow.getAllWindows();
        if (windows.length > 0) {
          windows.forEach((win2) => win2.reload());
        }
        return { success: true };
      }
      return { success: false, canceled: true };
    } catch (error2) {
      console.error("Error importing backup:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("settings:selectDirectory", async () => {
    try {
      const { canceled, filePaths } = await require$$1.dialog.showOpenDialog({
        title: "تحديد مجلد النسخ الاحتياطي (Google Drive)",
        properties: ["openDirectory"]
      });
      if (!canceled && filePaths.length > 0) {
        return { success: true, filePath: filePaths[0] };
      }
      return { success: false, canceled: true };
    } catch (error2) {
      console.error("Error selecting directory:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("settings:saveBase64File", async (_, data) => {
    try {
      const { base64, defaultName } = data;
      const win2 = require$$1.BrowserWindow.getFocusedWindow();
      const options = {
        title: "حفظ الملف",
        defaultPath: defaultName,
        filters: [{ name: "PDF Files", extensions: ["pdf"] }, { name: "All Files", extensions: ["*"] }]
      };
      const { canceled, filePath } = win2 ? await require$$1.dialog.showSaveDialog(win2, options) : await require$$1.dialog.showSaveDialog(options);
      if (!canceled && filePath) {
        const base64Data = base64.replace(/^data:([A-Za-z-+/]+);base64,/, "");
        fs$k.writeFileSync(filePath, base64Data, "base64");
        return { success: true, filePath };
      }
      return { success: false, canceled: true };
    } catch (error2) {
      console.error("Error saving file:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("settings:printToPDF", async (event, data) => {
    try {
      const win2 = require$$1.BrowserWindow.fromWebContents(event.sender);
      if (!win2) return { success: false, error: "No active window" };
      const { defaultName } = data;
      const options = {
        title: "حفظ PDF",
        defaultPath: defaultName,
        filters: [{ name: "PDF Files", extensions: ["pdf"] }, { name: "All Files", extensions: ["*"] }]
      };
      const { canceled, filePath } = await require$$1.dialog.showSaveDialog(win2, options);
      if (!canceled && filePath) {
        const pdfBuffer = await win2.webContents.printToPDF({
          printBackground: true,
          landscape: true,
          pageSize: "A4",
          margins: { marginType: "default" }
        });
        fs$k.writeFileSync(filePath, pdfBuffer);
        return { success: true, filePath };
      }
      return { success: false, canceled: true };
    } catch (error2) {
      console.error("Error generating PDF via Electron:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("settings:installLocalUpdate", async (event) => {
    try {
      const win2 = require$$1.BrowserWindow.fromWebContents(event.sender);
      if (!win2) return { success: false, error: "No active window" };
      const { canceled, filePaths } = await require$$1.dialog.showOpenDialog(win2, {
        title: "اختر ملف التحديث",
        properties: ["openFile"],
        filters: [{ name: "Executable Files", extensions: ["exe"] }]
      });
      if (!canceled && filePaths.length > 0) {
        const updateFilePath = filePaths[0];
        const installerProcess = node_child_process.spawn(updateFilePath, [], {
          detached: true,
          stdio: "ignore"
        });
        installerProcess.unref();
        setTimeout(() => {
          require$$1.app.quit();
        }, 1e3);
        return { success: true };
      }
      return { success: false, canceled: true };
    } catch (error2) {
      console.error("Error starting local update:", error2);
      return { success: false, error: error2.message };
    }
  });
  require$$1.ipcMain.handle("settings:closeFiscalYear", async () => {
    try {
      const now = /* @__PURE__ */ new Date();
      const year = now.getFullYear();
      const win2 = require$$1.BrowserWindow.getFocusedWindow();
      const options = {
        title: "أرشفة وحفظ بيانات السنة المنتهية",
        defaultPath: `Archive_Year_${year}.db`,
        filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }, { name: "All Files", extensions: ["*"] }]
      };
      const { canceled, filePath } = win2 ? await require$$1.dialog.showSaveDialog(win2, options) : await require$$1.dialog.showSaveDialog(options);
      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }
      const db = await getDb();
      await db.run(`VACUUM INTO '${filePath}'`);
      await db.run("BEGIN TRANSACTION");
      try {
        const parties = await db.all(`SELECT id, current_balance_iqd, current_balance_usd FROM parties`);
        for (const party of parties) {
          await db.run(
            `UPDATE parties SET opening_balance_iqd = ?, opening_balance_usd = ? WHERE id = ?`,
            party.current_balance_iqd,
            party.current_balance_usd,
            party.id
          );
        }
        const treasuries = await db.all(`SELECT id, balance_iqd, balance_usd FROM treasuries`);
        for (const t2 of treasuries) {
          await db.run(
            `UPDATE treasuries SET opening_balance_iqd = ?, opening_balance_usd = ? WHERE id = ?`,
            t2.balance_iqd,
            t2.balance_usd,
            t2.id
          );
        }
        await db.run(`DELETE FROM invoice_items`);
        await db.run(`DELETE FROM invoices`);
        await db.run(`DELETE FROM party_transactions`);
        await db.run(`DELETE FROM treasury_transactions`);
        await db.run(`DELETE FROM stocktake_items`);
        await db.run(`DELETE FROM inventory_stocktakes`);
        await db.run(`DELETE FROM sqlite_sequence WHERE name IN ('invoice_items', 'invoices', 'party_transactions', 'treasury_transactions', 'stocktake_items', 'inventory_stocktakes')`);
        const nextYearStart = `${year + 1}-01-01`;
        const nextYearEnd = `${year + 1}-12-31`;
        await db.run(`UPDATE company_settings SET financial_year_start = ?, financial_year_end = ?`, nextYearStart, nextYearEnd);
        await db.run("COMMIT");
        return { success: true };
      } catch (err) {
        await db.run("ROLLBACK");
        throw err;
      }
    } catch (error2) {
      console.error("Error closing fiscal year:", error2);
      return { success: false, error: error2.message };
    }
  });
}
function initProductsIpc() {
  require$$1.ipcMain.handle("products:getAll", async (_, params = {}) => {
    const db = await getDb();
    const { page = 1, limit = 10, search = "" } = params;
    const offset = (page - 1) * limit;
    let query = `
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE (p.name LIKE ? OR p.code LIKE ?)
    `;
    const queryParams = [`%${search}%`, `%${search}%`];
    if (params.category_id) {
      query += ` AND p.category_id = ?`;
      queryParams.push(params.category_id);
    }
    const total = await db.get(`SELECT COUNT(*) as count ${query}`, ...queryParams);
    const data = await db.all(`
      SELECT p.*, c.name as category_name, u.name as unit_name 
      ${query}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, ...queryParams, limit, offset);
    return { data, total: total.count, page, limit };
  });
  require$$1.ipcMain.handle("products:search", async (_, query) => {
    const db = await getDb();
    return db.all(`
      SELECT p.*, c.name as category_name, u.name as unit_name 
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.name LIKE ? OR p.code LIKE ?
    `, `%${query}%`, `%${query}%`);
  });
  require$$1.ipcMain.handle("products:create", async (_, data) => {
    const db = await getDb();
    let { code, name, category_id, unit_id, purchase_price, sale_price, currency, opening_stock, warehouse_id, allow_negative_stock } = data;
    if (!code || code.includes("PRD-")) {
      const lastProduct = await db.get(`SELECT code FROM products WHERE code LIKE 'PRD-%' ORDER BY id DESC LIMIT 1`);
      let nextNum = 1;
      if (lastProduct && lastProduct.code) {
        const numPart = lastProduct.code.replace("PRD-", "");
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed)) nextNum = parsed + 1;
      }
      code = `PRD-${nextNum.toString().padStart(4, "0")}`;
    }
    const result = await db.run(`
      INSERT INTO products (code, name, category_id, unit_id, purchase_price, sale_price, currency, opening_stock, current_stock, warehouse_id, allow_negative_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, code, name, category_id, unit_id, purchase_price, sale_price, currency || "IQD", opening_stock, opening_stock, warehouse_id, allow_negative_stock ? 1 : 0);
    return { id: result.lastID };
  });
  require$$1.ipcMain.handle("products:update", async (_, id, data) => {
    const db = await getDb();
    if (data.allow_negative_stock !== void 0) {
      data.allow_negative_stock = data.allow_negative_stock ? 1 : 0;
    }
    const keys = Object.keys(data);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    const values = Object.values(data);
    await db.run(`UPDATE products SET ${setClause} WHERE id = ?`, ...values, id);
    return { success: true };
  });
  require$$1.ipcMain.handle("products:delete", async (_, id) => {
    const db = await getDb();
    await db.run("DELETE FROM products WHERE id = ?", id);
    return { success: true };
  });
  require$$1.ipcMain.handle("categories:getAll", async () => {
    const db = await getDb();
    return db.all("SELECT * FROM product_categories");
  });
  require$$1.ipcMain.handle("units:getAll", async () => {
    const db = await getDb();
    return db.all("SELECT * FROM units");
  });
}
function initPartiesIpc() {
  require$$1.ipcMain.handle("parties:getAll", async (_, type2) => {
    const db = await getDb();
    if (type2 === "all") {
      return db.all("SELECT * FROM parties ORDER BY name ASC");
    }
    return db.all("SELECT * FROM parties WHERE type = ? ORDER BY name ASC", type2);
  });
  require$$1.ipcMain.handle("parties:create", async (_, data) => {
    const db = await getDb();
    const { code, type: type2, name, address, phone, email, opening_balance_iqd, opening_balance_usd } = data;
    const result = await db.run(`
      INSERT INTO parties (code, type, name, address, phone, email, opening_balance_iqd, opening_balance_usd, current_balance_iqd, current_balance_usd)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, code, type2, name, address, phone, email, opening_balance_iqd || 0, opening_balance_usd || 0, opening_balance_iqd || 0, opening_balance_usd || 0);
    return { id: result.lastID };
  });
  require$$1.ipcMain.handle("parties:update", async (_, id, data) => {
    const db = await getDb();
    const keys = Object.keys(data);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    const values = Object.values(data);
    await db.run(`UPDATE parties SET ${setClause} WHERE id = ?`, ...values, id);
    return { success: true };
  });
  require$$1.ipcMain.handle("parties:getTransactions", async (_, partyId) => {
    const db = await getDb();
    return db.all(`
      SELECT * FROM party_transactions 
      WHERE party_id = ? 
      ORDER BY date DESC, created_at DESC
    `, partyId);
  });
  require$$1.ipcMain.handle("parties:delete", async (_, id) => {
    const db = await getDb();
    const txCount = await db.get("SELECT COUNT(*) as count FROM party_transactions WHERE party_id = ?", id);
    const invoiceCount = await db.get("SELECT COUNT(*) as count FROM invoices WHERE party_id = ?", id);
    if (txCount && txCount.count > 0 || invoiceCount && invoiceCount.count > 0) {
      throw new Error("لا يمكن حذف العميل/المورد لارتباطه بفواتير أو حركات مالية");
    }
    await db.run("DELETE FROM parties WHERE id = ?", id);
    return { success: true };
  });
}
function initInvoicesIpc() {
  require$$1.ipcMain.handle("invoices:getAll", async (_, filters = {}) => {
    const db = await getDb();
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;
    let baseQuery = `
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE 1=1
    `;
    const params = [];
    if (filters == null ? void 0 : filters.type) {
      if (Array.isArray(filters.type)) {
        baseQuery += ` AND i.type IN (${filters.type.map(() => "?").join(", ")})`;
        params.push(...filters.type);
      } else {
        baseQuery += ` AND i.type = ?`;
        params.push(filters.type);
      }
    }
    if (filters == null ? void 0 : filters.search) {
      baseQuery += ` AND (i.invoice_number LIKE ? OR p.name LIKE ? OR i.buyer_name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters == null ? void 0 : filters.startDate) {
      baseQuery += ` AND i.date >= ?`;
      params.push(filters.startDate);
    }
    if (filters == null ? void 0 : filters.endDate) {
      baseQuery += ` AND i.date <= ?`;
      params.push(filters.endDate);
    }
    const total = await db.get(`SELECT COUNT(*) as count ${baseQuery}`, ...params);
    const data = await db.all(`
      SELECT i.*, p.name as party_name 
      ${baseQuery}
      ORDER BY i.date DESC, i.created_at DESC
      LIMIT ? OFFSET ?
    `, ...params, limit, offset);
    return { data, total: total.count, page, limit };
  });
  require$$1.ipcMain.handle("invoices:getOne", async (_, id) => {
    const db = await getDb();
    const invoice = await db.get(`
      SELECT i.*, p.name as party_name, p.phone as party_phone, p.address as party_address
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE i.id = ?
    `, id);
    if (invoice) {
      const items = await db.all(`
        SELECT ii.*, p.name as product_name, p.code as product_code
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        WHERE ii.invoice_id = ?
      `, id);
      return { ...invoice, items };
    }
    return null;
  });
  require$$1.ipcMain.handle("invoices:create", async (_, data) => {
    const db = await getDb();
    const {
      invoice_number,
      type: type2,
      party_id,
      date,
      subtotal,
      discount_amount,
      discount_type,
      tax_rate,
      tax_amount,
      total,
      paid_amount,
      remaining_amount,
      currency,
      payment_method,
      status,
      buyer_name,
      notes,
      items,
      created_by
    } = data;
    try {
      await db.run("BEGIN TRANSACTION");
      const warnings = [];
      let finalInvoiceNumber = invoice_number;
      if (!finalInvoiceNumber || finalInvoiceNumber.includes("INV-") || finalInvoiceNumber.includes("PUR-")) {
        const prefix = type2.includes("sale") ? "INV-" : "PUR-";
        const lastInvoice = await db.get(`SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`, `${prefix}%`);
        let nextNum = 1;
        if (lastInvoice && lastInvoice.invoice_number) {
          const numPart = lastInvoice.invoice_number.replace(prefix, "");
          const parsed = parseInt(numPart, 10);
          if (!isNaN(parsed)) {
            nextNum = parsed + 1;
          }
        }
        finalInvoiceNumber = `${prefix}${nextNum.toString().padStart(4, "0")}`;
      }
      const result = await db.run(
        `
        INSERT INTO invoices (
          invoice_number, type, party_id, date, subtotal, discount_amount, 
          discount_type, tax_rate, tax_amount, total, paid_amount, 
          remaining_amount, currency, payment_method, status, buyer_name, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        finalInvoiceNumber,
        type2,
        party_id,
        date,
        subtotal,
        discount_amount,
        discount_type,
        tax_rate,
        tax_amount,
        total,
        paid_amount,
        remaining_amount,
        currency || "IQD",
        payment_method,
        status || "confirmed",
        buyer_name,
        notes,
        created_by
      );
      const invoiceId = result.lastID;
      for (const item of items) {
        let stockChange = 0;
        if (type2 === "sale") stockChange = -item.quantity;
        else if (type2 === "purchase") stockChange = item.quantity;
        else if (type2 === "sale_return") stockChange = item.quantity;
        else if (type2 === "purchase_return") stockChange = -item.quantity;
        if (stockChange < 0) {
          const product = await db.get("SELECT current_stock, allow_negative_stock, name FROM products WHERE id = ?", item.product_id);
          if (product && !product.allow_negative_stock && product.current_stock < Math.abs(stockChange)) {
            await db.run("ROLLBACK");
            throw new Error(`لا يمكن البيع بالسالب للصنف: ${product.name}`);
          }
        }
        await db.run(`
          INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, invoiceId, item.product_id, item.quantity, item.unit_price, item.discount || 0, item.total);
        await db.run(`UPDATE products SET current_stock = current_stock + ? WHERE id = ?`, stockChange, item.product_id);
        if (type2 === "purchase") {
          await db.run("UPDATE products SET purchase_price = ? WHERE id = ?", item.unit_price, item.product_id);
        }
      }
      if (party_id) {
        let balanceChange = remaining_amount;
        if (type2 === "sale_return" || type2 === "purchase_return") {
          balanceChange = -remaining_amount;
        }
        const balanceField = (currency || "IQD") === "USD" ? "current_balance_usd" : "current_balance_iqd";
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);
        const party = await db.get("SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?", party_id);
        let debit = 0;
        let credit = 0;
        if (type2 === "sale") debit = total;
        else if (type2 === "purchase") credit = total;
        else if (type2 === "sale_return") credit = total;
        else if (type2 === "purchase_return") debit = total;
        await db.run(`
          INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, party_id, "invoice", invoiceId, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || "IQD", `فاتورة ${type2 === "sale" ? "مبيعات" : type2 === "purchase" ? "مشتريات" : "مردودات"} رقم ${finalInvoiceNumber}`, date);
      }
      if (paid_amount > 0) {
        const treasuryType = type2 === "sale" || type2 === "purchase_return" ? "income" : "expense";
        const category = type2 === "sale" ? "customer_payment" : "supplier_payment";
        const tr = await db.run(`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, treasuryType, category, paid_amount, currency || "IQD", party_id, invoiceId, `دفعة على فاتورة رقم ${finalInvoiceNumber}`, date, created_by);
        if (party_id) {
          const party = await db.get("SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?", party_id);
          let debit = 0;
          let credit = 0;
          if (type2 === "sale" || type2 === "purchase_return") credit = paid_amount;
          else if (type2 === "purchase" || type2 === "sale_return") debit = paid_amount;
          await db.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, party_id, "payment", tr.lastID, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || "IQD", `دفعة على فاتورة رقم ${finalInvoiceNumber}`, date);
        }
      }
      for (const item of items) {
        if (type2 === "sale") {
          const product = await db.get("SELECT current_stock, name FROM products WHERE id = ?", item.product_id);
          if (product) {
            if (product.current_stock <= 5) {
              warnings.push(`تنبيه: لقد وصل الصنف "${product.name}" إلى الحد الأدنى للمخزون (المتبقي: ${product.current_stock})`);
            } else if (product.current_stock === 6) {
              warnings.push(`تنبيه: لقد اقترب الصنف "${product.name}" من الحد الأدنى للمخزون (المتبقي: ${product.current_stock})`);
            }
          }
        }
      }
      await db.run("COMMIT");
      return { id: invoiceId, warnings };
    } catch (error2) {
      await db.run("ROLLBACK");
      console.error("Error creating invoice:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("invoices:update", async (_, data) => {
    const db = await getDb();
    const {
      id,
      type: type2,
      party_id,
      date,
      subtotal,
      discount_amount,
      discount_type,
      tax_rate,
      tax_amount,
      total,
      paid_amount,
      remaining_amount,
      currency,
      payment_method,
      status,
      buyer_name,
      notes,
      items,
      created_by
    } = data;
    try {
      await db.run("BEGIN TRANSACTION");
      const warnings = [];
      const oldInvoice = await db.get("SELECT * FROM invoices WHERE id = ?", id);
      if (!oldInvoice) throw new Error("Invoice not found");
      const oldItems = await db.all("SELECT * FROM invoice_items WHERE invoice_id = ?", id);
      for (const item of oldItems) {
        let stockChange = 0;
        if (oldInvoice.type === "sale") stockChange = item.quantity;
        else if (oldInvoice.type === "purchase") stockChange = -item.quantity;
        else if (oldInvoice.type === "sale_return") stockChange = -item.quantity;
        else if (oldInvoice.type === "purchase_return") stockChange = item.quantity;
        await db.run("UPDATE products SET current_stock = current_stock + ? WHERE id = ?", stockChange, item.product_id);
      }
      if (oldInvoice.remaining_amount > 0 || oldInvoice.paid_amount > 0) {
        let balanceChange = -oldInvoice.remaining_amount;
        if (oldInvoice.type === "sale_return" || oldInvoice.type === "purchase_return") balanceChange = oldInvoice.remaining_amount;
        const balanceField = oldInvoice.currency === "USD" ? "current_balance_usd" : "current_balance_iqd";
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, oldInvoice.party_id);
      }
      const tTx = await db.all("SELECT id FROM treasury_transactions WHERE invoice_id = ?", id);
      for (const t2 of tTx) {
        await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', t2.id);
      }
      await db.run("DELETE FROM treasury_transactions WHERE invoice_id = ?", id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "invoice"', id);
      await db.run("DELETE FROM invoice_items WHERE invoice_id = ?", id);
      await db.run(
        `
        UPDATE invoices SET
          type = ?, party_id = ?, date = ?, subtotal = ?, discount_amount = ?, 
          discount_type = ?, tax_rate = ?, tax_amount = ?, total = ?, paid_amount = ?, 
          remaining_amount = ?, currency = ?, payment_method = ?, status = ?, buyer_name = ?, notes = ?
        WHERE id = ?
      `,
        type2,
        party_id,
        date,
        subtotal,
        discount_amount,
        discount_type,
        tax_rate,
        tax_amount,
        total,
        paid_amount,
        remaining_amount,
        currency || "IQD",
        payment_method,
        status || "confirmed",
        buyer_name,
        notes,
        id
      );
      for (const item of items) {
        let stockChange = 0;
        if (type2 === "sale") stockChange = -item.quantity;
        else if (type2 === "purchase") stockChange = item.quantity;
        else if (type2 === "sale_return") stockChange = item.quantity;
        else if (type2 === "purchase_return") stockChange = -item.quantity;
        if (stockChange < 0) {
          const product = await db.get("SELECT current_stock, allow_negative_stock, name FROM products WHERE id = ?", item.product_id);
          if (product && !product.allow_negative_stock && product.current_stock < Math.abs(stockChange)) {
            await db.run("ROLLBACK");
            throw new Error(`لا يمكن البيع بالسالب للصنف: ${product.name}`);
          }
        }
        await db.run(`
          INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, id, item.product_id, item.quantity, item.unit_price, item.discount || 0, item.total);
        await db.run("UPDATE products SET current_stock = current_stock + ? WHERE id = ?", stockChange, item.product_id);
        if (type2 === "purchase") {
          await db.run("UPDATE products SET purchase_price = ? WHERE id = ?", item.unit_price, item.product_id);
        }
      }
      if (party_id && remaining_amount > 0) {
        let balanceChange = remaining_amount;
        if (type2 === "sale_return" || type2 === "purchase_return") balanceChange = -remaining_amount;
        const balanceField = currency === "USD" ? "current_balance_usd" : "current_balance_iqd";
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);
        const party = await db.get("SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?", party_id);
        let debit = 0;
        let credit = 0;
        if (type2 === "sale" || type2 === "purchase_return") debit = remaining_amount;
        else if (type2 === "purchase" || type2 === "sale_return") credit = remaining_amount;
        await db.run(`
          INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, party_id, "invoice", id, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || "IQD", `فاتورة معدلة ${oldInvoice.invoice_number}`, date);
      }
      if (paid_amount > 0) {
        let treasuryType = "income";
        let category = "مبيعات";
        if (type2 === "purchase") {
          treasuryType = "expense";
          category = "مشتريات";
        } else if (type2 === "sale_return") {
          treasuryType = "expense";
          category = "مردودات مبيعات";
        } else if (type2 === "purchase_return") {
          treasuryType = "income";
          category = "مردودات مشتريات";
        }
        const tr = await db.run(`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, treasuryType, category, paid_amount, currency || "IQD", party_id, id, `دفعة على فاتورة رقم ${oldInvoice.invoice_number}`, date, created_by);
        if (party_id) {
          const party = await db.get("SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?", party_id);
          let debit = 0;
          let credit = 0;
          if (type2 === "sale" || type2 === "purchase_return") credit = paid_amount;
          else if (type2 === "purchase" || type2 === "sale_return") debit = paid_amount;
          await db.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, party_id, "payment", tr.lastID, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || "IQD", `دفعة معدلة على فاتورة رقم ${oldInvoice.invoice_number}`, date);
        }
      }
      for (const item of items) {
        if (type2 === "sale") {
          const product = await db.get("SELECT current_stock, name FROM products WHERE id = ?", item.product_id);
          if (product) {
            if (product.current_stock <= 5) {
              warnings.push(`تنبيه: لقد وصل الصنف "${product.name}" إلى الحد الأدنى للمخزون (المتبقي: ${product.current_stock})`);
            } else if (product.current_stock === 6) {
              warnings.push(`تنبيه: لقد اقترب الصنف "${product.name}" من الحد الأدنى للمخزون (المتبقي: ${product.current_stock})`);
            }
          }
        }
      }
      await db.run("COMMIT");
      return { id, warnings };
    } catch (error2) {
      await db.run("ROLLBACK");
      console.error("Error updating invoice:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("invoices:delete", async (_, id) => {
    const db = await getDb();
    try {
      await db.run("BEGIN TRANSACTION");
      const invoice = await db.get("SELECT * FROM invoices WHERE id = ?", id);
      if (!invoice) throw new Error("Invoice not found");
      const items = await db.all("SELECT * FROM invoice_items WHERE invoice_id = ?", id);
      for (const item of items) {
        let stockChange = 0;
        if (invoice.type === "sale") stockChange = item.quantity;
        else if (invoice.type === "purchase") stockChange = -item.quantity;
        else if (invoice.type === "sale_return") stockChange = -item.quantity;
        else if (invoice.type === "purchase_return") stockChange = item.quantity;
        await db.run("UPDATE products SET current_stock = current_stock + ? WHERE id = ?", stockChange, item.product_id);
      }
      if (invoice.remaining_amount > 0 || invoice.paid_amount > 0) {
        let balanceChange = -invoice.remaining_amount;
        if (invoice.type === "sale_return" || invoice.type === "purchase_return") {
          balanceChange = invoice.remaining_amount;
        }
        const balanceField = invoice.currency === "USD" ? "current_balance_usd" : "current_balance_iqd";
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, invoice.party_id);
      }
      const tTx = await db.all("SELECT id FROM treasury_transactions WHERE invoice_id = ?", id);
      for (const t2 of tTx) {
        await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', t2.id);
      }
      await db.run("DELETE FROM treasury_transactions WHERE invoice_id = ?", id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "invoice"', id);
      await db.run("DELETE FROM invoice_items WHERE invoice_id = ?", id);
      await db.run("DELETE FROM invoices WHERE id = ?", id);
      await db.run("COMMIT");
      return { success: true };
    } catch (error2) {
      await db.run("ROLLBACK");
      console.error("Error deleting invoice:", error2);
      throw error2;
    }
  });
}
function initTreasuryIpc() {
  require$$1.ipcMain.handle("treasury:getTransactions", async (_, filters) => {
    const db = await getDb();
    let query = `
      SELECT t.*, p.name as party_name 
      FROM treasury_transactions t
      LEFT JOIN parties p ON t.party_id = p.id
      WHERE 1=1
    `;
    const params = [];
    if (filters == null ? void 0 : filters.search) {
      query += ` AND (t.category LIKE ? OR t.description LIKE ? OR p.name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters == null ? void 0 : filters.type) {
      query += ` AND t.type = ?`;
      params.push(filters.type);
    }
    if (filters == null ? void 0 : filters.startDate) {
      query += ` AND t.date >= ?`;
      params.push(filters.startDate);
    }
    if (filters == null ? void 0 : filters.endDate) {
      query += ` AND t.date <= ?`;
      params.push(filters.endDate);
    }
    query += ` ORDER BY t.date DESC, t.created_at DESC`;
    return db.all(query, ...params);
  });
  require$$1.ipcMain.handle("treasury:getBalance", async () => {
    const db = await getDb();
    const incomeIqd = await db.get("SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'income' AND currency = 'IQD'");
    const expenseIqd = await db.get("SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'expense' AND currency = 'IQD'");
    const incomeUsd = await db.get("SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'income' AND currency = 'USD'");
    const expenseUsd = await db.get("SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'expense' AND currency = 'USD'");
    return {
      IQD: ((incomeIqd == null ? void 0 : incomeIqd.total) || 0) - ((expenseIqd == null ? void 0 : expenseIqd.total) || 0),
      USD: ((incomeUsd == null ? void 0 : incomeUsd.total) || 0) - ((expenseUsd == null ? void 0 : expenseUsd.total) || 0)
    };
  });
  require$$1.ipcMain.handle("treasury:createTransaction", async (_, data) => {
    const db = await getDb();
    const { type: type2, category, amount, currency, party_id, description, date, created_by } = data;
    const result = await db.run(`
      INSERT INTO treasury_transactions (type, category, amount, currency, party_id, description, date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, type2, category, amount, currency || "IQD", party_id, description, date, created_by);
    if (party_id) {
      let balanceChange = -amount;
      const balanceField = currency === "USD" ? "current_balance_usd" : "current_balance_iqd";
      await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);
      const party = await db.get("SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?", party_id);
      let debit = 0;
      let credit = 0;
      if (type2 === "income") credit = amount;
      if (type2 === "expense") debit = amount;
      await db.run(`
        INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, party_id, "payment", result.lastID, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || "IQD", description || (type2 === "income" ? "سند قبض" : "سند صرف"), date);
    }
    return { id: result.lastID };
  });
  require$$1.ipcMain.handle("treasury:updateTransaction", async (_, id, data) => {
    const db = await getDb();
    const oldTx = await db.get("SELECT * FROM treasury_transactions WHERE id = ?", id);
    if (!oldTx) throw new Error("Transaction not found");
    if (oldTx.party_id) {
      const oldBalanceField = oldTx.currency === "USD" ? "current_balance_usd" : "current_balance_iqd";
      await db.run(`UPDATE parties SET ${oldBalanceField} = ${oldBalanceField} + ? WHERE id = ?`, oldTx.amount, oldTx.party_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', id);
    }
    const { type: type2, category, amount, currency, party_id, description, date } = data;
    await db.run(`
      UPDATE treasury_transactions 
      SET type=?, category=?, amount=?, currency=?, party_id=?, description=?, date=?
      WHERE id=?
    `, type2, category, amount, currency || "IQD", party_id, description, date, id);
    if (party_id) {
      const newBalanceField = currency === "USD" ? "current_balance_usd" : "current_balance_iqd";
      await db.run(`UPDATE parties SET ${newBalanceField} = ${newBalanceField} - ? WHERE id = ?`, amount, party_id);
      const party = await db.get("SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?", party_id);
      let debit = 0;
      let credit = 0;
      if (type2 === "income") credit = amount;
      if (type2 === "expense") debit = amount;
      await db.run(`
        INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, party_id, "payment", id, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || "IQD", description || (type2 === "income" ? "سند قبض" : "سند صرف"), date);
    }
    return { success: true };
  });
  require$$1.ipcMain.handle("treasury:deleteTransaction", async (_, id) => {
    const db = await getDb();
    const oldTx = await db.get("SELECT * FROM treasury_transactions WHERE id = ?", id);
    if (!oldTx) throw new Error("Transaction not found");
    if (oldTx.party_id) {
      const oldBalanceField = oldTx.currency === "USD" ? "current_balance_usd" : "current_balance_iqd";
      await db.run(`UPDATE parties SET ${oldBalanceField} = ${oldBalanceField} + ? WHERE id = ?`, oldTx.amount, oldTx.party_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', id);
    }
    await db.run("DELETE FROM treasury_transactions WHERE id = ?", id);
    return { success: true };
  });
}
var randomFallback = null;
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return require$$0.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
function setRandomFallback(random) {
  randomFallback = random;
}
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function hashSync(password, salt) {
  if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof salt === "number") salt = genSaltSync(salt);
  if (typeof password !== "string" || typeof salt !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
  return _hash(password, salt);
}
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback);
      });
    else if (typeof password === "string" && typeof salt === "string")
      _hash(password, salt, callback2, progressCallback);
    else
      nextTick(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password + ", " + typeof salt)
        )
      );
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function safeStringCompare(known, unknown) {
  var diff2 = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff2 |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff2 === 0;
}
function compareSync(password, hash2) {
  if (typeof password !== "string" || typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof hash2);
  if (hash2.length !== 60) return false;
  return safeStringCompare(
    hashSync(password, hash2.substring(0, hash2.length - 31)),
    hash2
  );
}
function compare$c(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== "string" || typeof hashValue !== "string") {
      nextTick(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick(callback2.bind(this, null, false));
      return;
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function getRounds(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  return parseInt(hash2.split("$")[2], 10);
}
function getSalt(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  if (hash2.length !== 60)
    throw Error("Illegal hash length: " + hash2.length + " != 60");
  return hash2.substring(0, 29);
}
function truncates(password) {
  if (typeof password !== "string")
    throw Error("Illegal arguments: " + typeof password);
  return utf8Length(password) > 72;
}
var nextTick = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return buffer;
}
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  -1,
  -1,
  -1,
  -1,
  -1
];
function base64_encode(b, len) {
  var off = 0, rs = [], c1, c2;
  if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
  while (off < len) {
    c1 = b[off++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
function base64_decode(s, len) {
  var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off < slen - 1 && olen < len) {
    code = s.charCodeAt(off++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o = c1 << 2 >>> 0;
    o |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o = (c2 & 15) << 4 >>> 0;
    o |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o = (c3 & 3) << 6 >>> 0;
    o |= c4;
    rs.push(String.fromCharCode(o));
    ++olen;
  }
  var res = [];
  for (off = 0; off < olen; off++) res.push(rs[off].charCodeAt(0));
  return res;
}
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
var S_ORIG = [
  3509652390,
  2564797868,
  805139163,
  3491422135,
  3101798381,
  1780907670,
  3128725573,
  4046225305,
  614570311,
  3012652279,
  134345442,
  2240740374,
  1667834072,
  1901547113,
  2757295779,
  4103290238,
  227898511,
  1921955416,
  1904987480,
  2182433518,
  2069144605,
  3260701109,
  2620446009,
  720527379,
  3318853667,
  677414384,
  3393288472,
  3101374703,
  2390351024,
  1614419982,
  1822297739,
  2954791486,
  3608508353,
  3174124327,
  2024746970,
  1432378464,
  3864339955,
  2857741204,
  1464375394,
  1676153920,
  1439316330,
  715854006,
  3033291828,
  289532110,
  2706671279,
  2087905683,
  3018724369,
  1668267050,
  732546397,
  1947742710,
  3462151702,
  2609353502,
  2950085171,
  1814351708,
  2050118529,
  680887927,
  999245976,
  1800124847,
  3300911131,
  1713906067,
  1641548236,
  4213287313,
  1216130144,
  1575780402,
  4018429277,
  3917837745,
  3693486850,
  3949271944,
  596196993,
  3549867205,
  258830323,
  2213823033,
  772490370,
  2760122372,
  1774776394,
  2652871518,
  566650946,
  4142492826,
  1728879713,
  2882767088,
  1783734482,
  3629395816,
  2517608232,
  2874225571,
  1861159788,
  326777828,
  3124490320,
  2130389656,
  2716951837,
  967770486,
  1724537150,
  2185432712,
  2364442137,
  1164943284,
  2105845187,
  998989502,
  3765401048,
  2244026483,
  1075463327,
  1455516326,
  1322494562,
  910128902,
  469688178,
  1117454909,
  936433444,
  3490320968,
  3675253459,
  1240580251,
  122909385,
  2157517691,
  634681816,
  4142456567,
  3825094682,
  3061402683,
  2540495037,
  79693498,
  3249098678,
  1084186820,
  1583128258,
  426386531,
  1761308591,
  1047286709,
  322548459,
  995290223,
  1845252383,
  2603652396,
  3431023940,
  2942221577,
  3202600964,
  3727903485,
  1712269319,
  422464435,
  3234572375,
  1170764815,
  3523960633,
  3117677531,
  1434042557,
  442511882,
  3600875718,
  1076654713,
  1738483198,
  4213154764,
  2393238008,
  3677496056,
  1014306527,
  4251020053,
  793779912,
  2902807211,
  842905082,
  4246964064,
  1395751752,
  1040244610,
  2656851899,
  3396308128,
  445077038,
  3742853595,
  3577915638,
  679411651,
  2892444358,
  2354009459,
  1767581616,
  3150600392,
  3791627101,
  3102740896,
  284835224,
  4246832056,
  1258075500,
  768725851,
  2589189241,
  3069724005,
  3532540348,
  1274779536,
  3789419226,
  2764799539,
  1660621633,
  3471099624,
  4011903706,
  913787905,
  3497959166,
  737222580,
  2514213453,
  2928710040,
  3937242737,
  1804850592,
  3499020752,
  2949064160,
  2386320175,
  2390070455,
  2415321851,
  4061277028,
  2290661394,
  2416832540,
  1336762016,
  1754252060,
  3520065937,
  3014181293,
  791618072,
  3188594551,
  3933548030,
  2332172193,
  3852520463,
  3043980520,
  413987798,
  3465142937,
  3030929376,
  4245938359,
  2093235073,
  3534596313,
  375366246,
  2157278981,
  2479649556,
  555357303,
  3870105701,
  2008414854,
  3344188149,
  4221384143,
  3956125452,
  2067696032,
  3594591187,
  2921233993,
  2428461,
  544322398,
  577241275,
  1471733935,
  610547355,
  4027169054,
  1432588573,
  1507829418,
  2025931657,
  3646575487,
  545086370,
  48609733,
  2200306550,
  1653985193,
  298326376,
  1316178497,
  3007786442,
  2064951626,
  458293330,
  2589141269,
  3591329599,
  3164325604,
  727753846,
  2179363840,
  146436021,
  1461446943,
  4069977195,
  705550613,
  3059967265,
  3887724982,
  4281599278,
  3313849956,
  1404054877,
  2845806497,
  146425753,
  1854211946,
  1266315497,
  3048417604,
  3681880366,
  3289982499,
  290971e4,
  1235738493,
  2632868024,
  2414719590,
  3970600049,
  1771706367,
  1449415276,
  3266420449,
  422970021,
  1963543593,
  2690192192,
  3826793022,
  1062508698,
  1531092325,
  1804592342,
  2583117782,
  2714934279,
  4024971509,
  1294809318,
  4028980673,
  1289560198,
  2221992742,
  1669523910,
  35572830,
  157838143,
  1052438473,
  1016535060,
  1802137761,
  1753167236,
  1386275462,
  3080475397,
  2857371447,
  1040679964,
  2145300060,
  2390574316,
  1461121720,
  2956646967,
  4031777805,
  4028374788,
  33600511,
  2920084762,
  1018524850,
  629373528,
  3691585981,
  3515945977,
  2091462646,
  2486323059,
  586499841,
  988145025,
  935516892,
  3367335476,
  2599673255,
  2839830854,
  265290510,
  3972581182,
  2759138881,
  3795373465,
  1005194799,
  847297441,
  406762289,
  1314163512,
  1332590856,
  1866599683,
  4127851711,
  750260880,
  613907577,
  1450815602,
  3165620655,
  3734664991,
  3650291728,
  3012275730,
  3704569646,
  1427272223,
  778793252,
  1343938022,
  2676280711,
  2052605720,
  1946737175,
  3164576444,
  3914038668,
  3967478842,
  3682934266,
  1661551462,
  3294938066,
  4011595847,
  840292616,
  3712170807,
  616741398,
  312560963,
  711312465,
  1351876610,
  322626781,
  1910503582,
  271666773,
  2175563734,
  1594956187,
  70604529,
  3617834859,
  1007753275,
  1495573769,
  4069517037,
  2549218298,
  2663038764,
  504708206,
  2263041392,
  3941167025,
  2249088522,
  1514023603,
  1998579484,
  1312622330,
  694541497,
  2582060303,
  2151582166,
  1382467621,
  776784248,
  2618340202,
  3323268794,
  2497899128,
  2784771155,
  503983604,
  4076293799,
  907881277,
  423175695,
  432175456,
  1378068232,
  4145222326,
  3954048622,
  3938656102,
  3820766613,
  2793130115,
  2977904593,
  26017576,
  3274890735,
  3194772133,
  1700274565,
  1756076034,
  4006520079,
  3677328699,
  720338349,
  1533947780,
  354530856,
  688349552,
  3973924725,
  1637815568,
  332179504,
  3949051286,
  53804574,
  2852348879,
  3044236432,
  1282449977,
  3583942155,
  3416972820,
  4006381244,
  1617046695,
  2628476075,
  3002303598,
  1686838959,
  431878346,
  2686675385,
  1700445008,
  1080580658,
  1009431731,
  832498133,
  3223435511,
  2605976345,
  2271191193,
  2516031870,
  1648197032,
  4164389018,
  2548247927,
  300782431,
  375919233,
  238389289,
  3353747414,
  2531188641,
  2019080857,
  1475708069,
  455242339,
  2609103871,
  448939670,
  3451063019,
  1395535956,
  2413381860,
  1841049896,
  1491858159,
  885456874,
  4264095073,
  4001119347,
  1565136089,
  3898914787,
  1108368660,
  540939232,
  1173283510,
  2745871338,
  3681308437,
  4207628240,
  3343053890,
  4016749493,
  1699691293,
  1103962373,
  3625875870,
  2256883143,
  3830138730,
  1031889488,
  3479347698,
  1535977030,
  4236805024,
  3251091107,
  2132092099,
  1774941330,
  1199868427,
  1452454533,
  157007616,
  2904115357,
  342012276,
  595725824,
  1480756522,
  206960106,
  497939518,
  591360097,
  863170706,
  2375253569,
  3596610801,
  1814182875,
  2094937945,
  3421402208,
  1082520231,
  3463918190,
  2785509508,
  435703966,
  3908032597,
  1641649973,
  2842273706,
  3305899714,
  1510255612,
  2148256476,
  2655287854,
  3276092548,
  4258621189,
  236887753,
  3681803219,
  274041037,
  1734335097,
  3815195456,
  3317970021,
  1899903192,
  1026095262,
  4050517792,
  356393447,
  2410691914,
  3873677099,
  3682840055,
  3913112168,
  2491498743,
  4132185628,
  2489919796,
  1091903735,
  1979897079,
  3170134830,
  3567386728,
  3557303409,
  857797738,
  1136121015,
  1342202287,
  507115054,
  2535736646,
  337727348,
  3213592640,
  1301675037,
  2528481711,
  1895095763,
  1721773893,
  3216771564,
  62756741,
  2142006736,
  835421444,
  2531993523,
  1442658625,
  3659876326,
  2882144922,
  676362277,
  1392781812,
  170690266,
  3921047035,
  1759253602,
  3611846912,
  1745797284,
  664899054,
  1329594018,
  3901205900,
  3045908486,
  2062866102,
  2865634940,
  3543621612,
  3464012697,
  1080764994,
  553557557,
  3656615353,
  3996768171,
  991055499,
  499776247,
  1265440854,
  648242737,
  3940784050,
  980351604,
  3713745714,
  1749149687,
  3396870395,
  4211799374,
  3640570775,
  1161844396,
  3125318951,
  1431517754,
  545492359,
  4268468663,
  3499529547,
  1437099964,
  2702547544,
  3433638243,
  2581715763,
  2787789398,
  1060185593,
  1593081372,
  2418618748,
  4260947970,
  69676912,
  2159744348,
  86519011,
  2512459080,
  3838209314,
  1220612927,
  3339683548,
  133810670,
  1090789135,
  1078426020,
  1569222167,
  845107691,
  3583754449,
  4072456591,
  1091646820,
  628848692,
  1613405280,
  3757631651,
  526609435,
  236106946,
  48312990,
  2942717905,
  3402727701,
  1797494240,
  859738849,
  992217954,
  4005476642,
  2243076622,
  3870952857,
  3732016268,
  765654824,
  3490871365,
  2511836413,
  1685915746,
  3888969200,
  1414112111,
  2273134842,
  3281911079,
  4080962846,
  172450625,
  2569994100,
  980381355,
  4109958455,
  2819808352,
  2716589560,
  2568741196,
  3681446669,
  3329971472,
  1835478071,
  660984891,
  3704678404,
  4045999559,
  3422617507,
  3040415634,
  1762651403,
  1719377915,
  3470491036,
  2693910283,
  3642056355,
  3138596744,
  1364962596,
  2073328063,
  1983633131,
  926494387,
  3423689081,
  2150032023,
  4096667949,
  1749200295,
  3328846651,
  309677260,
  2016342300,
  1779581495,
  3079819751,
  111262694,
  1274766160,
  443224088,
  298511866,
  1025883608,
  3806446537,
  1145181785,
  168956806,
  3641502830,
  3584813610,
  1689216846,
  3666258015,
  3200248200,
  1692713982,
  2646376535,
  4042768518,
  1618508792,
  1610833997,
  3523052358,
  4130873264,
  2001055236,
  3610705100,
  2202168115,
  4028541809,
  2961195399,
  1006657119,
  2006996926,
  3186142756,
  1430667929,
  3210227297,
  1314452623,
  4074634658,
  4101304120,
  2273951170,
  1399257539,
  3367210612,
  3027628629,
  1190975929,
  2062231137,
  2333990788,
  2221543033,
  2438960610,
  1181637006,
  548689776,
  2362791313,
  3372408396,
  3104550113,
  3145860560,
  296247880,
  1970579870,
  3078560182,
  3769228297,
  1714227617,
  3291629107,
  3898220290,
  166772364,
  1251581989,
  493813264,
  448347421,
  195405023,
  2709975567,
  677966185,
  3703036547,
  1463355134,
  2715995803,
  1338867538,
  1343315457,
  2802222074,
  2684532164,
  233230375,
  2599980071,
  2000651841,
  3277868038,
  1638401717,
  4028070440,
  3237316320,
  6314154,
  819756386,
  300326615,
  590932579,
  1405279636,
  3267499572,
  3150704214,
  2428286686,
  3959192993,
  3461946742,
  1862657033,
  1266418056,
  963775037,
  2089974820,
  2263052895,
  1917689273,
  448879540,
  3550394620,
  3981727096,
  150775221,
  3627908307,
  1303187396,
  508620638,
  2975983352,
  2726630617,
  1817252668,
  1876281319,
  1457606340,
  908771278,
  3720792119,
  3617206836,
  2455994898,
  1729034894,
  1080033504,
  976866871,
  3556439503,
  2881648439,
  1522871579,
  1555064734,
  1336096578,
  3548522304,
  2579274686,
  3574697629,
  3205460757,
  3593280638,
  3338716283,
  3079412587,
  564236357,
  2993598910,
  1781952180,
  1464380207,
  3163844217,
  3332601554,
  1699332808,
  1393555694,
  1183702653,
  3581086237,
  1288719814,
  691649499,
  2847557200,
  2895455976,
  3193889540,
  2717570544,
  1781354906,
  1676643554,
  2592534050,
  3230253752,
  1126444790,
  2770207658,
  2633158820,
  2210423226,
  2615765581,
  2414155088,
  3127139286,
  673620729,
  2805611233,
  1269405062,
  4015350505,
  3341807571,
  4149409754,
  1057255273,
  2012875353,
  2162469141,
  2276492801,
  2601117357,
  993977747,
  3918593370,
  2654263191,
  753973209,
  36408145,
  2530585658,
  25011837,
  3520020182,
  2088578344,
  530523599,
  2918365339,
  1524020338,
  1518925132,
  3760827505,
  3759777254,
  1202760957,
  3985898139,
  3906192525,
  674977740,
  4174734889,
  2031300136,
  2019492241,
  3983892565,
  4153806404,
  3822280332,
  352677332,
  2297720250,
  60907813,
  90501309,
  3286998549,
  1016092578,
  2535922412,
  2839152426,
  457141659,
  509813237,
  4120667899,
  652014361,
  1966332200,
  2975202805,
  55981186,
  2327461051,
  676427537,
  3255491064,
  2882294119,
  3433927263,
  1307055953,
  942726286,
  933058658,
  2468411793,
  3933900994,
  4215176142,
  1361170020,
  2001714738,
  2830558078,
  3274259782,
  1222529897,
  1679025792,
  2729314320,
  3714953764,
  1770335741,
  151462246,
  3013232138,
  1682292957,
  1483529935,
  471910574,
  1539241949,
  458788160,
  3436315007,
  1807016891,
  3718408830,
  978976581,
  1043663428,
  3165965781,
  1927990952,
  4200891579,
  2372276910,
  3208408903,
  3533431907,
  1412390302,
  2931980059,
  4132332400,
  1947078029,
  3881505623,
  4168226417,
  2941484381,
  1077988104,
  1320477388,
  886195818,
  18198404,
  3786409e3,
  2509781533,
  112762804,
  3463356488,
  1866414978,
  891333506,
  18488651,
  661792760,
  1628790961,
  3885187036,
  3141171499,
  876946877,
  2693282273,
  1372485963,
  791857591,
  2686433993,
  3759982718,
  3167212022,
  3472953795,
  2716379847,
  445679433,
  3561995674,
  3504004811,
  3574258232,
  54117162,
  3331405415,
  2381918588,
  3769707343,
  4154350007,
  1140177722,
  4074052095,
  668550556,
  3214352940,
  367459370,
  261225585,
  2610173221,
  4209349473,
  3468074219,
  3265815641,
  314222801,
  3066103646,
  3808782860,
  282218597,
  3406013506,
  3773591054,
  379116347,
  1285071038,
  846784868,
  2669647154,
  3771962079,
  3550491691,
  2305946142,
  453669953,
  1268987020,
  3317592352,
  3279303384,
  3744833421,
  2610507566,
  3859509063,
  266596637,
  3847019092,
  517658769,
  3462560207,
  3443424879,
  370717030,
  4247526661,
  2224018117,
  4143653529,
  4112773975,
  2788324899,
  2477274417,
  1456262402,
  2901442914,
  1517677493,
  1846949527,
  2295493580,
  3734397586,
  2176403920,
  1280348187,
  1908823572,
  3871786941,
  846861322,
  1172426758,
  3287448474,
  3383383037,
  1655181056,
  3139813346,
  901632758,
  1897031941,
  2986607138,
  3066810236,
  3447102507,
  1393639104,
  373351379,
  950779232,
  625454576,
  3124240540,
  4148612726,
  2007998917,
  544563296,
  2244738638,
  2330496472,
  2058025392,
  1291430526,
  424198748,
  50039436,
  29584100,
  3605783033,
  2429876329,
  2791104160,
  1057563949,
  3255363231,
  3075367218,
  3463963227,
  1469046755,
  985887462
];
var C_ORIG = [
  1332899944,
  1700884034,
  1701343084,
  1684370003,
  1668446532,
  1869963892
];
function _encipher(lr, off, P, S) {
  var n, l = lr[off], r = lr[off + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[1];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[3];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[5];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[7];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[9];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[11];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[13];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[15];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[16];
  lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off + 1] = l;
  return lr;
}
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _crypt(b, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick(next);
  }
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
function _hash(password, salt, callback, progressCallback) {
  var err;
  if (typeof password !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor2, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor2 = String.fromCharCode(0), offset = 3;
  else {
    minor2 = salt.charAt(2);
    if (minor2 !== "a" && minor2 !== "b" && minor2 !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password += minor2 >= "a" ? "\0" : "";
  var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor2 >= "a") res.push(minor2);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
function encodeBase64(bytes, length) {
  return base64_encode(bytes, length);
}
function decodeBase64(string, length) {
  return base64_decode(string, length);
}
const bcrypt = {
  setRandomFallback,
  genSaltSync,
  genSalt,
  hashSync,
  hash,
  compareSync,
  compare: compare$c,
  getRounds,
  getSalt,
  truncates,
  encodeBase64,
  decodeBase64
};
function initUsersIpc() {
  require$$1.ipcMain.handle("users:login", async (_, { username, password }) => {
    const db = await getDb();
    const user = await db.get(
      "SELECT id, name, username, password_hash, role, is_active, profile_image FROM users WHERE username = ?",
      [username]
    );
    if (!user) {
      throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
    const isBcrypt = user.password_hash && user.password_hash.startsWith("$2");
    let isValid = false;
    if (isBcrypt) {
      isValid = await bcrypt.compare(password, user.password_hash);
    } else {
      isValid = password === user.password_hash;
      if (isValid) {
        const newHash = await bcrypt.hash(password, 10);
        await db.run("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, user.id]);
      }
    }
    if (!isValid) {
      throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
    if (!user.is_active) {
      throw new Error("هذا الحساب غير نشط");
    }
    const { password_hash, profile_image, ...safeUser } = user;
    return { ...safeUser, profileImage: profile_image };
  });
  require$$1.ipcMain.handle("users:getAll", async () => {
    const db = await getDb();
    return await db.all("SELECT id, name, username, role, is_active, created_at, profile_image FROM users");
  });
  require$$1.ipcMain.handle("users:create", async (_, data) => {
    const db = await getDb();
    const existing = await db.get("SELECT id FROM users WHERE username = ?", [data.username]);
    if (existing) {
      throw new Error("اسم المستخدم موجود مسبقاً");
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const result = await db.run(
      `INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)`,
      [data.full_name || data.name, data.username, hashedPassword, data.role || "user"]
    );
    return result.lastID;
  });
  require$$1.ipcMain.handle("users:updateStatus", async (_, id, isActive) => {
    const db = await getDb();
    await db.run("UPDATE users SET is_active = ? WHERE id = ?", [isActive ? 1 : 0, id]);
    return true;
  });
  require$$1.ipcMain.handle("users:delete", async (_, id) => {
    const db = await getDb();
    await db.run("DELETE FROM users WHERE id = ?", [id]);
    return true;
  });
  require$$1.ipcMain.handle("users:update", async (_, data) => {
    const db = await getDb();
    const existing = await db.get("SELECT id FROM users WHERE username = ? AND id != ?", [data.username, data.id]);
    if (existing) {
      throw new Error("اسم المستخدم موجود مسبقاً لمستخدم آخر");
    }
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await db.run(
        `UPDATE users SET name = ?, username = ?, password_hash = ?, role = ?, profile_image = ? WHERE id = ?`,
        [data.full_name || data.name, data.username, hashedPassword, data.role || "user", data.profile_image || data.profileImage, data.id]
      );
    } else {
      await db.run(
        `UPDATE users SET name = ?, username = ?, role = ?, profile_image = ? WHERE id = ?`,
        [data.full_name || data.name, data.username, data.role || "user", data.profile_image || data.profileImage, data.id]
      );
    }
    return true;
  });
}
function initDashboardIpc() {
  require$$1.ipcMain.handle("dashboard:getStats", async () => {
    const db = await getDb();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const monthStart = today.substring(0, 8) + "01";
    const salesIQD = await db.get(`SELECT SUM(total) as total FROM invoices WHERE type = 'sale' AND currency = 'IQD' AND date >= ?`, [monthStart]);
    const salesUSD = await db.get(`SELECT SUM(total) as total FROM invoices WHERE type = 'sale' AND currency = 'USD' AND date >= ?`, [monthStart]);
    const purchasesIQD = await db.get(`SELECT SUM(total) as total FROM invoices WHERE type = 'purchase' AND currency = 'IQD' AND date >= ?`, [monthStart]);
    const purchasesUSD = await db.get(`SELECT SUM(total) as total FROM invoices WHERE type = 'purchase' AND currency = 'USD' AND date >= ?`, [monthStart]);
    const treasuryIncomeIQD = await db.get(`SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'income' AND currency = 'IQD'`);
    const treasuryExpenseIQD = await db.get(`SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'expense' AND currency = 'IQD'`);
    const treasuryIncomeUSD = await db.get(`SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'income' AND currency = 'USD'`);
    const treasuryExpenseUSD = await db.get(`SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'expense' AND currency = 'USD'`);
    const customerDebtIQD = await db.get(`SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'customer' AND current_balance_iqd > 0`);
    const customerDebtUSD = await db.get(`SELECT SUM(current_balance_usd) as total FROM parties WHERE type = 'customer' AND current_balance_usd > 0`);
    return {
      totalSalesIQD: (salesIQD == null ? void 0 : salesIQD.total) || 0,
      totalSalesUSD: (salesUSD == null ? void 0 : salesUSD.total) || 0,
      totalPurchasesIQD: (purchasesIQD == null ? void 0 : purchasesIQD.total) || 0,
      totalPurchasesUSD: (purchasesUSD == null ? void 0 : purchasesUSD.total) || 0,
      treasuryBalanceIQD: ((treasuryIncomeIQD == null ? void 0 : treasuryIncomeIQD.total) || 0) - ((treasuryExpenseIQD == null ? void 0 : treasuryExpenseIQD.total) || 0),
      treasuryBalanceUSD: ((treasuryIncomeUSD == null ? void 0 : treasuryIncomeUSD.total) || 0) - ((treasuryExpenseUSD == null ? void 0 : treasuryExpenseUSD.total) || 0),
      customerDebtIQD: (customerDebtIQD == null ? void 0 : customerDebtIQD.total) || 0,
      customerDebtUSD: (customerDebtUSD == null ? void 0 : customerDebtUSD.total) || 0
    };
  });
  require$$1.ipcMain.handle("dashboard:getCharts", async () => {
    const db = await getDb();
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 7);
    const dateLimit = thirtyDaysAgo.toISOString().split("T")[0];
    const chartDataRaw = await db.all(`
      SELECT date, type, SUM(total) as total 
      FROM invoices 
      WHERE date >= ? AND status = 'confirmed'
      GROUP BY date, type
      ORDER BY date ASC
    `, [dateLimit]);
    const chartMap = /* @__PURE__ */ new Map();
    chartDataRaw.forEach((row) => {
      const date = row.date.substring(5);
      if (!chartMap.has(date)) {
        chartMap.set(date, { name: date, sales: 0, purchases: 0 });
      }
      if (row.type === "sale") chartMap.get(date).sales += row.total;
      if (row.type === "purchase") chartMap.get(date).purchases += row.total;
    });
    const expensesRaw = await db.all(`
      SELECT category as name, SUM(amount) as value 
      FROM treasury_transactions 
      WHERE type = 'expense'
      GROUP BY category
    `);
    const latestInvoices = await db.all(`
      SELECT i.invoice_number, i.total, i.currency, i.status, p.name as party_name 
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE i.type = 'sale'
      ORDER BY i.id DESC LIMIT 5
    `);
    const lowStock = await db.all(`
      SELECT name, current_stock 
      FROM products 
      WHERE current_stock <= 5
      ORDER BY current_stock ASC LIMIT 5
    `);
    return {
      lineChart: Array.from(chartMap.values()),
      pieChart: expensesRaw.length ? expensesRaw : [{ name: "لا توجد بيانات", value: 1 }],
      latestInvoices,
      lowStock
    };
  });
}
function initReportsIpc() {
  require$$1.ipcMain.handle("reports:getIncomeStatement", async (_, { startDate, endDate }) => {
    const db = await getDb();
    const revenues = await db.all(`
      SELECT category as name, SUM(amount) as value 
      FROM treasury_transactions 
      WHERE type = 'income' AND date BETWEEN ? AND ?
      GROUP BY category
    `, [startDate, endDate]);
    const expenses = await db.all(`
      SELECT category as name, SUM(amount) as value 
      FROM treasury_transactions 
      WHERE type = 'expense' AND date BETWEEN ? AND ?
      GROUP BY category
    `, [startDate, endDate]);
    const totalRevenue = revenues.reduce((sum, item) => sum + item.value, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.value, 0);
    return {
      revenues,
      expenses,
      totalRevenue,
      totalExpense,
      netIncome: totalRevenue - totalExpense
    };
  });
  require$$1.ipcMain.handle("reports:getSales", async (_, { startDate, endDate }) => {
    const db = await getDb();
    return await db.all(`
      SELECT i.invoice_number, i.date, i.total, i.currency, i.payment_method, p.name as party_name
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE i.type = 'sale' AND i.date BETWEEN ? AND ?
      ORDER BY i.date DESC
    `, [startDate, endDate]);
  });
  require$$1.ipcMain.handle("reports:getPurchases", async (_, { startDate, endDate }) => {
    const db = await getDb();
    return await db.all(`
      SELECT i.invoice_number, i.date, i.total, i.currency, i.payment_method, p.name as party_name
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE i.type = 'purchase' AND i.date BETWEEN ? AND ?
      ORDER BY i.date DESC
    `, [startDate, endDate]);
  });
  require$$1.ipcMain.handle("reports:getPurchasePrices", async (_, { startDate, endDate, productName }) => {
    const db = await getDb();
    let query = `
      SELECT 
        p.name as product_name, 
        p.code as product_code,
        s.name as supplier_name,
        i.date,
        i.invoice_number,
        ii.unit_price as purchase_price,
        ii.quantity,
        i.currency
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN products p ON ii.product_id = p.id
      LEFT JOIN parties s ON i.party_id = s.id
      WHERE i.type = 'purchase' AND i.date >= ? AND i.date <= ?
    `;
    const params = [startDate, endDate];
    if (productName && productName.trim() !== "") {
      query += ` AND p.name LIKE ?`;
      params.push(`%${productName}%`);
    }
    query += ` ORDER BY i.date DESC`;
    return await db.all(query, ...params);
  });
  require$$1.ipcMain.handle("reports:getInventoryMovement", async (_, { startDate, endDate }) => {
    const db = await getDb();
    return await db.all(`
      SELECT 
        p.name as product_name,
        p.code as product_code,
        SUM(CASE WHEN i.type = 'purchase' OR i.type = 'sale_return' THEN ii.quantity ELSE 0 END) as inward,
        SUM(CASE WHEN i.type = 'sale' OR i.type = 'purchase_return' THEN ii.quantity ELSE 0 END) as outward,
        p.current_stock
      FROM products p
      LEFT JOIN invoice_items ii ON p.id = ii.product_id
      LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.date BETWEEN ? AND ?
      GROUP BY p.id
    `, [startDate, endDate]);
  });
  require$$1.ipcMain.handle("reports:getBalances", async (_, { type: type2 }) => {
    const db = await getDb();
    return await db.all(`
      SELECT name, phone, current_balance_iqd, current_balance_usd 
      FROM parties 
      WHERE type = ? AND (current_balance_iqd > 0 OR current_balance_usd > 0)
      ORDER BY current_balance_iqd DESC
    `, [type2]);
  });
  require$$1.ipcMain.handle("reports:getBalanceSheet", async () => {
    const db = await getDb();
    const treasury = await db.get(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as balance
      FROM treasury_transactions
    `);
    const inventory = await db.get(`
      SELECT SUM(current_stock * purchase_price) as value FROM products
    `);
    const customers = await db.get(`
      SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'customer'
    `);
    const suppliers = await db.get(`
      SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'supplier'
    `);
    return {
      assets: {
        treasury: (treasury == null ? void 0 : treasury.balance) || 0,
        inventory: (inventory == null ? void 0 : inventory.value) || 0,
        customers: (customers == null ? void 0 : customers.total) || 0,
        total: ((treasury == null ? void 0 : treasury.balance) || 0) + ((inventory == null ? void 0 : inventory.value) || 0) + ((customers == null ? void 0 : customers.total) || 0)
      },
      liabilities: {
        suppliers: (suppliers == null ? void 0 : suppliers.total) || 0,
        total: (suppliers == null ? void 0 : suppliers.total) || 0
      }
    };
  });
}
function initBasicDataIpc() {
  require$$1.ipcMain.handle("basicData:getCategories", async () => {
    const db = await getDb();
    return await db.all("SELECT * FROM product_categories ORDER BY id DESC");
  });
  require$$1.ipcMain.handle("basicData:createCategory", async (_, data) => {
    const db = await getDb();
    const result = await db.run("INSERT INTO product_categories (name, description) VALUES (?, ?)", [data.name, data.description || ""]);
    return result.lastID;
  });
  require$$1.ipcMain.handle("basicData:deleteCategory", async (_, id) => {
    const db = await getDb();
    await db.run("DELETE FROM product_categories WHERE id = ?", [id]);
    return true;
  });
  require$$1.ipcMain.handle("basicData:getUnits", async () => {
    const db = await getDb();
    return await db.all("SELECT * FROM units ORDER BY id DESC");
  });
  require$$1.ipcMain.handle("basicData:createUnit", async (_, data) => {
    const db = await getDb();
    const result = await db.run("INSERT INTO units (name) VALUES (?)", [data.name]);
    return result.lastID;
  });
  require$$1.ipcMain.handle("basicData:deleteUnit", async (_, id) => {
    const db = await getDb();
    await db.run("DELETE FROM units WHERE id = ?", [id]);
    return true;
  });
  require$$1.ipcMain.handle("basicData:getWarehouses", async () => {
    const db = await getDb();
    return await db.all("SELECT * FROM warehouses ORDER BY id DESC");
  });
  require$$1.ipcMain.handle("basicData:createWarehouse", async (_, data) => {
    const db = await getDb();
    const result = await db.run("INSERT INTO warehouses (name, location, is_active) VALUES (?, ?, 1)", [data.name, data.location || ""]);
    return result.lastID;
  });
  require$$1.ipcMain.handle("basicData:deleteWarehouse", async (_, id) => {
    const db = await getDb();
    await db.run("DELETE FROM warehouses WHERE id = ?", [id]);
    return true;
  });
  require$$1.ipcMain.handle("basicData:getTreasuryCategories", async () => {
    const db = await getDb();
    return await db.all("SELECT * FROM treasury_categories ORDER BY id DESC");
  });
  require$$1.ipcMain.handle("basicData:createTreasuryCategory", async (_, data) => {
    const db = await getDb();
    const result = await db.run("INSERT INTO treasury_categories (name, type, is_system) VALUES (?, ?, 0)", [data.name, data.type]);
    return result.lastID;
  });
  require$$1.ipcMain.handle("basicData:deleteTreasuryCategory", async (_, id) => {
    const db = await getDb();
    const cat = await db.get("SELECT is_system FROM treasury_categories WHERE id = ?", [id]);
    if (cat && cat.is_system) {
      throw new Error("لا يمكن حذف التصنيفات الأساسية للنظام");
    }
    await db.run("DELETE FROM treasury_categories WHERE id = ?", [id]);
    return true;
  });
}
function initLicenseIpc() {
  require$$1.ipcMain.handle("license:verify", async (_, serialKey) => {
    try {
      const appData = process.env.APPDATA || (process.platform == "darwin" ? process.env.HOME + "/Library/Preferences" : process.env.HOME + "/.local/share");
      const prodPath = require$$1$1.join(appData, "license-management-dashboard", "prod-license.sqlite");
      const devPath = require$$1$1.join(appData, "license-management-dashboard", "dev-license.sqlite");
      let targetDbPath = null;
      if (fs$j.existsSync(prodPath)) targetDbPath = prodPath;
      else if (fs$j.existsSync(devPath)) targetDbPath = devPath;
      if (!targetDbPath) {
        return { valid: false, error: "تعذر الاتصال بنظام إدارة التراخيص" };
      }
      const moDb = await sqlite.open({
        filename: targetDbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READONLY
      });
      try {
        const license = await moDb.get("SELECT * FROM licenses WHERE serial = ?", [serialKey]);
        if (!license) {
          return { valid: false, error: "المفتاح غير مسجل في النظام أو غير صحيح" };
        }
        if (license.status !== "فعال") {
          return { valid: false, error: "هذا الترخيص متوقف أو غير فعال" };
        }
        return {
          valid: true,
          message: "تم التحقق من الترخيص بنجاح",
          activationType: license.type,
          expiryDate: license.end_date
        };
      } finally {
        await moDb.close();
      }
    } catch (error2) {
      console.error("License verification error:", error2);
      return { valid: false, error: "حدث خطأ أثناء الاتصال بقاعدة بيانات التراخيص" };
    }
  });
}
function setupNotificationsIPC() {
  require$$1.ipcMain.handle("notifications:getAll", async () => {
    const db = await dbManager.getDb();
    return await db.all("SELECT * FROM system_notifications ORDER BY created_at DESC LIMIT 100");
  });
  require$$1.ipcMain.handle("notifications:markAsRead", async (_, id) => {
    const db = await dbManager.getDb();
    const result = await db.run("UPDATE system_notifications SET is_read = 1 WHERE id = ?", [id]);
    return { success: result.changes !== void 0 && result.changes > 0 };
  });
  require$$1.ipcMain.handle("notifications:markAllAsRead", async () => {
    const db = await dbManager.getDb();
    const result = await db.run("UPDATE system_notifications SET is_read = 1 WHERE is_read = 0");
    return { success: result.changes !== void 0 && result.changes > 0 };
  });
  require$$1.ipcMain.handle("notifications:clearAll", async () => {
    const db = await dbManager.getDb();
    const result = await db.run("DELETE FROM system_notifications");
    return { success: result.changes !== void 0 && result.changes > 0 };
  });
  require$$1.ipcMain.handle("notifications:add", async (_, { text, type: type2 }) => {
    await createSystemNotification(text, type2);
    return { success: true };
  });
  let isCheckingLowStock = false;
  require$$1.ipcMain.handle("notifications:checkLowStock", async () => {
    if (isCheckingLowStock) return { success: true };
    isCheckingLowStock = true;
    try {
      const db = await dbManager.getDb();
      const settings = await db.get("SELECT last_low_stock_alert_date FROM company_settings LIMIT 1");
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (settings && settings.last_low_stock_alert_date === today) {
        return { success: true };
      }
      const lowStock = await db.all(`
        SELECT name, current_stock 
        FROM products 
        WHERE current_stock <= 5
      `);
      if (lowStock.length > 0) {
        let text = `يوجد لديك ${lowStock.length} أصناف وصلت إلى حد النواقص (الكمية 5 أو أقل).`;
        const names = lowStock.slice(0, 3).map((p) => p.name).join("، ");
        if (names) {
          text += ` من ضمنها: ${names}${lowStock.length > 3 ? "..." : "."}`;
        }
        await createSystemNotification(text, "low_stock_summary");
        await db.run("UPDATE company_settings SET last_low_stock_alert_date = ?", today);
      }
      return { success: true };
    } catch (error2) {
      console.error(error2);
      return { success: false };
    } finally {
      isCheckingLowStock = false;
    }
  });
}
async function createSystemNotification(text, type2 = "general") {
  try {
    const db = await dbManager.getDb();
    if (type2 === "backup") {
      const exists = await db.get(`
        SELECT id FROM system_notifications 
        WHERE type = ? AND date(created_at) = date('now', 'localtime')
      `, [type2]);
      if (exists) return;
    }
    await db.run(
      "INSERT INTO system_notifications (text, type, is_read) VALUES (?, ?, 0)",
      [text, type2]
    );
  } catch (error2) {
    console.error("Error creating notification:", error2);
  }
}
function initStocktakeIpc() {
  require$$1.ipcMain.handle("stocktake:getAll", async () => {
    try {
      const db = await getDb();
      const rows = await db.all(`
        SELECT s.*, u.name as created_by_name 
        FROM inventory_stocktakes s
        LEFT JOIN users u ON s.created_by = u.id
        ORDER BY s.id DESC
      `);
      return rows;
    } catch (error2) {
      console.error("Error fetching stocktakes:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("stocktake:getById", async (_, id) => {
    try {
      const db = await getDb();
      const stocktake = await db.get(`SELECT * FROM inventory_stocktakes WHERE id = ?`, id);
      if (!stocktake) throw new Error("Stocktake not found");
      const items = await db.all(`
        SELECT i.*, p.name as product_name, p.code as product_code 
        FROM stocktake_items i
        JOIN products p ON i.product_id = p.id
        WHERE i.stocktake_id = ?
      `, id);
      return { ...stocktake, items };
    } catch (error2) {
      console.error("Error fetching stocktake by id:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("stocktake:saveDraft", async (_, data) => {
    try {
      const db = await getDb();
      const { id, notes, created_by, items } = data;
      let stocktakeId = id;
      await db.run("BEGIN TRANSACTION");
      try {
        if (stocktakeId) {
          await db.run(`UPDATE inventory_stocktakes SET notes = ? WHERE id = ?`, notes, stocktakeId);
          await db.run(`DELETE FROM stocktake_items WHERE stocktake_id = ?`, stocktakeId);
        } else {
          const result = await db.get(`SELECT COUNT(*) as count FROM inventory_stocktakes`);
          const count = result.count + 1;
          const stocktake_number = `STK-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(count).padStart(4, "0")}`;
          const insertResult = await db.run(`
            INSERT INTO inventory_stocktakes (stocktake_number, date, status, notes, created_by) 
            VALUES (?, CURRENT_DATE, 'draft', ?, ?)
          `, stocktake_number, notes, created_by);
          stocktakeId = insertResult.lastID;
        }
        for (const item of items) {
          await db.run(`
            INSERT INTO stocktake_items (stocktake_id, product_id, system_qty, actual_qty, difference, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `, stocktakeId, item.product_id, item.system_qty, item.actual_qty, item.difference, item.notes);
        }
        await db.run("COMMIT");
        return { success: true, id: stocktakeId };
      } catch (err) {
        await db.run("ROLLBACK");
        throw err;
      }
    } catch (error2) {
      console.error("Error saving stocktake draft:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("stocktake:apply", async (_, id) => {
    try {
      const db = await getDb();
      await db.run("BEGIN TRANSACTION");
      try {
        const items = await db.all(`SELECT * FROM stocktake_items WHERE stocktake_id = ?`, id);
        for (const item of items) {
          await db.run(`UPDATE products SET current_stock = ? WHERE id = ?`, item.actual_qty, item.product_id);
        }
        await db.run(`UPDATE inventory_stocktakes SET status = 'applied' WHERE id = ?`, id);
        await db.run("COMMIT");
        return { success: true };
      } catch (err) {
        await db.run("ROLLBACK");
        throw err;
      }
    } catch (error2) {
      console.error("Error applying stocktake:", error2);
      throw error2;
    }
  });
  require$$1.ipcMain.handle("stocktake:delete", async (_, id) => {
    try {
      const db = await getDb();
      await db.run(`DELETE FROM inventory_stocktakes WHERE id = ? AND status = 'draft'`, id);
      return { success: true };
    } catch (error2) {
      console.error("Error deleting stocktake:", error2);
      throw error2;
    }
  });
}
function initAutoBackup() {
  checkAndPerformBackup();
  setInterval(checkAndPerformBackup, 60 * 60 * 1e3);
}
async function checkAndPerformBackup() {
  try {
    const db = await getDb();
    const settings = await db.get("SELECT auto_backup_enabled, auto_backup_frequency, auto_backup_path, last_backup_date FROM company_settings LIMIT 1");
    if (!settings || settings.auto_backup_enabled !== 1 || !settings.auto_backup_path) {
      return;
    }
    if (!fs$k.existsSync(settings.auto_backup_path)) {
      console.error("Auto backup path does not exist:", settings.auto_backup_path);
      return;
    }
    const now = /* @__PURE__ */ new Date();
    let shouldBackup = false;
    if (!settings.last_backup_date) {
      shouldBackup = true;
    } else {
      const lastBackup = new Date(settings.last_backup_date);
      const diffTime = Math.abs(now.getTime() - lastBackup.getTime());
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      if (settings.auto_backup_frequency === "daily" && diffDays >= 1) {
        shouldBackup = true;
      } else if (settings.auto_backup_frequency === "weekly" && diffDays >= 7) {
        shouldBackup = true;
      } else if (settings.auto_backup_frequency === "monthly" && diffDays >= 30) {
        shouldBackup = true;
      }
    }
    if (shouldBackup) {
      const pad = (n) => n.toString().padStart(2, "0");
      const dd = pad(now.getDate());
      const mm = pad(now.getMonth() + 1);
      const yyyy = now.getFullYear();
      const hh = pad(now.getHours());
      const min = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      const dateStr = `${dd}-${mm}-${yyyy}_${hh}-${min}-${ss}`;
      const backupFileName = `Inventory_Pro_System_${dateStr}.db`;
      const backupFilePath = path$n.join(settings.auto_backup_path, backupFileName);
      await db.run(`VACUUM INTO '${backupFilePath}'`);
      console.log(`Auto backup successful: ${backupFilePath}`);
      await db.run("UPDATE company_settings SET last_backup_date = ?", now.toISOString());
    }
  } catch (error2) {
    console.error("Error during auto backup:", error2);
  }
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var main$1 = {};
var fs$i = {};
var universalify$1 = {};
universalify$1.fromCallback = function(fn) {
  return Object.defineProperty(function(...args) {
    if (typeof args[args.length - 1] === "function") fn.apply(this, args);
    else {
      return new Promise((resolve, reject) => {
        args.push((err, res) => err != null ? reject(err) : resolve(res));
        fn.apply(this, args);
      });
    }
  }, "name", { value: fn.name });
};
universalify$1.fromPromise = function(fn) {
  return Object.defineProperty(function(...args) {
    const cb = args[args.length - 1];
    if (typeof cb !== "function") return fn.apply(this, args);
    else {
      args.pop();
      fn.apply(this, args).then((r) => cb(null, r), cb);
    }
  }, "name", { value: fn.name });
};
var constants$2 = require$$0$1;
var origCwd = process.cwd;
var cwd = null;
var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd;
};
try {
  process.cwd();
} catch (er) {
}
if (typeof process.chdir === "function") {
  var chdir = process.chdir;
  process.chdir = function(d) {
    cwd = null;
    chdir.call(process, d);
  };
  if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
}
var polyfills$1 = patch$3;
function patch$3(fs2) {
  if (constants$2.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs2);
  }
  if (!fs2.lutimes) {
    patchLutimes(fs2);
  }
  fs2.chown = chownFix(fs2.chown);
  fs2.fchown = chownFix(fs2.fchown);
  fs2.lchown = chownFix(fs2.lchown);
  fs2.chmod = chmodFix(fs2.chmod);
  fs2.fchmod = chmodFix(fs2.fchmod);
  fs2.lchmod = chmodFix(fs2.lchmod);
  fs2.chownSync = chownFixSync(fs2.chownSync);
  fs2.fchownSync = chownFixSync(fs2.fchownSync);
  fs2.lchownSync = chownFixSync(fs2.lchownSync);
  fs2.chmodSync = chmodFixSync(fs2.chmodSync);
  fs2.fchmodSync = chmodFixSync(fs2.fchmodSync);
  fs2.lchmodSync = chmodFixSync(fs2.lchmodSync);
  fs2.stat = statFix(fs2.stat);
  fs2.fstat = statFix(fs2.fstat);
  fs2.lstat = statFix(fs2.lstat);
  fs2.statSync = statFixSync(fs2.statSync);
  fs2.fstatSync = statFixSync(fs2.fstatSync);
  fs2.lstatSync = statFixSync(fs2.lstatSync);
  if (fs2.chmod && !fs2.lchmod) {
    fs2.lchmod = function(path2, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs2.lchmodSync = function() {
    };
  }
  if (fs2.chown && !fs2.lchown) {
    fs2.lchown = function(path2, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs2.lchownSync = function() {
    };
  }
  if (platform === "win32") {
    fs2.rename = typeof fs2.rename !== "function" ? fs2.rename : function(fs$rename) {
      function rename2(from, to, cb) {
        var start = Date.now();
        var backoff = 0;
        fs$rename(from, to, function CB(er) {
          if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
            setTimeout(function() {
              fs2.stat(to, function(stater, st) {
                if (stater && stater.code === "ENOENT")
                  fs$rename(from, to, CB);
                else
                  cb(er);
              });
            }, backoff);
            if (backoff < 100)
              backoff += 10;
            return;
          }
          if (cb) cb(er);
        });
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(rename2, fs$rename);
      return rename2;
    }(fs2.rename);
  }
  fs2.read = typeof fs2.read !== "function" ? fs2.read : function(fs$read) {
    function read(fd, buffer, offset, length, position, callback_) {
      var callback;
      if (callback_ && typeof callback_ === "function") {
        var eagCounter = 0;
        callback = function(er, _, __) {
          if (er && er.code === "EAGAIN" && eagCounter < 10) {
            eagCounter++;
            return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
    }
    if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
    return read;
  }(fs2.read);
  fs2.readSync = typeof fs2.readSync !== "function" ? fs2.readSync : /* @__PURE__ */ function(fs$readSync) {
    return function(fd, buffer, offset, length, position) {
      var eagCounter = 0;
      while (true) {
        try {
          return fs$readSync.call(fs2, fd, buffer, offset, length, position);
        } catch (er) {
          if (er.code === "EAGAIN" && eagCounter < 10) {
            eagCounter++;
            continue;
          }
          throw er;
        }
      }
    };
  }(fs2.readSync);
  function patchLchmod(fs22) {
    fs22.lchmod = function(path2, mode, callback) {
      fs22.open(
        path2,
        constants$2.O_WRONLY | constants$2.O_SYMLINK,
        mode,
        function(err, fd) {
          if (err) {
            if (callback) callback(err);
            return;
          }
          fs22.fchmod(fd, mode, function(err2) {
            fs22.close(fd, function(err22) {
              if (callback) callback(err2 || err22);
            });
          });
        }
      );
    };
    fs22.lchmodSync = function(path2, mode) {
      var fd = fs22.openSync(path2, constants$2.O_WRONLY | constants$2.O_SYMLINK, mode);
      var threw = true;
      var ret;
      try {
        ret = fs22.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs22.closeSync(fd);
          } catch (er) {
          }
        } else {
          fs22.closeSync(fd);
        }
      }
      return ret;
    };
  }
  function patchLutimes(fs22) {
    if (constants$2.hasOwnProperty("O_SYMLINK") && fs22.futimes) {
      fs22.lutimes = function(path2, at, mt, cb) {
        fs22.open(path2, constants$2.O_SYMLINK, function(er, fd) {
          if (er) {
            if (cb) cb(er);
            return;
          }
          fs22.futimes(fd, at, mt, function(er2) {
            fs22.close(fd, function(er22) {
              if (cb) cb(er2 || er22);
            });
          });
        });
      };
      fs22.lutimesSync = function(path2, at, mt) {
        var fd = fs22.openSync(path2, constants$2.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs22.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs22.closeSync(fd);
            } catch (er) {
            }
          } else {
            fs22.closeSync(fd);
          }
        }
        return ret;
      };
    } else if (fs22.futimes) {
      fs22.lutimes = function(_a, _b, _c, cb) {
        if (cb) process.nextTick(cb);
      };
      fs22.lutimesSync = function() {
      };
    }
  }
  function chmodFix(orig) {
    if (!orig) return orig;
    return function(target, mode, cb) {
      return orig.call(fs2, target, mode, function(er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }
  function chmodFixSync(orig) {
    if (!orig) return orig;
    return function(target, mode) {
      try {
        return orig.call(fs2, target, mode);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }
  function chownFix(orig) {
    if (!orig) return orig;
    return function(target, uid, gid, cb) {
      return orig.call(fs2, target, uid, gid, function(er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }
  function chownFixSync(orig) {
    if (!orig) return orig;
    return function(target, uid, gid) {
      try {
        return orig.call(fs2, target, uid, gid);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }
  function statFix(orig) {
    if (!orig) return orig;
    return function(target, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = null;
      }
      function callback(er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 4294967296;
          if (stats.gid < 0) stats.gid += 4294967296;
        }
        if (cb) cb.apply(this, arguments);
      }
      return options ? orig.call(fs2, target, options, callback) : orig.call(fs2, target, callback);
    };
  }
  function statFixSync(orig) {
    if (!orig) return orig;
    return function(target, options) {
      var stats = options ? orig.call(fs2, target, options) : orig.call(fs2, target);
      if (stats) {
        if (stats.uid < 0) stats.uid += 4294967296;
        if (stats.gid < 0) stats.gid += 4294967296;
      }
      return stats;
    };
  }
  function chownErOk(er) {
    if (!er)
      return true;
    if (er.code === "ENOSYS")
      return true;
    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true;
    }
    return false;
  }
}
var Stream = require$$0$2.Stream;
var legacyStreams = legacy$1;
function legacy$1(fs2) {
  return {
    ReadStream,
    WriteStream
  };
  function ReadStream(path2, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path2, options);
    Stream.call(this);
    var self2 = this;
    this.path = path2;
    this.fd = null;
    this.readable = true;
    this.paused = false;
    this.flags = "r";
    this.mode = 438;
    this.bufferSize = 64 * 1024;
    options = options || {};
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }
    if (this.encoding) this.setEncoding(this.encoding);
    if (this.start !== void 0) {
      if ("number" !== typeof this.start) {
        throw TypeError("start must be a Number");
      }
      if (this.end === void 0) {
        this.end = Infinity;
      } else if ("number" !== typeof this.end) {
        throw TypeError("end must be a Number");
      }
      if (this.start > this.end) {
        throw new Error("start must be <= end");
      }
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function() {
        self2._read();
      });
      return;
    }
    fs2.open(this.path, this.flags, this.mode, function(err, fd) {
      if (err) {
        self2.emit("error", err);
        self2.readable = false;
        return;
      }
      self2.fd = fd;
      self2.emit("open", fd);
      self2._read();
    });
  }
  function WriteStream(path2, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path2, options);
    Stream.call(this);
    this.path = path2;
    this.fd = null;
    this.writable = true;
    this.flags = "w";
    this.encoding = "binary";
    this.mode = 438;
    this.bytesWritten = 0;
    options = options || {};
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }
    if (this.start !== void 0) {
      if ("number" !== typeof this.start) {
        throw TypeError("start must be a Number");
      }
      if (this.start < 0) {
        throw new Error("start must be >= zero");
      }
      this.pos = this.start;
    }
    this.busy = false;
    this._queue = [];
    if (this.fd === null) {
      this._open = fs2.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
      this.flush();
    }
  }
}
var clone_1 = clone$1;
var getPrototypeOf = Object.getPrototypeOf || function(obj) {
  return obj.__proto__;
};
function clone$1(obj) {
  if (obj === null || typeof obj !== "object")
    return obj;
  if (obj instanceof Object)
    var copy2 = { __proto__: getPrototypeOf(obj) };
  else
    var copy2 = /* @__PURE__ */ Object.create(null);
  Object.getOwnPropertyNames(obj).forEach(function(key) {
    Object.defineProperty(copy2, key, Object.getOwnPropertyDescriptor(obj, key));
  });
  return copy2;
}
var fs$h = fs$j;
var polyfills = polyfills$1;
var legacy = legacyStreams;
var clone = clone_1;
var util$2 = require$$4;
var gracefulQueue;
var previousSymbol;
if (typeof Symbol === "function" && typeof Symbol.for === "function") {
  gracefulQueue = Symbol.for("graceful-fs.queue");
  previousSymbol = Symbol.for("graceful-fs.previous");
} else {
  gracefulQueue = "___graceful-fs.queue";
  previousSymbol = "___graceful-fs.previous";
}
function noop() {
}
function publishQueue(context, queue2) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue2;
    }
  });
}
var debug$3 = noop;
if (util$2.debuglog)
  debug$3 = util$2.debuglog("gfs4");
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
  debug$3 = function() {
    var m = util$2.format.apply(util$2, arguments);
    m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
    console.error(m);
  };
if (!fs$h[gracefulQueue]) {
  var queue = commonjsGlobal[gracefulQueue] || [];
  publishQueue(fs$h, queue);
  fs$h.close = function(fs$close) {
    function close(fd, cb) {
      return fs$close.call(fs$h, fd, function(err) {
        if (!err) {
          resetQueue();
        }
        if (typeof cb === "function")
          cb.apply(this, arguments);
      });
    }
    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    });
    return close;
  }(fs$h.close);
  fs$h.closeSync = function(fs$closeSync) {
    function closeSync(fd) {
      fs$closeSync.apply(fs$h, arguments);
      resetQueue();
    }
    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    });
    return closeSync;
  }(fs$h.closeSync);
  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
    process.on("exit", function() {
      debug$3(fs$h[gracefulQueue]);
      require$$5.equal(fs$h[gracefulQueue].length, 0);
    });
  }
}
if (!commonjsGlobal[gracefulQueue]) {
  publishQueue(commonjsGlobal, fs$h[gracefulQueue]);
}
var gracefulFs = patch$2(clone(fs$h));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs$h.__patched) {
  gracefulFs = patch$2(fs$h);
  fs$h.__patched = true;
}
function patch$2(fs2) {
  polyfills(fs2);
  fs2.gracefulify = patch$2;
  fs2.createReadStream = createReadStream;
  fs2.createWriteStream = createWriteStream;
  var fs$readFile = fs2.readFile;
  fs2.readFile = readFile2;
  function readFile2(path2, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    return go$readFile(path2, options, cb);
    function go$readFile(path22, options2, cb2, startTime) {
      return fs$readFile(path22, options2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$readFile, [path22, options2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$writeFile = fs2.writeFile;
  fs2.writeFile = writeFile2;
  function writeFile2(path2, data, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    return go$writeFile(path2, data, options, cb);
    function go$writeFile(path22, data2, options2, cb2, startTime) {
      return fs$writeFile(path22, data2, options2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$writeFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$appendFile = fs2.appendFile;
  if (fs$appendFile)
    fs2.appendFile = appendFile;
  function appendFile(path2, data, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    return go$appendFile(path2, data, options, cb);
    function go$appendFile(path22, data2, options2, cb2, startTime) {
      return fs$appendFile(path22, data2, options2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$appendFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$copyFile = fs2.copyFile;
  if (fs$copyFile)
    fs2.copyFile = copyFile2;
  function copyFile2(src2, dest, flags, cb) {
    if (typeof flags === "function") {
      cb = flags;
      flags = 0;
    }
    return go$copyFile(src2, dest, flags, cb);
    function go$copyFile(src22, dest2, flags2, cb2, startTime) {
      return fs$copyFile(src22, dest2, flags2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$copyFile, [src22, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$readdir = fs2.readdir;
  fs2.readdir = readdir;
  var noReaddirOptionVersions = /^v[0-5]\./;
  function readdir(path2, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path22, options2, cb2, startTime) {
      return fs$readdir(path22, fs$readdirCallback(
        path22,
        options2,
        cb2,
        startTime
      ));
    } : function go$readdir2(path22, options2, cb2, startTime) {
      return fs$readdir(path22, options2, fs$readdirCallback(
        path22,
        options2,
        cb2,
        startTime
      ));
    };
    return go$readdir(path2, options, cb);
    function fs$readdirCallback(path22, options2, cb2, startTime) {
      return function(err, files) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([
            go$readdir,
            [path22, options2, cb2],
            err,
            startTime || Date.now(),
            Date.now()
          ]);
        else {
          if (files && files.sort)
            files.sort();
          if (typeof cb2 === "function")
            cb2.call(this, err, files);
        }
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var legStreams = legacy(fs2);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }
  var fs$ReadStream = fs2.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = ReadStream$open;
  }
  var fs$WriteStream = fs2.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = WriteStream$open;
  }
  Object.defineProperty(fs2, "ReadStream", {
    get: function() {
      return ReadStream;
    },
    set: function(val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs2, "WriteStream", {
    get: function() {
      return WriteStream;
    },
    set: function(val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileReadStream = ReadStream;
  Object.defineProperty(fs2, "FileReadStream", {
    get: function() {
      return FileReadStream;
    },
    set: function(val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileWriteStream = WriteStream;
  Object.defineProperty(fs2, "FileWriteStream", {
    get: function() {
      return FileWriteStream;
    },
    set: function(val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });
  function ReadStream(path2, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this;
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
  }
  function ReadStream$open() {
    var that = this;
    open(that.path, that.flags, that.mode, function(err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();
        that.emit("error", err);
      } else {
        that.fd = fd;
        that.emit("open", fd);
        that.read();
      }
    });
  }
  function WriteStream(path2, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this;
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
  }
  function WriteStream$open() {
    var that = this;
    open(that.path, that.flags, that.mode, function(err, fd) {
      if (err) {
        that.destroy();
        that.emit("error", err);
      } else {
        that.fd = fd;
        that.emit("open", fd);
      }
    });
  }
  function createReadStream(path2, options) {
    return new fs2.ReadStream(path2, options);
  }
  function createWriteStream(path2, options) {
    return new fs2.WriteStream(path2, options);
  }
  var fs$open = fs2.open;
  fs2.open = open;
  function open(path2, flags, mode, cb) {
    if (typeof mode === "function")
      cb = mode, mode = null;
    return go$open(path2, flags, mode, cb);
    function go$open(path22, flags2, mode2, cb2, startTime) {
      return fs$open(path22, flags2, mode2, function(err, fd) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$open, [path22, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  return fs2;
}
function enqueue(elem) {
  debug$3("ENQUEUE", elem[0].name, elem[1]);
  fs$h[gracefulQueue].push(elem);
  retry$2();
}
var retryTimer;
function resetQueue() {
  var now = Date.now();
  for (var i = 0; i < fs$h[gracefulQueue].length; ++i) {
    if (fs$h[gracefulQueue][i].length > 2) {
      fs$h[gracefulQueue][i][3] = now;
      fs$h[gracefulQueue][i][4] = now;
    }
  }
  retry$2();
}
function retry$2() {
  clearTimeout(retryTimer);
  retryTimer = void 0;
  if (fs$h[gracefulQueue].length === 0)
    return;
  var elem = fs$h[gracefulQueue].shift();
  var fn = elem[0];
  var args = elem[1];
  var err = elem[2];
  var startTime = elem[3];
  var lastTime = elem[4];
  if (startTime === void 0) {
    debug$3("RETRY", fn.name, args);
    fn.apply(null, args);
  } else if (Date.now() - startTime >= 6e4) {
    debug$3("TIMEOUT", fn.name, args);
    var cb = args.pop();
    if (typeof cb === "function")
      cb.call(null, err);
  } else {
    var sinceAttempt = Date.now() - lastTime;
    var sinceStart = Math.max(lastTime - startTime, 1);
    var desiredDelay = Math.min(sinceStart * 1.2, 100);
    if (sinceAttempt >= desiredDelay) {
      debug$3("RETRY", fn.name, args);
      fn.apply(null, args.concat([startTime]));
    } else {
      fs$h[gracefulQueue].push(elem);
    }
  }
  if (retryTimer === void 0) {
    retryTimer = setTimeout(retry$2, 0);
  }
}
(function(exports) {
  const u2 = universalify$1.fromCallback;
  const fs2 = gracefulFs;
  const api = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "close",
    "copyFile",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "lchmod",
    "lchown",
    "link",
    "lstat",
    "mkdir",
    "mkdtemp",
    "open",
    "opendir",
    "readdir",
    "readFile",
    "readlink",
    "realpath",
    "rename",
    "rm",
    "rmdir",
    "stat",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile"
  ].filter((key) => {
    return typeof fs2[key] === "function";
  });
  Object.assign(exports, fs2);
  api.forEach((method) => {
    exports[method] = u2(fs2[method]);
  });
  exports.exists = function(filename, callback) {
    if (typeof callback === "function") {
      return fs2.exists(filename, callback);
    }
    return new Promise((resolve) => {
      return fs2.exists(filename, resolve);
    });
  };
  exports.read = function(fd, buffer, offset, length, position, callback) {
    if (typeof callback === "function") {
      return fs2.read(fd, buffer, offset, length, position, callback);
    }
    return new Promise((resolve, reject) => {
      fs2.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
        if (err) return reject(err);
        resolve({ bytesRead, buffer: buffer2 });
      });
    });
  };
  exports.write = function(fd, buffer, ...args) {
    if (typeof args[args.length - 1] === "function") {
      return fs2.write(fd, buffer, ...args);
    }
    return new Promise((resolve, reject) => {
      fs2.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
        if (err) return reject(err);
        resolve({ bytesWritten, buffer: buffer2 });
      });
    });
  };
  if (typeof fs2.writev === "function") {
    exports.writev = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.writev(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffers: buffers2 });
        });
      });
    };
  }
  if (typeof fs2.realpath.native === "function") {
    exports.realpath.native = u2(fs2.realpath.native);
  } else {
    process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  }
})(fs$i);
var makeDir$1 = {};
var utils$1 = {};
const path$m = require$$1$1;
utils$1.checkPath = function checkPath(pth) {
  if (process.platform === "win32") {
    const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path$m.parse(pth).root, ""));
    if (pathHasInvalidWinCharacters) {
      const error2 = new Error(`Path contains invalid characters: ${pth}`);
      error2.code = "EINVAL";
      throw error2;
    }
  }
};
const fs$g = fs$i;
const { checkPath: checkPath2 } = utils$1;
const getMode = (options) => {
  const defaults2 = { mode: 511 };
  if (typeof options === "number") return options;
  return { ...defaults2, ...options }.mode;
};
makeDir$1.makeDir = async (dir, options) => {
  checkPath2(dir);
  return fs$g.mkdir(dir, {
    mode: getMode(options),
    recursive: true
  });
};
makeDir$1.makeDirSync = (dir, options) => {
  checkPath2(dir);
  return fs$g.mkdirSync(dir, {
    mode: getMode(options),
    recursive: true
  });
};
const u$a = universalify$1.fromPromise;
const { makeDir: _makeDir, makeDirSync } = makeDir$1;
const makeDir = u$a(_makeDir);
var mkdirs$2 = {
  mkdirs: makeDir,
  mkdirsSync: makeDirSync,
  // alias
  mkdirp: makeDir,
  mkdirpSync: makeDirSync,
  ensureDir: makeDir,
  ensureDirSync: makeDirSync
};
const u$9 = universalify$1.fromPromise;
const fs$f = fs$i;
function pathExists$6(path2) {
  return fs$f.access(path2).then(() => true).catch(() => false);
}
var pathExists_1 = {
  pathExists: u$9(pathExists$6),
  pathExistsSync: fs$f.existsSync
};
const fs$e = gracefulFs;
function utimesMillis$1(path2, atime, mtime, callback) {
  fs$e.open(path2, "r+", (err, fd) => {
    if (err) return callback(err);
    fs$e.futimes(fd, atime, mtime, (futimesErr) => {
      fs$e.close(fd, (closeErr) => {
        if (callback) callback(futimesErr || closeErr);
      });
    });
  });
}
function utimesMillisSync$1(path2, atime, mtime) {
  const fd = fs$e.openSync(path2, "r+");
  fs$e.futimesSync(fd, atime, mtime);
  return fs$e.closeSync(fd);
}
var utimes = {
  utimesMillis: utimesMillis$1,
  utimesMillisSync: utimesMillisSync$1
};
const fs$d = fs$i;
const path$l = require$$1$1;
const util$1 = require$$4;
function getStats$2(src2, dest, opts) {
  const statFunc = opts.dereference ? (file2) => fs$d.stat(file2, { bigint: true }) : (file2) => fs$d.lstat(file2, { bigint: true });
  return Promise.all([
    statFunc(src2),
    statFunc(dest).catch((err) => {
      if (err.code === "ENOENT") return null;
      throw err;
    })
  ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
}
function getStatsSync(src2, dest, opts) {
  let destStat;
  const statFunc = opts.dereference ? (file2) => fs$d.statSync(file2, { bigint: true }) : (file2) => fs$d.lstatSync(file2, { bigint: true });
  const srcStat = statFunc(src2);
  try {
    destStat = statFunc(dest);
  } catch (err) {
    if (err.code === "ENOENT") return { srcStat, destStat: null };
    throw err;
  }
  return { srcStat, destStat };
}
function checkPaths(src2, dest, funcName, opts, cb) {
  util$1.callbackify(getStats$2)(src2, dest, opts, (err, stats) => {
    if (err) return cb(err);
    const { srcStat, destStat } = stats;
    if (destStat) {
      if (areIdentical$2(srcStat, destStat)) {
        const srcBaseName = path$l.basename(src2);
        const destBaseName = path$l.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return cb(null, { srcStat, destStat, isChangingCase: true });
        }
        return cb(new Error("Source and destination must not be the same."));
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite non-directory '${dest}' with directory '${src2}'.`));
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite directory '${dest}' with non-directory '${src2}'.`));
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src2, dest)) {
      return cb(new Error(errMsg(src2, dest, funcName)));
    }
    return cb(null, { srcStat, destStat });
  });
}
function checkPathsSync(src2, dest, funcName, opts) {
  const { srcStat, destStat } = getStatsSync(src2, dest, opts);
  if (destStat) {
    if (areIdentical$2(srcStat, destStat)) {
      const srcBaseName = path$l.basename(src2);
      const destBaseName = path$l.basename(dest);
      if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return { srcStat, destStat, isChangingCase: true };
      }
      throw new Error("Source and destination must not be the same.");
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src2}'.`);
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src2}'.`);
    }
  }
  if (srcStat.isDirectory() && isSrcSubdir(src2, dest)) {
    throw new Error(errMsg(src2, dest, funcName));
  }
  return { srcStat, destStat };
}
function checkParentPaths(src2, srcStat, dest, funcName, cb) {
  const srcParent = path$l.resolve(path$l.dirname(src2));
  const destParent = path$l.resolve(path$l.dirname(dest));
  if (destParent === srcParent || destParent === path$l.parse(destParent).root) return cb();
  fs$d.stat(destParent, { bigint: true }, (err, destStat) => {
    if (err) {
      if (err.code === "ENOENT") return cb();
      return cb(err);
    }
    if (areIdentical$2(srcStat, destStat)) {
      return cb(new Error(errMsg(src2, dest, funcName)));
    }
    return checkParentPaths(src2, srcStat, destParent, funcName, cb);
  });
}
function checkParentPathsSync(src2, srcStat, dest, funcName) {
  const srcParent = path$l.resolve(path$l.dirname(src2));
  const destParent = path$l.resolve(path$l.dirname(dest));
  if (destParent === srcParent || destParent === path$l.parse(destParent).root) return;
  let destStat;
  try {
    destStat = fs$d.statSync(destParent, { bigint: true });
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  if (areIdentical$2(srcStat, destStat)) {
    throw new Error(errMsg(src2, dest, funcName));
  }
  return checkParentPathsSync(src2, srcStat, destParent, funcName);
}
function areIdentical$2(srcStat, destStat) {
  return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
}
function isSrcSubdir(src2, dest) {
  const srcArr = path$l.resolve(src2).split(path$l.sep).filter((i) => i);
  const destArr = path$l.resolve(dest).split(path$l.sep).filter((i) => i);
  return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true);
}
function errMsg(src2, dest, funcName) {
  return `Cannot ${funcName} '${src2}' to a subdirectory of itself, '${dest}'.`;
}
var stat$4 = {
  checkPaths,
  checkPathsSync,
  checkParentPaths,
  checkParentPathsSync,
  isSrcSubdir,
  areIdentical: areIdentical$2
};
const fs$c = gracefulFs;
const path$k = require$$1$1;
const mkdirs$1 = mkdirs$2.mkdirs;
const pathExists$5 = pathExists_1.pathExists;
const utimesMillis = utimes.utimesMillis;
const stat$3 = stat$4;
function copy$2(src2, dest, opts, cb) {
  if (typeof opts === "function" && !cb) {
    cb = opts;
    opts = {};
  } else if (typeof opts === "function") {
    opts = { filter: opts };
  }
  cb = cb || function() {
  };
  opts = opts || {};
  opts.clobber = "clobber" in opts ? !!opts.clobber : true;
  opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
  if (opts.preserveTimestamps && process.arch === "ia32") {
    process.emitWarning(
      "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
      "Warning",
      "fs-extra-WARN0001"
    );
  }
  stat$3.checkPaths(src2, dest, "copy", opts, (err, stats) => {
    if (err) return cb(err);
    const { srcStat, destStat } = stats;
    stat$3.checkParentPaths(src2, srcStat, dest, "copy", (err2) => {
      if (err2) return cb(err2);
      if (opts.filter) return handleFilter(checkParentDir, destStat, src2, dest, opts, cb);
      return checkParentDir(destStat, src2, dest, opts, cb);
    });
  });
}
function checkParentDir(destStat, src2, dest, opts, cb) {
  const destParent = path$k.dirname(dest);
  pathExists$5(destParent, (err, dirExists) => {
    if (err) return cb(err);
    if (dirExists) return getStats$1(destStat, src2, dest, opts, cb);
    mkdirs$1(destParent, (err2) => {
      if (err2) return cb(err2);
      return getStats$1(destStat, src2, dest, opts, cb);
    });
  });
}
function handleFilter(onInclude, destStat, src2, dest, opts, cb) {
  Promise.resolve(opts.filter(src2, dest)).then((include) => {
    if (include) return onInclude(destStat, src2, dest, opts, cb);
    return cb();
  }, (error2) => cb(error2));
}
function startCopy$1(destStat, src2, dest, opts, cb) {
  if (opts.filter) return handleFilter(getStats$1, destStat, src2, dest, opts, cb);
  return getStats$1(destStat, src2, dest, opts, cb);
}
function getStats$1(destStat, src2, dest, opts, cb) {
  const stat2 = opts.dereference ? fs$c.stat : fs$c.lstat;
  stat2(src2, (err, srcStat) => {
    if (err) return cb(err);
    if (srcStat.isDirectory()) return onDir$1(srcStat, destStat, src2, dest, opts, cb);
    else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile$1(srcStat, destStat, src2, dest, opts, cb);
    else if (srcStat.isSymbolicLink()) return onLink$1(destStat, src2, dest, opts, cb);
    else if (srcStat.isSocket()) return cb(new Error(`Cannot copy a socket file: ${src2}`));
    else if (srcStat.isFIFO()) return cb(new Error(`Cannot copy a FIFO pipe: ${src2}`));
    return cb(new Error(`Unknown file: ${src2}`));
  });
}
function onFile$1(srcStat, destStat, src2, dest, opts, cb) {
  if (!destStat) return copyFile$1(srcStat, src2, dest, opts, cb);
  return mayCopyFile$1(srcStat, src2, dest, opts, cb);
}
function mayCopyFile$1(srcStat, src2, dest, opts, cb) {
  if (opts.overwrite) {
    fs$c.unlink(dest, (err) => {
      if (err) return cb(err);
      return copyFile$1(srcStat, src2, dest, opts, cb);
    });
  } else if (opts.errorOnExist) {
    return cb(new Error(`'${dest}' already exists`));
  } else return cb();
}
function copyFile$1(srcStat, src2, dest, opts, cb) {
  fs$c.copyFile(src2, dest, (err) => {
    if (err) return cb(err);
    if (opts.preserveTimestamps) return handleTimestampsAndMode(srcStat.mode, src2, dest, cb);
    return setDestMode$1(dest, srcStat.mode, cb);
  });
}
function handleTimestampsAndMode(srcMode, src2, dest, cb) {
  if (fileIsNotWritable$1(srcMode)) {
    return makeFileWritable$1(dest, srcMode, (err) => {
      if (err) return cb(err);
      return setDestTimestampsAndMode(srcMode, src2, dest, cb);
    });
  }
  return setDestTimestampsAndMode(srcMode, src2, dest, cb);
}
function fileIsNotWritable$1(srcMode) {
  return (srcMode & 128) === 0;
}
function makeFileWritable$1(dest, srcMode, cb) {
  return setDestMode$1(dest, srcMode | 128, cb);
}
function setDestTimestampsAndMode(srcMode, src2, dest, cb) {
  setDestTimestamps$1(src2, dest, (err) => {
    if (err) return cb(err);
    return setDestMode$1(dest, srcMode, cb);
  });
}
function setDestMode$1(dest, srcMode, cb) {
  return fs$c.chmod(dest, srcMode, cb);
}
function setDestTimestamps$1(src2, dest, cb) {
  fs$c.stat(src2, (err, updatedSrcStat) => {
    if (err) return cb(err);
    return utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb);
  });
}
function onDir$1(srcStat, destStat, src2, dest, opts, cb) {
  if (!destStat) return mkDirAndCopy$1(srcStat.mode, src2, dest, opts, cb);
  return copyDir$1(src2, dest, opts, cb);
}
function mkDirAndCopy$1(srcMode, src2, dest, opts, cb) {
  fs$c.mkdir(dest, (err) => {
    if (err) return cb(err);
    copyDir$1(src2, dest, opts, (err2) => {
      if (err2) return cb(err2);
      return setDestMode$1(dest, srcMode, cb);
    });
  });
}
function copyDir$1(src2, dest, opts, cb) {
  fs$c.readdir(src2, (err, items) => {
    if (err) return cb(err);
    return copyDirItems(items, src2, dest, opts, cb);
  });
}
function copyDirItems(items, src2, dest, opts, cb) {
  const item = items.pop();
  if (!item) return cb();
  return copyDirItem$1(items, item, src2, dest, opts, cb);
}
function copyDirItem$1(items, item, src2, dest, opts, cb) {
  const srcItem = path$k.join(src2, item);
  const destItem = path$k.join(dest, item);
  stat$3.checkPaths(srcItem, destItem, "copy", opts, (err, stats) => {
    if (err) return cb(err);
    const { destStat } = stats;
    startCopy$1(destStat, srcItem, destItem, opts, (err2) => {
      if (err2) return cb(err2);
      return copyDirItems(items, src2, dest, opts, cb);
    });
  });
}
function onLink$1(destStat, src2, dest, opts, cb) {
  fs$c.readlink(src2, (err, resolvedSrc) => {
    if (err) return cb(err);
    if (opts.dereference) {
      resolvedSrc = path$k.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs$c.symlink(resolvedSrc, dest, cb);
    } else {
      fs$c.readlink(dest, (err2, resolvedDest) => {
        if (err2) {
          if (err2.code === "EINVAL" || err2.code === "UNKNOWN") return fs$c.symlink(resolvedSrc, dest, cb);
          return cb(err2);
        }
        if (opts.dereference) {
          resolvedDest = path$k.resolve(process.cwd(), resolvedDest);
        }
        if (stat$3.isSrcSubdir(resolvedSrc, resolvedDest)) {
          return cb(new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`));
        }
        if (destStat.isDirectory() && stat$3.isSrcSubdir(resolvedDest, resolvedSrc)) {
          return cb(new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`));
        }
        return copyLink$1(resolvedSrc, dest, cb);
      });
    }
  });
}
function copyLink$1(resolvedSrc, dest, cb) {
  fs$c.unlink(dest, (err) => {
    if (err) return cb(err);
    return fs$c.symlink(resolvedSrc, dest, cb);
  });
}
var copy_1 = copy$2;
const fs$b = gracefulFs;
const path$j = require$$1$1;
const mkdirsSync$1 = mkdirs$2.mkdirsSync;
const utimesMillisSync = utimes.utimesMillisSync;
const stat$2 = stat$4;
function copySync$1(src2, dest, opts) {
  if (typeof opts === "function") {
    opts = { filter: opts };
  }
  opts = opts || {};
  opts.clobber = "clobber" in opts ? !!opts.clobber : true;
  opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
  if (opts.preserveTimestamps && process.arch === "ia32") {
    process.emitWarning(
      "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
      "Warning",
      "fs-extra-WARN0002"
    );
  }
  const { srcStat, destStat } = stat$2.checkPathsSync(src2, dest, "copy", opts);
  stat$2.checkParentPathsSync(src2, srcStat, dest, "copy");
  return handleFilterAndCopy(destStat, src2, dest, opts);
}
function handleFilterAndCopy(destStat, src2, dest, opts) {
  if (opts.filter && !opts.filter(src2, dest)) return;
  const destParent = path$j.dirname(dest);
  if (!fs$b.existsSync(destParent)) mkdirsSync$1(destParent);
  return getStats(destStat, src2, dest, opts);
}
function startCopy(destStat, src2, dest, opts) {
  if (opts.filter && !opts.filter(src2, dest)) return;
  return getStats(destStat, src2, dest, opts);
}
function getStats(destStat, src2, dest, opts) {
  const statSync = opts.dereference ? fs$b.statSync : fs$b.lstatSync;
  const srcStat = statSync(src2);
  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src2, dest, opts);
  else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src2, dest, opts);
  else if (srcStat.isSymbolicLink()) return onLink(destStat, src2, dest, opts);
  else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src2}`);
  else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src2}`);
  throw new Error(`Unknown file: ${src2}`);
}
function onFile(srcStat, destStat, src2, dest, opts) {
  if (!destStat) return copyFile(srcStat, src2, dest, opts);
  return mayCopyFile(srcStat, src2, dest, opts);
}
function mayCopyFile(srcStat, src2, dest, opts) {
  if (opts.overwrite) {
    fs$b.unlinkSync(dest);
    return copyFile(srcStat, src2, dest, opts);
  } else if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`);
  }
}
function copyFile(srcStat, src2, dest, opts) {
  fs$b.copyFileSync(src2, dest);
  if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src2, dest);
  return setDestMode(dest, srcStat.mode);
}
function handleTimestamps(srcMode, src2, dest) {
  if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
  return setDestTimestamps(src2, dest);
}
function fileIsNotWritable(srcMode) {
  return (srcMode & 128) === 0;
}
function makeFileWritable(dest, srcMode) {
  return setDestMode(dest, srcMode | 128);
}
function setDestMode(dest, srcMode) {
  return fs$b.chmodSync(dest, srcMode);
}
function setDestTimestamps(src2, dest) {
  const updatedSrcStat = fs$b.statSync(src2);
  return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
}
function onDir(srcStat, destStat, src2, dest, opts) {
  if (!destStat) return mkDirAndCopy(srcStat.mode, src2, dest, opts);
  return copyDir(src2, dest, opts);
}
function mkDirAndCopy(srcMode, src2, dest, opts) {
  fs$b.mkdirSync(dest);
  copyDir(src2, dest, opts);
  return setDestMode(dest, srcMode);
}
function copyDir(src2, dest, opts) {
  fs$b.readdirSync(src2).forEach((item) => copyDirItem(item, src2, dest, opts));
}
function copyDirItem(item, src2, dest, opts) {
  const srcItem = path$j.join(src2, item);
  const destItem = path$j.join(dest, item);
  const { destStat } = stat$2.checkPathsSync(srcItem, destItem, "copy", opts);
  return startCopy(destStat, srcItem, destItem, opts);
}
function onLink(destStat, src2, dest, opts) {
  let resolvedSrc = fs$b.readlinkSync(src2);
  if (opts.dereference) {
    resolvedSrc = path$j.resolve(process.cwd(), resolvedSrc);
  }
  if (!destStat) {
    return fs$b.symlinkSync(resolvedSrc, dest);
  } else {
    let resolvedDest;
    try {
      resolvedDest = fs$b.readlinkSync(dest);
    } catch (err) {
      if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs$b.symlinkSync(resolvedSrc, dest);
      throw err;
    }
    if (opts.dereference) {
      resolvedDest = path$j.resolve(process.cwd(), resolvedDest);
    }
    if (stat$2.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
    }
    if (fs$b.statSync(dest).isDirectory() && stat$2.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
    }
    return copyLink(resolvedSrc, dest);
  }
}
function copyLink(resolvedSrc, dest) {
  fs$b.unlinkSync(dest);
  return fs$b.symlinkSync(resolvedSrc, dest);
}
var copySync_1 = copySync$1;
const u$8 = universalify$1.fromCallback;
var copy$1 = {
  copy: u$8(copy_1),
  copySync: copySync_1
};
const fs$a = gracefulFs;
const path$i = require$$1$1;
const assert = require$$5;
const isWindows = process.platform === "win32";
function defaults(options) {
  const methods = [
    "unlink",
    "chmod",
    "stat",
    "lstat",
    "rmdir",
    "readdir"
  ];
  methods.forEach((m) => {
    options[m] = options[m] || fs$a[m];
    m = m + "Sync";
    options[m] = options[m] || fs$a[m];
  });
  options.maxBusyTries = options.maxBusyTries || 3;
}
function rimraf$1(p, options, cb) {
  let busyTries = 0;
  if (typeof options === "function") {
    cb = options;
    options = {};
  }
  assert(p, "rimraf: missing path");
  assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
  assert.strictEqual(typeof cb, "function", "rimraf: callback function required");
  assert(options, "rimraf: invalid options argument provided");
  assert.strictEqual(typeof options, "object", "rimraf: options should be object");
  defaults(options);
  rimraf_(p, options, function CB(er) {
    if (er) {
      if ((er.code === "EBUSY" || er.code === "ENOTEMPTY" || er.code === "EPERM") && busyTries < options.maxBusyTries) {
        busyTries++;
        const time = busyTries * 100;
        return setTimeout(() => rimraf_(p, options, CB), time);
      }
      if (er.code === "ENOENT") er = null;
    }
    cb(er);
  });
}
function rimraf_(p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === "function");
  options.lstat(p, (er, st) => {
    if (er && er.code === "ENOENT") {
      return cb(null);
    }
    if (er && er.code === "EPERM" && isWindows) {
      return fixWinEPERM(p, options, er, cb);
    }
    if (st && st.isDirectory()) {
      return rmdir(p, options, er, cb);
    }
    options.unlink(p, (er2) => {
      if (er2) {
        if (er2.code === "ENOENT") {
          return cb(null);
        }
        if (er2.code === "EPERM") {
          return isWindows ? fixWinEPERM(p, options, er2, cb) : rmdir(p, options, er2, cb);
        }
        if (er2.code === "EISDIR") {
          return rmdir(p, options, er2, cb);
        }
      }
      return cb(er2);
    });
  });
}
function fixWinEPERM(p, options, er, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === "function");
  options.chmod(p, 438, (er2) => {
    if (er2) {
      cb(er2.code === "ENOENT" ? null : er);
    } else {
      options.stat(p, (er3, stats) => {
        if (er3) {
          cb(er3.code === "ENOENT" ? null : er);
        } else if (stats.isDirectory()) {
          rmdir(p, options, er, cb);
        } else {
          options.unlink(p, cb);
        }
      });
    }
  });
}
function fixWinEPERMSync(p, options, er) {
  let stats;
  assert(p);
  assert(options);
  try {
    options.chmodSync(p, 438);
  } catch (er2) {
    if (er2.code === "ENOENT") {
      return;
    } else {
      throw er;
    }
  }
  try {
    stats = options.statSync(p);
  } catch (er3) {
    if (er3.code === "ENOENT") {
      return;
    } else {
      throw er;
    }
  }
  if (stats.isDirectory()) {
    rmdirSync(p, options, er);
  } else {
    options.unlinkSync(p);
  }
}
function rmdir(p, options, originalEr, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === "function");
  options.rmdir(p, (er) => {
    if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")) {
      rmkids(p, options, cb);
    } else if (er && er.code === "ENOTDIR") {
      cb(originalEr);
    } else {
      cb(er);
    }
  });
}
function rmkids(p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === "function");
  options.readdir(p, (er, files) => {
    if (er) return cb(er);
    let n = files.length;
    let errState;
    if (n === 0) return options.rmdir(p, cb);
    files.forEach((f) => {
      rimraf$1(path$i.join(p, f), options, (er2) => {
        if (errState) {
          return;
        }
        if (er2) return cb(errState = er2);
        if (--n === 0) {
          options.rmdir(p, cb);
        }
      });
    });
  });
}
function rimrafSync(p, options) {
  let st;
  options = options || {};
  defaults(options);
  assert(p, "rimraf: missing path");
  assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
  assert(options, "rimraf: missing options");
  assert.strictEqual(typeof options, "object", "rimraf: options should be object");
  try {
    st = options.lstatSync(p);
  } catch (er) {
    if (er.code === "ENOENT") {
      return;
    }
    if (er.code === "EPERM" && isWindows) {
      fixWinEPERMSync(p, options, er);
    }
  }
  try {
    if (st && st.isDirectory()) {
      rmdirSync(p, options, null);
    } else {
      options.unlinkSync(p);
    }
  } catch (er) {
    if (er.code === "ENOENT") {
      return;
    } else if (er.code === "EPERM") {
      return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er);
    } else if (er.code !== "EISDIR") {
      throw er;
    }
    rmdirSync(p, options, er);
  }
}
function rmdirSync(p, options, originalEr) {
  assert(p);
  assert(options);
  try {
    options.rmdirSync(p);
  } catch (er) {
    if (er.code === "ENOTDIR") {
      throw originalEr;
    } else if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM") {
      rmkidsSync(p, options);
    } else if (er.code !== "ENOENT") {
      throw er;
    }
  }
}
function rmkidsSync(p, options) {
  assert(p);
  assert(options);
  options.readdirSync(p).forEach((f) => rimrafSync(path$i.join(p, f), options));
  if (isWindows) {
    const startTime = Date.now();
    do {
      try {
        const ret = options.rmdirSync(p, options);
        return ret;
      } catch {
      }
    } while (Date.now() - startTime < 500);
  } else {
    const ret = options.rmdirSync(p, options);
    return ret;
  }
}
var rimraf_1 = rimraf$1;
rimraf$1.sync = rimrafSync;
const fs$9 = gracefulFs;
const u$7 = universalify$1.fromCallback;
const rimraf = rimraf_1;
function remove$2(path2, callback) {
  if (fs$9.rm) return fs$9.rm(path2, { recursive: true, force: true }, callback);
  rimraf(path2, callback);
}
function removeSync$1(path2) {
  if (fs$9.rmSync) return fs$9.rmSync(path2, { recursive: true, force: true });
  rimraf.sync(path2);
}
var remove_1 = {
  remove: u$7(remove$2),
  removeSync: removeSync$1
};
const u$6 = universalify$1.fromPromise;
const fs$8 = fs$i;
const path$h = require$$1$1;
const mkdir$3 = mkdirs$2;
const remove$1 = remove_1;
const emptyDir = u$6(async function emptyDir2(dir) {
  let items;
  try {
    items = await fs$8.readdir(dir);
  } catch {
    return mkdir$3.mkdirs(dir);
  }
  return Promise.all(items.map((item) => remove$1.remove(path$h.join(dir, item))));
});
function emptyDirSync(dir) {
  let items;
  try {
    items = fs$8.readdirSync(dir);
  } catch {
    return mkdir$3.mkdirsSync(dir);
  }
  items.forEach((item) => {
    item = path$h.join(dir, item);
    remove$1.removeSync(item);
  });
}
var empty = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir
};
const u$5 = universalify$1.fromCallback;
const path$g = require$$1$1;
const fs$7 = gracefulFs;
const mkdir$2 = mkdirs$2;
function createFile$1(file2, callback) {
  function makeFile() {
    fs$7.writeFile(file2, "", (err) => {
      if (err) return callback(err);
      callback();
    });
  }
  fs$7.stat(file2, (err, stats) => {
    if (!err && stats.isFile()) return callback();
    const dir = path$g.dirname(file2);
    fs$7.stat(dir, (err2, stats2) => {
      if (err2) {
        if (err2.code === "ENOENT") {
          return mkdir$2.mkdirs(dir, (err3) => {
            if (err3) return callback(err3);
            makeFile();
          });
        }
        return callback(err2);
      }
      if (stats2.isDirectory()) makeFile();
      else {
        fs$7.readdir(dir, (err3) => {
          if (err3) return callback(err3);
        });
      }
    });
  });
}
function createFileSync$1(file2) {
  let stats;
  try {
    stats = fs$7.statSync(file2);
  } catch {
  }
  if (stats && stats.isFile()) return;
  const dir = path$g.dirname(file2);
  try {
    if (!fs$7.statSync(dir).isDirectory()) {
      fs$7.readdirSync(dir);
    }
  } catch (err) {
    if (err && err.code === "ENOENT") mkdir$2.mkdirsSync(dir);
    else throw err;
  }
  fs$7.writeFileSync(file2, "");
}
var file = {
  createFile: u$5(createFile$1),
  createFileSync: createFileSync$1
};
const u$4 = universalify$1.fromCallback;
const path$f = require$$1$1;
const fs$6 = gracefulFs;
const mkdir$1 = mkdirs$2;
const pathExists$4 = pathExists_1.pathExists;
const { areIdentical: areIdentical$1 } = stat$4;
function createLink$1(srcpath, dstpath, callback) {
  function makeLink(srcpath2, dstpath2) {
    fs$6.link(srcpath2, dstpath2, (err) => {
      if (err) return callback(err);
      callback(null);
    });
  }
  fs$6.lstat(dstpath, (_, dstStat) => {
    fs$6.lstat(srcpath, (err, srcStat) => {
      if (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        return callback(err);
      }
      if (dstStat && areIdentical$1(srcStat, dstStat)) return callback(null);
      const dir = path$f.dirname(dstpath);
      pathExists$4(dir, (err2, dirExists) => {
        if (err2) return callback(err2);
        if (dirExists) return makeLink(srcpath, dstpath);
        mkdir$1.mkdirs(dir, (err3) => {
          if (err3) return callback(err3);
          makeLink(srcpath, dstpath);
        });
      });
    });
  });
}
function createLinkSync$1(srcpath, dstpath) {
  let dstStat;
  try {
    dstStat = fs$6.lstatSync(dstpath);
  } catch {
  }
  try {
    const srcStat = fs$6.lstatSync(srcpath);
    if (dstStat && areIdentical$1(srcStat, dstStat)) return;
  } catch (err) {
    err.message = err.message.replace("lstat", "ensureLink");
    throw err;
  }
  const dir = path$f.dirname(dstpath);
  const dirExists = fs$6.existsSync(dir);
  if (dirExists) return fs$6.linkSync(srcpath, dstpath);
  mkdir$1.mkdirsSync(dir);
  return fs$6.linkSync(srcpath, dstpath);
}
var link = {
  createLink: u$4(createLink$1),
  createLinkSync: createLinkSync$1
};
const path$e = require$$1$1;
const fs$5 = gracefulFs;
const pathExists$3 = pathExists_1.pathExists;
function symlinkPaths$1(srcpath, dstpath, callback) {
  if (path$e.isAbsolute(srcpath)) {
    return fs$5.lstat(srcpath, (err) => {
      if (err) {
        err.message = err.message.replace("lstat", "ensureSymlink");
        return callback(err);
      }
      return callback(null, {
        toCwd: srcpath,
        toDst: srcpath
      });
    });
  } else {
    const dstdir = path$e.dirname(dstpath);
    const relativeToDst = path$e.join(dstdir, srcpath);
    return pathExists$3(relativeToDst, (err, exists) => {
      if (err) return callback(err);
      if (exists) {
        return callback(null, {
          toCwd: relativeToDst,
          toDst: srcpath
        });
      } else {
        return fs$5.lstat(srcpath, (err2) => {
          if (err2) {
            err2.message = err2.message.replace("lstat", "ensureSymlink");
            return callback(err2);
          }
          return callback(null, {
            toCwd: srcpath,
            toDst: path$e.relative(dstdir, srcpath)
          });
        });
      }
    });
  }
}
function symlinkPathsSync$1(srcpath, dstpath) {
  let exists;
  if (path$e.isAbsolute(srcpath)) {
    exists = fs$5.existsSync(srcpath);
    if (!exists) throw new Error("absolute srcpath does not exist");
    return {
      toCwd: srcpath,
      toDst: srcpath
    };
  } else {
    const dstdir = path$e.dirname(dstpath);
    const relativeToDst = path$e.join(dstdir, srcpath);
    exists = fs$5.existsSync(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    } else {
      exists = fs$5.existsSync(srcpath);
      if (!exists) throw new Error("relative srcpath does not exist");
      return {
        toCwd: srcpath,
        toDst: path$e.relative(dstdir, srcpath)
      };
    }
  }
}
var symlinkPaths_1 = {
  symlinkPaths: symlinkPaths$1,
  symlinkPathsSync: symlinkPathsSync$1
};
const fs$4 = gracefulFs;
function symlinkType$1(srcpath, type2, callback) {
  callback = typeof type2 === "function" ? type2 : callback;
  type2 = typeof type2 === "function" ? false : type2;
  if (type2) return callback(null, type2);
  fs$4.lstat(srcpath, (err, stats) => {
    if (err) return callback(null, "file");
    type2 = stats && stats.isDirectory() ? "dir" : "file";
    callback(null, type2);
  });
}
function symlinkTypeSync$1(srcpath, type2) {
  let stats;
  if (type2) return type2;
  try {
    stats = fs$4.lstatSync(srcpath);
  } catch {
    return "file";
  }
  return stats && stats.isDirectory() ? "dir" : "file";
}
var symlinkType_1 = {
  symlinkType: symlinkType$1,
  symlinkTypeSync: symlinkTypeSync$1
};
const u$3 = universalify$1.fromCallback;
const path$d = require$$1$1;
const fs$3 = fs$i;
const _mkdirs = mkdirs$2;
const mkdirs = _mkdirs.mkdirs;
const mkdirsSync = _mkdirs.mkdirsSync;
const _symlinkPaths = symlinkPaths_1;
const symlinkPaths = _symlinkPaths.symlinkPaths;
const symlinkPathsSync = _symlinkPaths.symlinkPathsSync;
const _symlinkType = symlinkType_1;
const symlinkType = _symlinkType.symlinkType;
const symlinkTypeSync = _symlinkType.symlinkTypeSync;
const pathExists$2 = pathExists_1.pathExists;
const { areIdentical } = stat$4;
function createSymlink$1(srcpath, dstpath, type2, callback) {
  callback = typeof type2 === "function" ? type2 : callback;
  type2 = typeof type2 === "function" ? false : type2;
  fs$3.lstat(dstpath, (err, stats) => {
    if (!err && stats.isSymbolicLink()) {
      Promise.all([
        fs$3.stat(srcpath),
        fs$3.stat(dstpath)
      ]).then(([srcStat, dstStat]) => {
        if (areIdentical(srcStat, dstStat)) return callback(null);
        _createSymlink(srcpath, dstpath, type2, callback);
      });
    } else _createSymlink(srcpath, dstpath, type2, callback);
  });
}
function _createSymlink(srcpath, dstpath, type2, callback) {
  symlinkPaths(srcpath, dstpath, (err, relative) => {
    if (err) return callback(err);
    srcpath = relative.toDst;
    symlinkType(relative.toCwd, type2, (err2, type3) => {
      if (err2) return callback(err2);
      const dir = path$d.dirname(dstpath);
      pathExists$2(dir, (err3, dirExists) => {
        if (err3) return callback(err3);
        if (dirExists) return fs$3.symlink(srcpath, dstpath, type3, callback);
        mkdirs(dir, (err4) => {
          if (err4) return callback(err4);
          fs$3.symlink(srcpath, dstpath, type3, callback);
        });
      });
    });
  });
}
function createSymlinkSync$1(srcpath, dstpath, type2) {
  let stats;
  try {
    stats = fs$3.lstatSync(dstpath);
  } catch {
  }
  if (stats && stats.isSymbolicLink()) {
    const srcStat = fs$3.statSync(srcpath);
    const dstStat = fs$3.statSync(dstpath);
    if (areIdentical(srcStat, dstStat)) return;
  }
  const relative = symlinkPathsSync(srcpath, dstpath);
  srcpath = relative.toDst;
  type2 = symlinkTypeSync(relative.toCwd, type2);
  const dir = path$d.dirname(dstpath);
  const exists = fs$3.existsSync(dir);
  if (exists) return fs$3.symlinkSync(srcpath, dstpath, type2);
  mkdirsSync(dir);
  return fs$3.symlinkSync(srcpath, dstpath, type2);
}
var symlink = {
  createSymlink: u$3(createSymlink$1),
  createSymlinkSync: createSymlinkSync$1
};
const { createFile, createFileSync } = file;
const { createLink, createLinkSync } = link;
const { createSymlink, createSymlinkSync } = symlink;
var ensure = {
  // file
  createFile,
  createFileSync,
  ensureFile: createFile,
  ensureFileSync: createFileSync,
  // link
  createLink,
  createLinkSync,
  ensureLink: createLink,
  ensureLinkSync: createLinkSync,
  // symlink
  createSymlink,
  createSymlinkSync,
  ensureSymlink: createSymlink,
  ensureSymlinkSync: createSymlinkSync
};
function stringify$4(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
  const EOF = finalEOL ? EOL : "";
  const str2 = JSON.stringify(obj, replacer, spaces);
  if (str2 === void 0) {
    throw new TypeError(`Converting ${typeof obj} value to JSON is not supported`);
  }
  return str2.replace(/\n/g, EOL) + EOF;
}
function stripBom$1(content) {
  if (Buffer.isBuffer(content)) content = content.toString("utf8");
  return content.replace(/^\uFEFF/, "");
}
var utils = { stringify: stringify$4, stripBom: stripBom$1 };
let _fs;
try {
  _fs = gracefulFs;
} catch (_) {
  _fs = fs$j;
}
const universalify = universalify$1;
const { stringify: stringify$3, stripBom } = utils;
async function _readFile(file2, options = {}) {
  if (typeof options === "string") {
    options = { encoding: options };
  }
  const fs2 = options.fs || _fs;
  const shouldThrow = "throws" in options ? options.throws : true;
  let data = await universalify.fromCallback(fs2.readFile)(file2, options);
  data = stripBom(data);
  let obj;
  try {
    obj = JSON.parse(data, options ? options.reviver : null);
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file2}: ${err.message}`;
      throw err;
    } else {
      return null;
    }
  }
  return obj;
}
const readFile = universalify.fromPromise(_readFile);
function readFileSync(file2, options = {}) {
  if (typeof options === "string") {
    options = { encoding: options };
  }
  const fs2 = options.fs || _fs;
  const shouldThrow = "throws" in options ? options.throws : true;
  try {
    let content = fs2.readFileSync(file2, options);
    content = stripBom(content);
    return JSON.parse(content, options.reviver);
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file2}: ${err.message}`;
      throw err;
    } else {
      return null;
    }
  }
}
async function _writeFile(file2, obj, options = {}) {
  const fs2 = options.fs || _fs;
  const str2 = stringify$3(obj, options);
  await universalify.fromCallback(fs2.writeFile)(file2, str2, options);
}
const writeFile = universalify.fromPromise(_writeFile);
function writeFileSync(file2, obj, options = {}) {
  const fs2 = options.fs || _fs;
  const str2 = stringify$3(obj, options);
  return fs2.writeFileSync(file2, str2, options);
}
var jsonfile$1 = {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync
};
const jsonFile$1 = jsonfile$1;
var jsonfile = {
  // jsonfile exports
  readJson: jsonFile$1.readFile,
  readJsonSync: jsonFile$1.readFileSync,
  writeJson: jsonFile$1.writeFile,
  writeJsonSync: jsonFile$1.writeFileSync
};
const u$2 = universalify$1.fromCallback;
const fs$2 = gracefulFs;
const path$c = require$$1$1;
const mkdir = mkdirs$2;
const pathExists$1 = pathExists_1.pathExists;
function outputFile$1(file2, data, encoding, callback) {
  if (typeof encoding === "function") {
    callback = encoding;
    encoding = "utf8";
  }
  const dir = path$c.dirname(file2);
  pathExists$1(dir, (err, itDoes) => {
    if (err) return callback(err);
    if (itDoes) return fs$2.writeFile(file2, data, encoding, callback);
    mkdir.mkdirs(dir, (err2) => {
      if (err2) return callback(err2);
      fs$2.writeFile(file2, data, encoding, callback);
    });
  });
}
function outputFileSync$1(file2, ...args) {
  const dir = path$c.dirname(file2);
  if (fs$2.existsSync(dir)) {
    return fs$2.writeFileSync(file2, ...args);
  }
  mkdir.mkdirsSync(dir);
  fs$2.writeFileSync(file2, ...args);
}
var outputFile_1 = {
  outputFile: u$2(outputFile$1),
  outputFileSync: outputFileSync$1
};
const { stringify: stringify$2 } = utils;
const { outputFile } = outputFile_1;
async function outputJson(file2, data, options = {}) {
  const str2 = stringify$2(data, options);
  await outputFile(file2, str2, options);
}
var outputJson_1 = outputJson;
const { stringify: stringify$1 } = utils;
const { outputFileSync } = outputFile_1;
function outputJsonSync(file2, data, options) {
  const str2 = stringify$1(data, options);
  outputFileSync(file2, str2, options);
}
var outputJsonSync_1 = outputJsonSync;
const u$1 = universalify$1.fromPromise;
const jsonFile = jsonfile;
jsonFile.outputJson = u$1(outputJson_1);
jsonFile.outputJsonSync = outputJsonSync_1;
jsonFile.outputJSON = jsonFile.outputJson;
jsonFile.outputJSONSync = jsonFile.outputJsonSync;
jsonFile.writeJSON = jsonFile.writeJson;
jsonFile.writeJSONSync = jsonFile.writeJsonSync;
jsonFile.readJSON = jsonFile.readJson;
jsonFile.readJSONSync = jsonFile.readJsonSync;
var json$1 = jsonFile;
const fs$1 = gracefulFs;
const path$b = require$$1$1;
const copy = copy$1.copy;
const remove = remove_1.remove;
const mkdirp = mkdirs$2.mkdirp;
const pathExists = pathExists_1.pathExists;
const stat$1 = stat$4;
function move$1(src2, dest, opts, cb) {
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }
  opts = opts || {};
  const overwrite = opts.overwrite || opts.clobber || false;
  stat$1.checkPaths(src2, dest, "move", opts, (err, stats) => {
    if (err) return cb(err);
    const { srcStat, isChangingCase = false } = stats;
    stat$1.checkParentPaths(src2, srcStat, dest, "move", (err2) => {
      if (err2) return cb(err2);
      if (isParentRoot$1(dest)) return doRename$1(src2, dest, overwrite, isChangingCase, cb);
      mkdirp(path$b.dirname(dest), (err3) => {
        if (err3) return cb(err3);
        return doRename$1(src2, dest, overwrite, isChangingCase, cb);
      });
    });
  });
}
function isParentRoot$1(dest) {
  const parent = path$b.dirname(dest);
  const parsedPath = path$b.parse(parent);
  return parsedPath.root === parent;
}
function doRename$1(src2, dest, overwrite, isChangingCase, cb) {
  if (isChangingCase) return rename$1(src2, dest, overwrite, cb);
  if (overwrite) {
    return remove(dest, (err) => {
      if (err) return cb(err);
      return rename$1(src2, dest, overwrite, cb);
    });
  }
  pathExists(dest, (err, destExists) => {
    if (err) return cb(err);
    if (destExists) return cb(new Error("dest already exists."));
    return rename$1(src2, dest, overwrite, cb);
  });
}
function rename$1(src2, dest, overwrite, cb) {
  fs$1.rename(src2, dest, (err) => {
    if (!err) return cb();
    if (err.code !== "EXDEV") return cb(err);
    return moveAcrossDevice$1(src2, dest, overwrite, cb);
  });
}
function moveAcrossDevice$1(src2, dest, overwrite, cb) {
  const opts = {
    overwrite,
    errorOnExist: true
  };
  copy(src2, dest, opts, (err) => {
    if (err) return cb(err);
    return remove(src2, cb);
  });
}
var move_1 = move$1;
const fs = gracefulFs;
const path$a = require$$1$1;
const copySync = copy$1.copySync;
const removeSync = remove_1.removeSync;
const mkdirpSync = mkdirs$2.mkdirpSync;
const stat = stat$4;
function moveSync(src2, dest, opts) {
  opts = opts || {};
  const overwrite = opts.overwrite || opts.clobber || false;
  const { srcStat, isChangingCase = false } = stat.checkPathsSync(src2, dest, "move", opts);
  stat.checkParentPathsSync(src2, srcStat, dest, "move");
  if (!isParentRoot(dest)) mkdirpSync(path$a.dirname(dest));
  return doRename(src2, dest, overwrite, isChangingCase);
}
function isParentRoot(dest) {
  const parent = path$a.dirname(dest);
  const parsedPath = path$a.parse(parent);
  return parsedPath.root === parent;
}
function doRename(src2, dest, overwrite, isChangingCase) {
  if (isChangingCase) return rename(src2, dest, overwrite);
  if (overwrite) {
    removeSync(dest);
    return rename(src2, dest, overwrite);
  }
  if (fs.existsSync(dest)) throw new Error("dest already exists.");
  return rename(src2, dest, overwrite);
}
function rename(src2, dest, overwrite) {
  try {
    fs.renameSync(src2, dest);
  } catch (err) {
    if (err.code !== "EXDEV") throw err;
    return moveAcrossDevice(src2, dest, overwrite);
  }
}
function moveAcrossDevice(src2, dest, overwrite) {
  const opts = {
    overwrite,
    errorOnExist: true
  };
  copySync(src2, dest, opts);
  return removeSync(src2);
}
var moveSync_1 = moveSync;
const u = universalify$1.fromCallback;
var move = {
  move: u(move_1),
  moveSync: moveSync_1
};
var lib = {
  // Export promiseified graceful-fs:
  ...fs$i,
  // Export extra methods:
  ...copy$1,
  ...empty,
  ...ensure,
  ...json$1,
  ...mkdirs$2,
  ...move,
  ...outputFile_1,
  ...pathExists_1,
  ...remove_1
};
var BaseUpdater$1 = {};
var AppUpdater$1 = {};
var out = {};
var CancellationToken$1 = {};
Object.defineProperty(CancellationToken$1, "__esModule", { value: true });
CancellationToken$1.CancellationError = CancellationToken$1.CancellationToken = void 0;
const events_1$1 = require$$0$3;
class CancellationToken extends events_1$1.EventEmitter {
  get cancelled() {
    return this._cancelled || this._parent != null && this._parent.cancelled;
  }
  set parent(value) {
    this.removeParentCancelHandler();
    this._parent = value;
    this.parentCancelHandler = () => this.cancel();
    this._parent.onCancel(this.parentCancelHandler);
  }
  // babel cannot compile ... correctly for super calls
  constructor(parent) {
    super();
    this.parentCancelHandler = null;
    this._parent = null;
    this._cancelled = false;
    if (parent != null) {
      this.parent = parent;
    }
  }
  cancel() {
    this._cancelled = true;
    this.emit("cancel");
  }
  onCancel(handler) {
    if (this.cancelled) {
      handler();
    } else {
      this.once("cancel", handler);
    }
  }
  createPromise(callback) {
    if (this.cancelled) {
      return Promise.reject(new CancellationError());
    }
    const finallyHandler = () => {
      if (cancelHandler != null) {
        try {
          this.removeListener("cancel", cancelHandler);
          cancelHandler = null;
        } catch (_ignore) {
        }
      }
    };
    let cancelHandler = null;
    return new Promise((resolve, reject) => {
      let addedCancelHandler = null;
      cancelHandler = () => {
        try {
          if (addedCancelHandler != null) {
            addedCancelHandler();
            addedCancelHandler = null;
          }
        } finally {
          reject(new CancellationError());
        }
      };
      if (this.cancelled) {
        cancelHandler();
        return;
      }
      this.onCancel(cancelHandler);
      callback(resolve, reject, (callback2) => {
        addedCancelHandler = callback2;
      });
    }).then((it) => {
      finallyHandler();
      return it;
    }).catch((e) => {
      finallyHandler();
      throw e;
    });
  }
  removeParentCancelHandler() {
    const parent = this._parent;
    if (parent != null && this.parentCancelHandler != null) {
      parent.removeListener("cancel", this.parentCancelHandler);
      this.parentCancelHandler = null;
    }
  }
  dispose() {
    try {
      this.removeParentCancelHandler();
    } finally {
      this.removeAllListeners();
      this._parent = null;
    }
  }
}
CancellationToken$1.CancellationToken = CancellationToken;
class CancellationError extends Error {
  constructor() {
    super("cancelled");
  }
}
CancellationToken$1.CancellationError = CancellationError;
var error = {};
Object.defineProperty(error, "__esModule", { value: true });
error.newError = newError;
function newError(message, code) {
  const error2 = new Error(message);
  error2.code = code;
  return error2;
}
var httpExecutor = {};
var src = { exports: {} };
var browser = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type2 = typeof val;
    if (type2 === "string" && val.length > 0) {
      return parse2(val);
    } else if (type2 === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse2(str2) {
    str2 = String(str2);
    if (str2.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str2
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type2 = (match[2] || "ms").toLowerCase();
    switch (type2) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms2, msAbs, s, "second");
    }
    return ms2 + " ms";
  }
  function plural(ms2, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
  }
  return ms;
}
var common$6;
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common$6;
  hasRequiredCommon = 1;
  function setup(env) {
    createDebug2.debug = createDebug2;
    createDebug2.default = createDebug2;
    createDebug2.coerce = coerce2;
    createDebug2.disable = disable;
    createDebug2.enable = enable;
    createDebug2.enabled = enabled;
    createDebug2.humanize = requireMs();
    createDebug2.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug2[key] = env[key];
    });
    createDebug2.names = [];
    createDebug2.skips = [];
    createDebug2.formatters = {};
    function selectColor(namespace) {
      let hash2 = 0;
      for (let i = 0; i < namespace.length; i++) {
        hash2 = (hash2 << 5) - hash2 + namespace.charCodeAt(i);
        hash2 |= 0;
      }
      return createDebug2.colors[Math.abs(hash2) % createDebug2.colors.length];
    }
    createDebug2.selectColor = selectColor;
    function createDebug2(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug2(...args) {
        if (!debug2.enabled) {
          return;
        }
        const self2 = debug2;
        const curr = Number(/* @__PURE__ */ new Date());
        const ms2 = curr - (prevTime || curr);
        self2.diff = ms2;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        args[0] = createDebug2.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format2) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug2.formatters[format2];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self2, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug2.formatArgs.call(self2, args);
        const logFn = self2.log || createDebug2.log;
        logFn.apply(self2, args);
      }
      debug2.namespace = namespace;
      debug2.useColors = createDebug2.useColors();
      debug2.color = createDebug2.selectColor(namespace);
      debug2.extend = extend3;
      debug2.destroy = createDebug2.destroy;
      Object.defineProperty(debug2, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug2.namespaces) {
            namespacesCache = createDebug2.namespaces;
            enabledCache = createDebug2.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug2.init === "function") {
        createDebug2.init(debug2);
      }
      return debug2;
    }
    function extend3(namespace, delimiter) {
      const newDebug = createDebug2(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug2.save(namespaces);
      createDebug2.namespaces = namespaces;
      createDebug2.names = [];
      createDebug2.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug2.skips.push(ns.slice(1));
        } else {
          createDebug2.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug2.names,
        ...createDebug2.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug2.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug2.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug2.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce2(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug2.enable(createDebug2.load());
    return createDebug2;
  }
  common$6 = setup;
  return common$6;
}
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function(module2, exports) {
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load2;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error2) {
      }
    }
    function load2() {
      let r;
      try {
        r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
      } catch (error2) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error2) {
      }
    }
    module2.exports = requireCommon()(exports);
    const { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error2) {
        return "[UnexpectedJSONParseError]: " + error2.message;
      }
    };
  })(browser, browser.exports);
  return browser.exports;
}
var node = { exports: {} };
var hasFlag;
var hasRequiredHasFlag;
function requireHasFlag() {
  if (hasRequiredHasFlag) return hasFlag;
  hasRequiredHasFlag = 1;
  hasFlag = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
  };
  return hasFlag;
}
var supportsColor_1;
var hasRequiredSupportsColor;
function requireSupportsColor() {
  if (hasRequiredSupportsColor) return supportsColor_1;
  hasRequiredSupportsColor = 1;
  const os2 = require$$2;
  const tty = require$$1$2;
  const hasFlag2 = requireHasFlag();
  const { env } = process;
  let forceColor;
  if (hasFlag2("no-color") || hasFlag2("no-colors") || hasFlag2("color=false") || hasFlag2("color=never")) {
    forceColor = 0;
  } else if (hasFlag2("color") || hasFlag2("colors") || hasFlag2("color=true") || hasFlag2("color=always")) {
    forceColor = 1;
  }
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      forceColor = 1;
    } else if (env.FORCE_COLOR === "false") {
      forceColor = 0;
    } else {
      forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
    }
  }
  function translateLevel(level) {
    if (level === 0) {
      return false;
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function supportsColor(haveStream, streamIsTTY) {
    if (forceColor === 0) {
      return 0;
    }
    if (hasFlag2("color=16m") || hasFlag2("color=full") || hasFlag2("color=truecolor")) {
      return 3;
    }
    if (hasFlag2("color=256")) {
      return 2;
    }
    if (haveStream && !streamIsTTY && forceColor === void 0) {
      return 0;
    }
    const min = forceColor || 0;
    if (env.TERM === "dumb") {
      return min;
    }
    if (process.platform === "win32") {
      const osRelease = os2.release().split(".");
      if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      }
      return 1;
    }
    if ("CI" in env) {
      if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
        return 1;
      }
      return min;
    }
    if ("TEAMCITY_VERSION" in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env.COLORTERM === "truecolor") {
      return 3;
    }
    if ("TERM_PROGRAM" in env) {
      const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env.TERM_PROGRAM) {
        case "iTerm.app":
          return version >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1;
    }
    if ("COLORTERM" in env) {
      return 1;
    }
    return min;
  }
  function getSupportLevel(stream) {
    const level = supportsColor(stream, stream && stream.isTTY);
    return translateLevel(level);
  }
  supportsColor_1 = {
    supportsColor: getSupportLevel,
    stdout: translateLevel(supportsColor(true, tty.isatty(1))),
    stderr: translateLevel(supportsColor(true, tty.isatty(2)))
  };
  return supportsColor_1;
}
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node.exports;
  hasRequiredNode = 1;
  (function(module2, exports) {
    const tty = require$$1$2;
    const util2 = require$$4;
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load2;
    exports.useColors = useColors;
    exports.destroy = util2.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = requireSupportsColor();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error2) {
    }
    exports.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util2.formatWithOptions(exports.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load2() {
      return process.env.DEBUG;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module2.exports = requireCommon()(exports);
    const { formatters } = module2.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts).split("\n").map((str2) => str2.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts);
    };
  })(node, node.exports);
  return node.exports;
}
if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
  src.exports = requireBrowser();
} else {
  src.exports = requireNode();
}
var srcExports = src.exports;
var ProgressCallbackTransform$1 = {};
Object.defineProperty(ProgressCallbackTransform$1, "__esModule", { value: true });
ProgressCallbackTransform$1.ProgressCallbackTransform = void 0;
const stream_1$3 = require$$0$2;
class ProgressCallbackTransform extends stream_1$3.Transform {
  constructor(total, cancellationToken, onProgress) {
    super();
    this.total = total;
    this.cancellationToken = cancellationToken;
    this.onProgress = onProgress;
    this.start = Date.now();
    this.transferred = 0;
    this.delta = 0;
    this.nextUpdate = this.start + 1e3;
  }
  _transform(chunk, encoding, callback) {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"), null);
      return;
    }
    this.transferred += chunk.length;
    this.delta += chunk.length;
    const now = Date.now();
    if (now >= this.nextUpdate && this.transferred !== this.total) {
      this.nextUpdate = now + 1e3;
      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.total * 100,
        bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
      });
      this.delta = 0;
    }
    callback(null, chunk);
  }
  _flush(callback) {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
    this.delta = 0;
    callback(null);
  }
}
ProgressCallbackTransform$1.ProgressCallbackTransform = ProgressCallbackTransform;
Object.defineProperty(httpExecutor, "__esModule", { value: true });
httpExecutor.DigestTransform = httpExecutor.HttpExecutor = httpExecutor.HttpError = void 0;
httpExecutor.addSensitiveRedirectHeader = addSensitiveRedirectHeader;
httpExecutor.addSensitiveFieldPattern = addSensitiveFieldPattern;
httpExecutor.createHttpError = createHttpError;
httpExecutor.parseJson = parseJson;
httpExecutor.configureRequestOptionsFromUrl = configureRequestOptionsFromUrl;
httpExecutor.configureRequestUrl = configureRequestUrl;
httpExecutor.safeGetHeader = safeGetHeader;
httpExecutor.configureRequestOptions = configureRequestOptions;
httpExecutor.isSensitiveFieldName = isSensitiveFieldName;
httpExecutor.hashSensitiveValue = hashSensitiveValue;
httpExecutor.safeStringifyJson = safeStringifyJson;
const crypto_1$4 = require$$0;
const debug_1$1 = srcExports;
const fs_1$5 = fs$j;
const stream_1$2 = require$$0$2;
const url_1$7 = require$$2$1;
const CancellationToken_1$1 = CancellationToken$1;
const error_1$2 = error;
const ProgressCallbackTransform_1 = ProgressCallbackTransform$1;
const debug$2 = (0, debug_1$1.default)("electron-builder");
const normalizeName = (name) => name.toLowerCase().replace(/[-_]/g, "");
const SENSITIVE_REDIRECT_HEADERS = /* @__PURE__ */ new Set(["authorization", "proxyauthorization", "privatetoken", "xapikey", "xauthtoken", "xaccesstoken", "xgitlabtoken", "cookie", "xcsrftoken"]);
const SENSITIVE_FIELD_PATTERNS = ["token", "password", "secret", "authorization", "credential", "apikey", "passphrase", "auth"];
const SENSITIVE_FIELD_SUFFIXES = ["key"];
function addSensitiveRedirectHeader(header) {
  SENSITIVE_REDIRECT_HEADERS.add(normalizeName(header));
}
function addSensitiveFieldPattern(pattern) {
  SENSITIVE_FIELD_PATTERNS.push(pattern.toLowerCase().replace(/[-_]/g, ""));
}
function createHttpError(response, description = null) {
  return new HttpError(response.statusCode || -1, `${response.statusCode} ${response.statusMessage}` + (description == null ? "" : "\n" + JSON.stringify(description, null, "  ")) + "\nHeaders: " + safeStringifyJson(response.headers), description);
}
const HTTP_STATUS_CODES = /* @__PURE__ */ new Map([
  [429, "Too many requests"],
  [400, "Bad request"],
  [403, "Forbidden"],
  [404, "Not found"],
  [405, "Method not allowed"],
  [406, "Not acceptable"],
  [408, "Request timeout"],
  [413, "Request entity too large"],
  [500, "Internal server error"],
  [502, "Bad gateway"],
  [503, "Service unavailable"],
  [504, "Gateway timeout"],
  [505, "HTTP version not supported"]
]);
class HttpError extends Error {
  constructor(statusCode, message = `HTTP error: ${HTTP_STATUS_CODES.get(statusCode) || statusCode}`, description = null) {
    super(message);
    this.statusCode = statusCode;
    this.description = description;
    this.name = "HttpError";
    this.code = `HTTP_ERROR_${statusCode}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
httpExecutor.HttpError = HttpError;
function parseJson(result) {
  return result.then((it) => it == null || it.length === 0 ? null : JSON.parse(it));
}
class HttpExecutor {
  constructor() {
    this.maxRedirects = 10;
  }
  request(options, cancellationToken = new CancellationToken_1$1.CancellationToken(), data) {
    configureRequestOptions(options);
    const json2 = data == null ? void 0 : JSON.stringify(data);
    const encodedData = json2 ? Buffer.from(json2) : void 0;
    if (encodedData != null) {
      if (debug$2.enabled) {
        debug$2(safeStringifyJson(data));
      }
      const { headers, ...opts } = options;
      options = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": encodedData.length,
          ...headers
        },
        ...opts
      };
    }
    return this.doApiRequest(options, cancellationToken, (it) => it.end(encodedData));
  }
  doApiRequest(options, cancellationToken, requestProcessor, redirectCount = 0) {
    if (debug$2.enabled) {
      const { headers: _headers, auth: _auth, ...safeOptions } = options;
      debug$2(`Request: ${safeStringifyJson(safeOptions)}`);
    }
    return cancellationToken.createPromise((resolve, reject, onCancel) => {
      const request = this.createRequest(options, (response) => {
        try {
          this.handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor);
        } catch (e) {
          reject(e);
        }
      });
      this.addErrorAndTimeoutHandlers(request, reject, options.timeout);
      this.addRedirectHandlers(request, options, reject, redirectCount, (options2) => {
        this.doApiRequest(options2, cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
      });
      requestProcessor(request, reject);
      onCancel(() => request.abort());
    });
  }
  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line
  addRedirectHandlers(request, options, reject, redirectCount, handler) {
  }
  addErrorAndTimeoutHandlers(request, reject, timeout = 60 * 1e3) {
    this.addTimeOutHandler(request, reject, timeout);
    request.on("error", reject);
    request.on("aborted", () => {
      reject(new Error("Request has been aborted by the server"));
    });
  }
  handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor) {
    var _a;
    if (debug$2.enabled) {
      const { headers: _headers, auth: _auth, ...safeOptions } = options;
      debug$2(`Response: ${response.statusCode} ${response.statusMessage}, request options: ${safeStringifyJson(safeOptions)}`);
    }
    if (response.statusCode === 404) {
      reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (response.statusCode === 204) {
      resolve();
      return;
    }
    const code = (_a = response.statusCode) !== null && _a !== void 0 ? _a : 0;
    const shouldRedirect = code >= 300 && code < 400;
    const redirectUrl = safeGetHeader(response, "location");
    if (shouldRedirect && redirectUrl != null) {
      if (redirectCount > this.maxRedirects) {
        reject(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options), cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
      return;
    }
    response.setEncoding("utf8");
    let data = "";
    response.on("error", reject);
    response.on("data", (chunk) => data += chunk);
    response.on("end", () => {
      try {
        if (response.statusCode != null && response.statusCode >= 400) {
          const contentType = safeGetHeader(response, "content-type");
          const isJson = contentType != null && (Array.isArray(contentType) ? contentType.find((it) => it.includes("json")) != null : contentType.includes("json"));
          reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

          Data:
          ${isJson ? safeStringifyJson(JSON.parse(data)) : data}
          `));
        } else {
          resolve(data.length === 0 ? null : data);
        }
      } catch (e) {
        reject(e);
      }
    });
  }
  async downloadToBuffer(url, options) {
    return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
      const responseChunks = [];
      const requestOptions = {
        headers: options.headers || void 0,
        // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
        redirect: "manual"
      };
      configureRequestUrl(url, requestOptions);
      configureRequestOptions(requestOptions);
      this.doDownload(requestOptions, {
        destination: null,
        options,
        onCancel,
        callback: (error2) => {
          if (error2 == null) {
            resolve(Buffer.concat(responseChunks));
          } else {
            reject(error2);
          }
        },
        responseHandler: (response, callback) => {
          let receivedLength = 0;
          response.on("data", (chunk) => {
            receivedLength += chunk.length;
            if (receivedLength > 524288e3) {
              callback(new Error("Maximum allowed size is 500 MB"));
              return;
            }
            responseChunks.push(chunk);
          });
          response.on("end", () => {
            callback(null);
          });
        }
      }, 0);
    });
  }
  doDownload(requestOptions, options, redirectCount) {
    const request = this.createRequest(requestOptions, (response) => {
      if (response.statusCode >= 400) {
        options.callback(new Error(`Cannot download "${requestOptions.protocol || "https:"}//${requestOptions.hostname}${requestOptions.path}", status ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      response.on("error", options.callback);
      const redirectUrl = safeGetHeader(response, "location");
      if (redirectUrl != null) {
        if (redirectCount < this.maxRedirects) {
          this.doDownload(HttpExecutor.prepareRedirectUrlOptions(redirectUrl, requestOptions), options, redirectCount++);
        } else {
          options.callback(this.createMaxRedirectError());
        }
        return;
      }
      if (options.responseHandler == null) {
        configurePipes(options, response);
      } else {
        options.responseHandler(response, options.callback);
      }
    });
    this.addErrorAndTimeoutHandlers(request, options.callback, requestOptions.timeout);
    this.addRedirectHandlers(request, requestOptions, options.callback, redirectCount, (requestOptions2) => {
      this.doDownload(requestOptions2, options, redirectCount++);
    });
    request.end();
  }
  createMaxRedirectError() {
    return new Error(`Too many redirects (> ${this.maxRedirects})`);
  }
  addTimeOutHandler(request, callback, timeout) {
    request.on("socket", (socket) => {
      socket.setTimeout(timeout, () => {
        request.abort();
        callback(new Error("Request timed out"));
      });
    });
  }
  static prepareRedirectUrlOptions(redirectUrl, options) {
    const newOptions = configureRequestOptionsFromUrl(redirectUrl, { ...options });
    const headers = newOptions.headers;
    if (headers == null) {
      return newOptions;
    }
    const originalUrl = HttpExecutor.reconstructOriginalUrl(options);
    const parsedRedirectUrl = parseUrl(redirectUrl, options);
    if (HttpExecutor.isCrossOriginRedirect(originalUrl, parsedRedirectUrl)) {
      if (debug$2.enabled) {
        debug$2(`Cross-origin redirect (${originalUrl.host} → ${parsedRedirectUrl.host}): stripping sensitive headers`);
      }
      for (const key of Object.keys(headers)) {
        if (SENSITIVE_REDIRECT_HEADERS.has(normalizeName(key))) {
          delete headers[key];
        }
      }
    }
    return newOptions;
  }
  static reconstructOriginalUrl(options) {
    const protocol = options.protocol || "https:";
    if (!options.hostname) {
      throw new Error("Missing hostname in request options");
    }
    const hostname = options.hostname;
    const port = options.port ? `:${options.port}` : "";
    const path2 = options.path || "/";
    return new url_1$7.URL(`${protocol}//${hostname}${port}${path2}`);
  }
  static isCrossOriginRedirect(originalUrl, redirectUrl) {
    if (originalUrl.hostname.toLowerCase() !== redirectUrl.hostname.toLowerCase()) {
      return true;
    }
    if (originalUrl.protocol === "http:" && // This can be replaced with `!originalUrl.port`, but for the sake of clarity.
    ["80", ""].includes(originalUrl.port) && redirectUrl.protocol === "https:" && // This can be replaced with `!redirectUrl.port`, but for the sake of clarity.
    ["443", ""].includes(redirectUrl.port)) {
      return false;
    }
    if (originalUrl.protocol !== redirectUrl.protocol) {
      return true;
    }
    const originalPort = originalUrl.port;
    const redirectPort = redirectUrl.port;
    return originalPort !== redirectPort;
  }
  static async retryOnServerError(task, maxRetries = 3) {
    for (let attemptNumber = 0; ; attemptNumber++) {
      try {
        return await task();
      } catch (e) {
        if (attemptNumber < maxRetries && (e instanceof HttpError && e.isServerError() || e.code === "EPIPE")) {
          await new Promise((r) => setTimeout(r, 1e3 * (attemptNumber + 1)));
          continue;
        }
        throw e;
      }
    }
  }
}
httpExecutor.HttpExecutor = HttpExecutor;
function parseUrl(url, options) {
  try {
    return new url_1$7.URL(url);
  } catch {
    const hostname = options.hostname;
    const protocol = options.protocol || "https:";
    const port = options.port ? `:${options.port}` : "";
    const baseUrl = `${protocol}//${hostname}${port}`;
    return new url_1$7.URL(url, baseUrl);
  }
}
function configureRequestOptionsFromUrl(url, options) {
  const result = configureRequestOptions(options);
  const parsedUrl = parseUrl(url, options);
  configureRequestUrl(parsedUrl, result);
  return result;
}
function configureRequestUrl(url, options) {
  options.protocol = url.protocol;
  options.hostname = url.hostname;
  if (url.port) {
    options.port = url.port;
  } else if (options.port) {
    delete options.port;
  }
  options.path = url.pathname + url.search;
}
class DigestTransform extends stream_1$2.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(expected, algorithm = "sha512", encoding = "base64") {
    super();
    this.expected = expected;
    this.algorithm = algorithm;
    this.encoding = encoding;
    this._actual = null;
    this.isValidateOnEnd = true;
    this.digester = (0, crypto_1$4.createHash)(algorithm);
  }
  // noinspection JSUnusedGlobalSymbols
  _transform(chunk, encoding, callback) {
    this.digester.update(chunk);
    callback(null, chunk);
  }
  // noinspection JSUnusedGlobalSymbols
  _flush(callback) {
    this._actual = this.digester.digest(this.encoding);
    if (this.isValidateOnEnd) {
      try {
        this.validate();
      } catch (e) {
        callback(e);
        return;
      }
    }
    callback(null);
  }
  validate() {
    if (this._actual == null) {
      throw (0, error_1$2.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    }
    if (this._actual !== this.expected) {
      throw (0, error_1$2.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    }
    return null;
  }
}
httpExecutor.DigestTransform = DigestTransform;
function checkSha2(sha2Header, sha2, callback) {
  if (sha2Header != null && sha2 != null && sha2Header !== sha2) {
    callback(new Error(`checksum mismatch: expected ${sha2} but got ${sha2Header} (X-Checksum-Sha2 header)`));
    return false;
  }
  return true;
}
function safeGetHeader(response, headerKey) {
  const value = response.headers[headerKey];
  if (value == null) {
    return null;
  } else if (Array.isArray(value)) {
    return value.length === 0 ? null : value[value.length - 1];
  } else {
    return value;
  }
}
function configurePipes(options, response) {
  if (!checkSha2(safeGetHeader(response, "X-Checksum-Sha2"), options.options.sha2, options.callback)) {
    return;
  }
  const streams = [];
  if (options.options.onProgress != null) {
    const contentLength = safeGetHeader(response, "content-length");
    if (contentLength != null) {
      streams.push(new ProgressCallbackTransform_1.ProgressCallbackTransform(parseInt(contentLength, 10), options.options.cancellationToken, options.options.onProgress));
    }
  }
  const sha512 = options.options.sha512;
  if (sha512 != null) {
    streams.push(new DigestTransform(sha512, "sha512", sha512.length === 128 && !sha512.includes("+") && !sha512.includes("Z") && !sha512.includes("=") ? "hex" : "base64"));
  } else if (options.options.sha2 != null) {
    streams.push(new DigestTransform(options.options.sha2, "sha256", "hex"));
  }
  const fileOut = (0, fs_1$5.createWriteStream)(options.destination);
  streams.push(fileOut);
  let lastStream = response;
  for (const stream of streams) {
    stream.on("error", (error2) => {
      fileOut.close();
      if (!options.options.cancellationToken.cancelled) {
        options.callback(error2);
      }
    });
    lastStream = lastStream.pipe(stream);
  }
  fileOut.on("finish", () => {
    fileOut.close(options.callback);
  });
}
function configureRequestOptions(options, token, method) {
  if (method != null) {
    options.method = method;
  }
  options.headers = { ...options.headers };
  const headers = options.headers;
  if (token != null) {
    headers.authorization = token.startsWith("Basic") || token.startsWith("Bearer") ? token : `token ${token}`;
  }
  if (headers["User-Agent"] == null) {
    headers["User-Agent"] = "electron-builder";
  }
  if (method == null || method === "GET" || headers["Cache-Control"] == null) {
    headers["Cache-Control"] = "no-cache";
  }
  if (options.protocol == null && process.versions.electron != null) {
    options.protocol = "https:";
  }
  return options;
}
function isSensitiveFieldName(name) {
  const normalized = normalizeName(name);
  return SENSITIVE_FIELD_PATTERNS.some((p) => normalized.includes(p)) || SENSITIVE_FIELD_SUFFIXES.some((s) => normalized.endsWith(s));
}
function hashSensitiveValue(value) {
  return `${(0, crypto_1$4.createHash)("sha256").update(value).digest("hex")} (sha256 hash)`;
}
function safeStringifyJson(data, skippedNames) {
  return JSON.stringify(data, (name, value) => {
    if (isSensitiveFieldName(name) || skippedNames != null && skippedNames.has(name)) {
      return typeof value === "string" ? hashSensitiveValue(value) : "<stripped sensitive data>";
    }
    return value;
  }, 2);
}
var MemoLazy$1 = {};
Object.defineProperty(MemoLazy$1, "__esModule", { value: true });
MemoLazy$1.MemoLazy = void 0;
class MemoLazy {
  constructor(selector, creator) {
    this.selector = selector;
    this.creator = creator;
    this.selected = void 0;
    this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const selected = this.selector();
    if (this._value !== void 0 && equals(this.selected, selected)) {
      return this._value;
    }
    this.selected = selected;
    const result = this.creator(selected);
    this.value = result;
    return result;
  }
  set value(value) {
    this._value = value;
  }
}
MemoLazy$1.MemoLazy = MemoLazy;
function equals(firstValue, secondValue) {
  const isFirstObject = typeof firstValue === "object" && firstValue !== null;
  const isSecondObject = typeof secondValue === "object" && secondValue !== null;
  if (isFirstObject && isSecondObject) {
    const keys1 = Object.keys(firstValue);
    const keys2 = Object.keys(secondValue);
    return keys1.length === keys2.length && keys1.every((key) => equals(firstValue[key], secondValue[key]));
  }
  return firstValue === secondValue;
}
var publishOptions = {};
Object.defineProperty(publishOptions, "__esModule", { value: true });
publishOptions.githubUrl = githubUrl;
publishOptions.githubTagPrefix = githubTagPrefix;
publishOptions.getS3LikeProviderBaseUrl = getS3LikeProviderBaseUrl;
function githubUrl(options, defaultHost = "github.com") {
  return `${options.protocol || "https"}://${options.host || defaultHost}`;
}
function githubTagPrefix(options) {
  var _a;
  if (options.tagNamePrefix) {
    return options.tagNamePrefix;
  }
  if ((_a = options.vPrefixedTagName) !== null && _a !== void 0 ? _a : true) {
    return "v";
  }
  return "";
}
function getS3LikeProviderBaseUrl(configuration) {
  const provider = configuration.provider;
  if (provider === "s3") {
    return s3Url(configuration);
  }
  if (provider === "spaces") {
    return spacesUrl(configuration);
  }
  throw new Error(`Not supported provider: ${provider}`);
}
function s3Url(options) {
  let url;
  if (options.accelerate == true) {
    url = `https://${options.bucket}.s3-accelerate.amazonaws.com`;
  } else if (options.endpoint != null) {
    url = `${options.endpoint}/${options.bucket}`;
  } else if (options.bucket.includes(".")) {
    if (options.region == null) {
      throw new Error(`Bucket name "${options.bucket}" includes a dot, but S3 region is missing`);
    }
    if (options.region === "us-east-1") {
      url = `https://s3.amazonaws.com/${options.bucket}`;
    } else {
      url = `https://s3-${options.region}.amazonaws.com/${options.bucket}`;
    }
  } else if (options.region === "cn-north-1") {
    url = `https://${options.bucket}.s3.${options.region}.amazonaws.com.cn`;
  } else {
    url = `https://${options.bucket}.s3.amazonaws.com`;
  }
  return appendPath(url, options.path);
}
function appendPath(url, p) {
  if (p != null && p.length > 0) {
    if (!p.startsWith("/")) {
      url += "/";
    }
    url += p;
  }
  return url;
}
function spacesUrl(options) {
  if (options.name == null) {
    throw new Error(`name is missing`);
  }
  if (options.region == null) {
    throw new Error(`region is missing`);
  }
  return appendPath(`https://${options.name}.${options.region}.digitaloceanspaces.com`, options.path);
}
var retry$1 = {};
Object.defineProperty(retry$1, "__esModule", { value: true });
retry$1.retry = retry;
const CancellationToken_1 = CancellationToken$1;
async function retry(task, options) {
  var _a;
  const { retries: retryCount, interval, backoff = 0, attempt = 0, shouldRetry, cancellationToken = new CancellationToken_1.CancellationToken() } = options;
  try {
    return await task();
  } catch (error2) {
    if (await Promise.resolve((_a = shouldRetry === null || shouldRetry === void 0 ? void 0 : shouldRetry(error2)) !== null && _a !== void 0 ? _a : true) && retryCount > 0 && !cancellationToken.cancelled) {
      await new Promise((resolve) => setTimeout(resolve, interval + backoff * attempt));
      return await retry(task, { ...options, retries: retryCount - 1, attempt: attempt + 1 });
    } else {
      throw error2;
    }
  }
}
var rfc2253Parser = {};
Object.defineProperty(rfc2253Parser, "__esModule", { value: true });
rfc2253Parser.parseDn = parseDn;
function parseDn(seq2) {
  let quoted = false;
  let key = null;
  let token = "";
  let nextNonSpace = 0;
  seq2 = seq2.trim();
  const result = /* @__PURE__ */ new Map();
  for (let i = 0; i <= seq2.length; i++) {
    if (i === seq2.length) {
      if (key !== null) {
        result.set(key, token);
      }
      break;
    }
    const ch = seq2[i];
    if (quoted) {
      if (ch === '"') {
        quoted = false;
        continue;
      }
    } else {
      if (ch === '"') {
        quoted = true;
        continue;
      }
      if (ch === "\\") {
        i++;
        const ord = parseInt(seq2.slice(i, i + 2), 16);
        if (Number.isNaN(ord)) {
          token += seq2[i];
        } else {
          i++;
          token += String.fromCharCode(ord);
        }
        continue;
      }
      if (key === null && ch === "=") {
        key = token;
        token = "";
        continue;
      }
      if (ch === "," || ch === ";" || ch === "+") {
        if (key !== null) {
          result.set(key, token);
        }
        key = null;
        token = "";
        continue;
      }
    }
    if (ch === " " && !quoted) {
      if (token.length === 0) {
        continue;
      }
      if (i > nextNonSpace) {
        let j = i;
        while (seq2[j] === " ") {
          j++;
        }
        nextNonSpace = j;
      }
      if (nextNonSpace >= seq2.length || seq2[nextNonSpace] === "," || seq2[nextNonSpace] === ";" || key === null && seq2[nextNonSpace] === "=" || key !== null && seq2[nextNonSpace] === "+") {
        i = nextNonSpace - 1;
        continue;
      }
    }
    token += ch;
  }
  return result;
}
var uuid = {};
Object.defineProperty(uuid, "__esModule", { value: true });
uuid.nil = uuid.UUID = void 0;
const crypto_1$3 = require$$0;
const error_1$1 = error;
const invalidName = "options.name must be either a string or a Buffer";
const randomHost = (0, crypto_1$3.randomBytes)(16);
randomHost[0] = randomHost[0] | 1;
const hex2byte = {};
const byte2hex = [];
for (let i = 0; i < 256; i++) {
  const hex = (i + 256).toString(16).substr(1);
  hex2byte[hex] = i;
  byte2hex[i] = hex;
}
class UUID {
  constructor(uuid2) {
    this.ascii = null;
    this.binary = null;
    const check = UUID.check(uuid2);
    if (!check) {
      throw new Error("not a UUID");
    }
    this.version = check.version;
    if (check.format === "ascii") {
      this.ascii = uuid2;
    } else {
      this.binary = uuid2;
    }
  }
  static v5(name, namespace) {
    return uuidNamed(name, "sha1", 80, namespace);
  }
  toString() {
    if (this.ascii == null) {
      this.ascii = stringify(this.binary);
    }
    return this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(uuid2, offset = 0) {
    if (typeof uuid2 === "string") {
      uuid2 = uuid2.toLowerCase();
      if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(uuid2)) {
        return false;
      }
      if (uuid2 === "00000000-0000-0000-0000-000000000000") {
        return { version: void 0, variant: "nil", format: "ascii" };
      }
      return {
        version: (hex2byte[uuid2[14] + uuid2[15]] & 240) >> 4,
        variant: getVariant((hex2byte[uuid2[19] + uuid2[20]] & 224) >> 5),
        format: "ascii"
      };
    }
    if (Buffer.isBuffer(uuid2)) {
      if (uuid2.length < offset + 16) {
        return false;
      }
      let i = 0;
      for (; i < 16; i++) {
        if (uuid2[offset + i] !== 0) {
          break;
        }
      }
      if (i === 16) {
        return { version: void 0, variant: "nil", format: "binary" };
      }
      return {
        version: (uuid2[offset + 6] & 240) >> 4,
        variant: getVariant((uuid2[offset + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, error_1$1.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
  }
  // read stringified uuid into a Buffer
  static parse(input) {
    const buffer = Buffer.allocUnsafe(16);
    let j = 0;
    for (let i = 0; i < 16; i++) {
      buffer[i] = hex2byte[input[j++] + input[j++]];
      if (i === 3 || i === 5 || i === 7 || i === 9) {
        j += 1;
      }
    }
    return buffer;
  }
}
uuid.UUID = UUID;
UUID.OID = UUID.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function getVariant(bits) {
  switch (bits) {
    case 0:
    case 1:
    case 3:
      return "ncs";
    case 4:
    case 5:
      return "rfc4122";
    case 6:
      return "microsoft";
    default:
      return "future";
  }
}
var UuidEncoding;
(function(UuidEncoding2) {
  UuidEncoding2[UuidEncoding2["ASCII"] = 0] = "ASCII";
  UuidEncoding2[UuidEncoding2["BINARY"] = 1] = "BINARY";
  UuidEncoding2[UuidEncoding2["OBJECT"] = 2] = "OBJECT";
})(UuidEncoding || (UuidEncoding = {}));
function uuidNamed(name, hashMethod, version, namespace, encoding = UuidEncoding.ASCII) {
  const hash2 = (0, crypto_1$3.createHash)(hashMethod);
  const nameIsNotAString = typeof name !== "string";
  if (nameIsNotAString && !Buffer.isBuffer(name)) {
    throw (0, error_1$1.newError)(invalidName, "ERR_INVALID_UUID_NAME");
  }
  hash2.update(namespace);
  hash2.update(name);
  const buffer = hash2.digest();
  let result;
  switch (encoding) {
    case UuidEncoding.BINARY:
      buffer[6] = buffer[6] & 15 | version;
      buffer[8] = buffer[8] & 63 | 128;
      result = buffer;
      break;
    case UuidEncoding.OBJECT:
      buffer[6] = buffer[6] & 15 | version;
      buffer[8] = buffer[8] & 63 | 128;
      result = new UUID(buffer);
      break;
    default:
      result = byte2hex[buffer[0]] + byte2hex[buffer[1]] + byte2hex[buffer[2]] + byte2hex[buffer[3]] + "-" + byte2hex[buffer[4]] + byte2hex[buffer[5]] + "-" + byte2hex[buffer[6] & 15 | version] + byte2hex[buffer[7]] + "-" + byte2hex[buffer[8] & 63 | 128] + byte2hex[buffer[9]] + "-" + byte2hex[buffer[10]] + byte2hex[buffer[11]] + byte2hex[buffer[12]] + byte2hex[buffer[13]] + byte2hex[buffer[14]] + byte2hex[buffer[15]];
      break;
  }
  return result;
}
function stringify(buffer) {
  return byte2hex[buffer[0]] + byte2hex[buffer[1]] + byte2hex[buffer[2]] + byte2hex[buffer[3]] + "-" + byte2hex[buffer[4]] + byte2hex[buffer[5]] + "-" + byte2hex[buffer[6]] + byte2hex[buffer[7]] + "-" + byte2hex[buffer[8]] + byte2hex[buffer[9]] + "-" + byte2hex[buffer[10]] + byte2hex[buffer[11]] + byte2hex[buffer[12]] + byte2hex[buffer[13]] + byte2hex[buffer[14]] + byte2hex[buffer[15]];
}
uuid.nil = new UUID("00000000-0000-0000-0000-000000000000");
var xml = {};
var sax$1 = {};
(function(exports) {
  (function(sax2) {
    sax2.parser = function(strict, opt) {
      return new SAXParser(strict, opt);
    };
    sax2.SAXParser = SAXParser;
    sax2.SAXStream = SAXStream;
    sax2.createStream = createStream;
    sax2.MAX_BUFFER_LENGTH = 64 * 1024;
    var buffers = [
      "comment",
      "sgmlDecl",
      "textNode",
      "tagName",
      "doctype",
      "procInstName",
      "procInstBody",
      "entity",
      "attribName",
      "attribValue",
      "cdata",
      "script"
    ];
    sax2.EVENTS = [
      "text",
      "processinginstruction",
      "sgmldeclaration",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "opencdata",
      "cdata",
      "closecdata",
      "error",
      "end",
      "ready",
      "script",
      "opennamespace",
      "closenamespace"
    ];
    function SAXParser(strict, opt) {
      if (!(this instanceof SAXParser)) {
        return new SAXParser(strict, opt);
      }
      var parser = this;
      clearBuffers(parser);
      parser.q = parser.c = "";
      parser.bufferCheckPosition = sax2.MAX_BUFFER_LENGTH;
      parser.encoding = null;
      parser.opt = opt || {};
      parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
      parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
      parser.opt.maxEntityCount = parser.opt.maxEntityCount || 512;
      parser.opt.maxEntityDepth = parser.opt.maxEntityDepth || 4;
      parser.entityCount = parser.entityDepth = 0;
      parser.tags = [];
      parser.closed = parser.closedRoot = parser.sawRoot = false;
      parser.tag = parser.error = null;
      parser.strict = !!strict;
      parser.noscript = !!(strict || parser.opt.noscript);
      parser.state = S.BEGIN;
      parser.strictEntities = parser.opt.strictEntities;
      parser.ENTITIES = parser.strictEntities ? Object.create(sax2.XML_ENTITIES) : Object.create(sax2.ENTITIES);
      parser.attribList = [];
      if (parser.opt.xmlns) {
        parser.ns = Object.create(rootNS);
      }
      if (parser.opt.unquotedAttributeValues === void 0) {
        parser.opt.unquotedAttributeValues = !strict;
      }
      parser.trackPosition = parser.opt.position !== false;
      if (parser.trackPosition) {
        parser.position = parser.line = parser.column = 0;
      }
      emit(parser, "onready");
    }
    if (!Object.create) {
      Object.create = function(o) {
        function F() {
        }
        F.prototype = o;
        var newf = new F();
        return newf;
      };
    }
    if (!Object.keys) {
      Object.keys = function(o) {
        var a = [];
        for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
        return a;
      };
    }
    function checkBufferLength(parser) {
      var maxAllowed = Math.max(sax2.MAX_BUFFER_LENGTH, 10);
      var maxActual = 0;
      for (var i = 0, l = buffers.length; i < l; i++) {
        var len = parser[buffers[i]].length;
        if (len > maxAllowed) {
          switch (buffers[i]) {
            case "textNode":
              closeText(parser);
              break;
            case "cdata":
              emitNode(parser, "oncdata", parser.cdata);
              parser.cdata = "";
              break;
            case "script":
              emitNode(parser, "onscript", parser.script);
              parser.script = "";
              break;
            default:
              error2(parser, "Max buffer length exceeded: " + buffers[i]);
          }
        }
        maxActual = Math.max(maxActual, len);
      }
      var m = sax2.MAX_BUFFER_LENGTH - maxActual;
      parser.bufferCheckPosition = m + parser.position;
    }
    function clearBuffers(parser) {
      for (var i = 0, l = buffers.length; i < l; i++) {
        parser[buffers[i]] = "";
      }
    }
    function flushBuffers(parser) {
      closeText(parser);
      if (parser.cdata !== "") {
        emitNode(parser, "oncdata", parser.cdata);
        parser.cdata = "";
      }
      if (parser.script !== "") {
        emitNode(parser, "onscript", parser.script);
        parser.script = "";
      }
    }
    SAXParser.prototype = {
      end: function() {
        end(this);
      },
      write,
      resume: function() {
        this.error = null;
        return this;
      },
      close: function() {
        return this.write(null);
      },
      flush: function() {
        flushBuffers(this);
      }
    };
    var Stream2;
    try {
      Stream2 = require("stream").Stream;
    } catch (ex) {
      Stream2 = function() {
      };
    }
    if (!Stream2) Stream2 = function() {
    };
    var streamWraps = sax2.EVENTS.filter(function(ev) {
      return ev !== "error" && ev !== "end";
    });
    function createStream(strict, opt) {
      return new SAXStream(strict, opt);
    }
    function determineBufferEncoding(data, isEnd) {
      if (data.length >= 2) {
        if (data[0] === 255 && data[1] === 254) {
          return "utf-16le";
        }
        if (data[0] === 254 && data[1] === 255) {
          return "utf-16be";
        }
      }
      if (data.length >= 3 && data[0] === 239 && data[1] === 187 && data[2] === 191) {
        return "utf8";
      }
      if (data.length >= 4) {
        if (data[0] === 60 && data[1] === 0 && data[2] === 63 && data[3] === 0) {
          return "utf-16le";
        }
        if (data[0] === 0 && data[1] === 60 && data[2] === 0 && data[3] === 63) {
          return "utf-16be";
        }
        return "utf8";
      }
      return isEnd ? "utf8" : null;
    }
    function SAXStream(strict, opt) {
      if (!(this instanceof SAXStream)) {
        return new SAXStream(strict, opt);
      }
      Stream2.apply(this);
      this._parser = new SAXParser(strict, opt);
      this.writable = true;
      this.readable = true;
      var me = this;
      this._parser.onend = function() {
        me.emit("end");
      };
      this._parser.onerror = function(er) {
        me.emit("error", er);
        me._parser.error = null;
      };
      this._decoder = null;
      this._decoderBuffer = null;
      streamWraps.forEach(function(ev) {
        Object.defineProperty(me, "on" + ev, {
          get: function() {
            return me._parser["on" + ev];
          },
          set: function(h) {
            if (!h) {
              me.removeAllListeners(ev);
              me._parser["on" + ev] = h;
              return h;
            }
            me.on(ev, h);
          },
          enumerable: true,
          configurable: false
        });
      });
    }
    SAXStream.prototype = Object.create(Stream2.prototype, {
      constructor: {
        value: SAXStream
      }
    });
    SAXStream.prototype._decodeBuffer = function(data, isEnd) {
      if (this._decoderBuffer) {
        data = Buffer.concat([this._decoderBuffer, data]);
        this._decoderBuffer = null;
      }
      if (!this._decoder) {
        var encoding = determineBufferEncoding(data, isEnd);
        if (!encoding) {
          this._decoderBuffer = data;
          return "";
        }
        this._parser.encoding = encoding;
        this._decoder = new TextDecoder(encoding);
      }
      return this._decoder.decode(data, { stream: !isEnd });
    };
    SAXStream.prototype.write = function(data) {
      if (typeof Buffer === "function" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(data)) {
        data = this._decodeBuffer(data, false);
      } else if (this._decoderBuffer) {
        var remaining = this._decodeBuffer(Buffer.alloc(0), true);
        if (remaining) {
          this._parser.write(remaining);
          this.emit("data", remaining);
        }
      }
      this._parser.write(data.toString());
      this.emit("data", data);
      return true;
    };
    SAXStream.prototype.end = function(chunk) {
      if (chunk && chunk.length) {
        this.write(chunk);
      }
      if (this._decoderBuffer) {
        var finalChunk = this._decodeBuffer(Buffer.alloc(0), true);
        if (finalChunk) {
          this._parser.write(finalChunk);
          this.emit("data", finalChunk);
        }
      } else if (this._decoder) {
        var remaining = this._decoder.decode();
        if (remaining) {
          this._parser.write(remaining);
          this.emit("data", remaining);
        }
      }
      this._parser.end();
      return true;
    };
    SAXStream.prototype.on = function(ev, handler) {
      var me = this;
      if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) {
        me._parser["on" + ev] = function() {
          var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
          args.splice(0, 0, ev);
          me.emit.apply(me, args);
        };
      }
      return Stream2.prototype.on.call(me, ev, handler);
    };
    var CDATA = "[CDATA[";
    var DOCTYPE = "DOCTYPE";
    var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
    var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
    var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };
    var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
    var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
    var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    function isWhitespace2(c) {
      return c === " " || c === "\n" || c === "\r" || c === "	";
    }
    function isQuote(c) {
      return c === '"' || c === "'";
    }
    function isAttribEnd(c) {
      return c === ">" || isWhitespace2(c);
    }
    function isMatch(regex, c) {
      return regex.test(c);
    }
    function notMatch(regex, c) {
      return !isMatch(regex, c);
    }
    var S = 0;
    sax2.STATE = {
      BEGIN: S++,
      // leading byte order mark or whitespace
      BEGIN_WHITESPACE: S++,
      // leading whitespace
      TEXT: S++,
      // general stuff
      TEXT_ENTITY: S++,
      // &amp and such.
      OPEN_WAKA: S++,
      // <
      SGML_DECL: S++,
      // <!BLARG
      SGML_DECL_QUOTED: S++,
      // <!BLARG foo "bar
      DOCTYPE: S++,
      // <!DOCTYPE
      DOCTYPE_QUOTED: S++,
      // <!DOCTYPE "//blah
      DOCTYPE_DTD: S++,
      // <!DOCTYPE "//blah" [ ...
      DOCTYPE_DTD_QUOTED: S++,
      // <!DOCTYPE "//blah" [ "foo
      COMMENT_STARTING: S++,
      // <!-
      COMMENT: S++,
      // <!--
      COMMENT_ENDING: S++,
      // <!-- blah -
      COMMENT_ENDED: S++,
      // <!-- blah --
      CDATA: S++,
      // <![CDATA[ something
      CDATA_ENDING: S++,
      // ]
      CDATA_ENDING_2: S++,
      // ]]
      PROC_INST: S++,
      // <?hi
      PROC_INST_BODY: S++,
      // <?hi there
      PROC_INST_ENDING: S++,
      // <?hi "there" ?
      OPEN_TAG: S++,
      // <strong
      OPEN_TAG_SLASH: S++,
      // <strong /
      ATTRIB: S++,
      // <a
      ATTRIB_NAME: S++,
      // <a foo
      ATTRIB_NAME_SAW_WHITE: S++,
      // <a foo _
      ATTRIB_VALUE: S++,
      // <a foo=
      ATTRIB_VALUE_QUOTED: S++,
      // <a foo="bar
      ATTRIB_VALUE_CLOSED: S++,
      // <a foo="bar"
      ATTRIB_VALUE_UNQUOTED: S++,
      // <a foo=bar
      ATTRIB_VALUE_ENTITY_Q: S++,
      // <foo bar="&quot;"
      ATTRIB_VALUE_ENTITY_U: S++,
      // <foo bar=&quot
      CLOSE_TAG: S++,
      // </a
      CLOSE_TAG_SAW_WHITE: S++,
      // </a   >
      SCRIPT: S++,
      // <script> ...
      SCRIPT_ENDING: S++
      // <script> ... <
    };
    sax2.XML_ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    };
    sax2.ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'",
      AElig: 198,
      Aacute: 193,
      Acirc: 194,
      Agrave: 192,
      Aring: 197,
      Atilde: 195,
      Auml: 196,
      Ccedil: 199,
      ETH: 208,
      Eacute: 201,
      Ecirc: 202,
      Egrave: 200,
      Euml: 203,
      Iacute: 205,
      Icirc: 206,
      Igrave: 204,
      Iuml: 207,
      Ntilde: 209,
      Oacute: 211,
      Ocirc: 212,
      Ograve: 210,
      Oslash: 216,
      Otilde: 213,
      Ouml: 214,
      THORN: 222,
      Uacute: 218,
      Ucirc: 219,
      Ugrave: 217,
      Uuml: 220,
      Yacute: 221,
      aacute: 225,
      acirc: 226,
      aelig: 230,
      agrave: 224,
      aring: 229,
      atilde: 227,
      auml: 228,
      ccedil: 231,
      eacute: 233,
      ecirc: 234,
      egrave: 232,
      eth: 240,
      euml: 235,
      iacute: 237,
      icirc: 238,
      igrave: 236,
      iuml: 239,
      ntilde: 241,
      oacute: 243,
      ocirc: 244,
      ograve: 242,
      oslash: 248,
      otilde: 245,
      ouml: 246,
      szlig: 223,
      thorn: 254,
      uacute: 250,
      ucirc: 251,
      ugrave: 249,
      uuml: 252,
      yacute: 253,
      yuml: 255,
      copy: 169,
      reg: 174,
      nbsp: 160,
      iexcl: 161,
      cent: 162,
      pound: 163,
      curren: 164,
      yen: 165,
      brvbar: 166,
      sect: 167,
      uml: 168,
      ordf: 170,
      laquo: 171,
      not: 172,
      shy: 173,
      macr: 175,
      deg: 176,
      plusmn: 177,
      sup1: 185,
      sup2: 178,
      sup3: 179,
      acute: 180,
      micro: 181,
      para: 182,
      middot: 183,
      cedil: 184,
      ordm: 186,
      raquo: 187,
      frac14: 188,
      frac12: 189,
      frac34: 190,
      iquest: 191,
      times: 215,
      divide: 247,
      OElig: 338,
      oelig: 339,
      Scaron: 352,
      scaron: 353,
      Yuml: 376,
      fnof: 402,
      circ: 710,
      tilde: 732,
      Alpha: 913,
      Beta: 914,
      Gamma: 915,
      Delta: 916,
      Epsilon: 917,
      Zeta: 918,
      Eta: 919,
      Theta: 920,
      Iota: 921,
      Kappa: 922,
      Lambda: 923,
      Mu: 924,
      Nu: 925,
      Xi: 926,
      Omicron: 927,
      Pi: 928,
      Rho: 929,
      Sigma: 931,
      Tau: 932,
      Upsilon: 933,
      Phi: 934,
      Chi: 935,
      Psi: 936,
      Omega: 937,
      alpha: 945,
      beta: 946,
      gamma: 947,
      delta: 948,
      epsilon: 949,
      zeta: 950,
      eta: 951,
      theta: 952,
      iota: 953,
      kappa: 954,
      lambda: 955,
      mu: 956,
      nu: 957,
      xi: 958,
      omicron: 959,
      pi: 960,
      rho: 961,
      sigmaf: 962,
      sigma: 963,
      tau: 964,
      upsilon: 965,
      phi: 966,
      chi: 967,
      psi: 968,
      omega: 969,
      thetasym: 977,
      upsih: 978,
      piv: 982,
      ensp: 8194,
      emsp: 8195,
      thinsp: 8201,
      zwnj: 8204,
      zwj: 8205,
      lrm: 8206,
      rlm: 8207,
      ndash: 8211,
      mdash: 8212,
      lsquo: 8216,
      rsquo: 8217,
      sbquo: 8218,
      ldquo: 8220,
      rdquo: 8221,
      bdquo: 8222,
      dagger: 8224,
      Dagger: 8225,
      bull: 8226,
      hellip: 8230,
      permil: 8240,
      prime: 8242,
      Prime: 8243,
      lsaquo: 8249,
      rsaquo: 8250,
      oline: 8254,
      frasl: 8260,
      euro: 8364,
      image: 8465,
      weierp: 8472,
      real: 8476,
      trade: 8482,
      alefsym: 8501,
      larr: 8592,
      uarr: 8593,
      rarr: 8594,
      darr: 8595,
      harr: 8596,
      crarr: 8629,
      lArr: 8656,
      uArr: 8657,
      rArr: 8658,
      dArr: 8659,
      hArr: 8660,
      forall: 8704,
      part: 8706,
      exist: 8707,
      empty: 8709,
      nabla: 8711,
      isin: 8712,
      notin: 8713,
      ni: 8715,
      prod: 8719,
      sum: 8721,
      minus: 8722,
      lowast: 8727,
      radic: 8730,
      prop: 8733,
      infin: 8734,
      ang: 8736,
      and: 8743,
      or: 8744,
      cap: 8745,
      cup: 8746,
      int: 8747,
      there4: 8756,
      sim: 8764,
      cong: 8773,
      asymp: 8776,
      ne: 8800,
      equiv: 8801,
      le: 8804,
      ge: 8805,
      sub: 8834,
      sup: 8835,
      nsub: 8836,
      sube: 8838,
      supe: 8839,
      oplus: 8853,
      otimes: 8855,
      perp: 8869,
      sdot: 8901,
      lceil: 8968,
      rceil: 8969,
      lfloor: 8970,
      rfloor: 8971,
      lang: 9001,
      rang: 9002,
      loz: 9674,
      spades: 9824,
      clubs: 9827,
      hearts: 9829,
      diams: 9830
    };
    Object.keys(sax2.ENTITIES).forEach(function(key) {
      var e = sax2.ENTITIES[key];
      var s2 = typeof e === "number" ? String.fromCharCode(e) : e;
      sax2.ENTITIES[key] = s2;
    });
    for (var s in sax2.STATE) {
      sax2.STATE[sax2.STATE[s]] = s;
    }
    S = sax2.STATE;
    function emit(parser, event, data) {
      parser[event] && parser[event](data);
    }
    function getDeclaredEncoding(body) {
      var match = body && body.match(/(?:^|\s)encoding\s*=\s*(['"])([^'"]+)\1/i);
      return match ? match[2] : null;
    }
    function normalizeEncodingName(encoding) {
      if (!encoding) {
        return null;
      }
      return encoding.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    function encodingsMatch(detectedEncoding, declaredEncoding) {
      const detected = normalizeEncodingName(detectedEncoding);
      const declared = normalizeEncodingName(declaredEncoding);
      if (!detected || !declared) {
        return true;
      }
      if (declared === "utf16") {
        return detected === "utf16le" || detected === "utf16be";
      }
      return detected === declared;
    }
    function validateXmlDeclarationEncoding(parser, data) {
      if (!parser.strict || !parser.encoding || !data || data.name !== "xml") {
        return;
      }
      var declaredEncoding = getDeclaredEncoding(data.body);
      if (declaredEncoding && !encodingsMatch(parser.encoding, declaredEncoding)) {
        strictFail(
          parser,
          "XML declaration encoding " + declaredEncoding + " does not match detected stream encoding " + parser.encoding.toUpperCase()
        );
      }
    }
    function emitNode(parser, nodeType, data) {
      if (parser.textNode) closeText(parser);
      emit(parser, nodeType, data);
    }
    function closeText(parser) {
      parser.textNode = textopts(parser.opt, parser.textNode);
      if (parser.textNode) emit(parser, "ontext", parser.textNode);
      parser.textNode = "";
    }
    function textopts(opt, text) {
      if (opt.trim) text = text.trim();
      if (opt.normalize) text = text.replace(/\s+/g, " ");
      return text;
    }
    function error2(parser, er) {
      closeText(parser);
      if (parser.trackPosition) {
        er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c;
      }
      er = new Error(er);
      parser.error = er;
      emit(parser, "onerror", er);
      return parser;
    }
    function end(parser) {
      if (parser.sawRoot && !parser.closedRoot)
        strictFail(parser, "Unclosed root tag");
      if (parser.state !== S.BEGIN && parser.state !== S.BEGIN_WHITESPACE && parser.state !== S.TEXT) {
        error2(parser, "Unexpected end");
      }
      closeText(parser);
      parser.c = "";
      parser.closed = true;
      emit(parser, "onend");
      SAXParser.call(parser, parser.strict, parser.opt);
      return parser;
    }
    function strictFail(parser, message) {
      if (typeof parser !== "object" || !(parser instanceof SAXParser)) {
        throw new Error("bad call to strictFail");
      }
      if (parser.strict) {
        error2(parser, message);
      }
    }
    function newTag(parser) {
      if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
      var parent = parser.tags[parser.tags.length - 1] || parser;
      var tag = parser.tag = { name: parser.tagName, attributes: {} };
      if (parser.opt.xmlns) {
        tag.ns = parent.ns;
      }
      parser.attribList.length = 0;
      emitNode(parser, "onopentagstart", tag);
    }
    function qname(name, attribute) {
      var i = name.indexOf(":");
      var qualName = i < 0 ? ["", name] : name.split(":");
      var prefix = qualName[0];
      var local = qualName[1];
      if (attribute && name === "xmlns") {
        prefix = "xmlns";
        local = "";
      }
      return { prefix, local };
    }
    function attrib(parser) {
      if (!parser.strict) {
        parser.attribName = parser.attribName[parser.looseCase]();
      }
      if (parser.attribList.indexOf(parser.attribName) !== -1 || parser.tag.attributes.hasOwnProperty(parser.attribName)) {
        parser.attribName = parser.attribValue = "";
        return;
      }
      if (parser.opt.xmlns) {
        var qn = qname(parser.attribName, true);
        var prefix = qn.prefix;
        var local = qn.local;
        if (prefix === "xmlns") {
          if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
            strictFail(
              parser,
              "xml: prefix must be bound to " + XML_NAMESPACE + "\nActual: " + parser.attribValue
            );
          } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
            strictFail(
              parser,
              "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\nActual: " + parser.attribValue
            );
          } else {
            var tag = parser.tag;
            var parent = parser.tags[parser.tags.length - 1] || parser;
            if (tag.ns === parent.ns) {
              tag.ns = Object.create(parent.ns);
            }
            tag.ns[local] = parser.attribValue;
          }
        }
        parser.attribList.push([parser.attribName, parser.attribValue]);
      } else {
        parser.tag.attributes[parser.attribName] = parser.attribValue;
        emitNode(parser, "onattribute", {
          name: parser.attribName,
          value: parser.attribValue
        });
      }
      parser.attribName = parser.attribValue = "";
    }
    function openTag(parser, selfClosing) {
      if (parser.opt.xmlns) {
        var tag = parser.tag;
        var qn = qname(parser.tagName);
        tag.prefix = qn.prefix;
        tag.local = qn.local;
        tag.uri = tag.ns[qn.prefix] || "";
        if (tag.prefix && !tag.uri) {
          strictFail(
            parser,
            "Unbound namespace prefix: " + JSON.stringify(parser.tagName)
          );
          tag.uri = qn.prefix;
        }
        var parent = parser.tags[parser.tags.length - 1] || parser;
        if (tag.ns && parent.ns !== tag.ns) {
          Object.keys(tag.ns).forEach(function(p) {
            emitNode(parser, "onopennamespace", {
              prefix: p,
              uri: tag.ns[p]
            });
          });
        }
        for (var i = 0, l = parser.attribList.length; i < l; i++) {
          var nv = parser.attribList[i];
          var name = nv[0];
          var value = nv[1];
          var qualName = qname(name, true);
          var prefix = qualName.prefix;
          var local = qualName.local;
          var uri = prefix === "" ? "" : tag.ns[prefix] || "";
          var a = {
            name,
            value,
            prefix,
            local,
            uri
          };
          if (prefix && prefix !== "xmlns" && !uri) {
            strictFail(
              parser,
              "Unbound namespace prefix: " + JSON.stringify(prefix)
            );
            a.uri = prefix;
          }
          parser.tag.attributes[name] = a;
          emitNode(parser, "onattribute", a);
        }
        parser.attribList.length = 0;
      }
      parser.tag.isSelfClosing = !!selfClosing;
      parser.sawRoot = true;
      parser.tags.push(parser.tag);
      emitNode(parser, "onopentag", parser.tag);
      if (!selfClosing) {
        if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
          parser.state = S.SCRIPT;
        } else {
          parser.state = S.TEXT;
        }
        parser.tag = null;
        parser.tagName = "";
      }
      parser.attribName = parser.attribValue = "";
      parser.attribList.length = 0;
    }
    function closeTag(parser) {
      if (!parser.tagName) {
        strictFail(parser, "Weird empty close tag.");
        parser.textNode += "</>";
        parser.state = S.TEXT;
        return;
      }
      if (parser.script) {
        if (parser.tagName !== "script") {
          parser.script += "</" + parser.tagName + ">";
          parser.tagName = "";
          parser.state = S.SCRIPT;
          return;
        }
        emitNode(parser, "onscript", parser.script);
        parser.script = "";
      }
      var t2 = parser.tags.length;
      var tagName = parser.tagName;
      if (!parser.strict) {
        tagName = tagName[parser.looseCase]();
      }
      var closeTo = tagName;
      while (t2--) {
        var close = parser.tags[t2];
        if (close.name !== closeTo) {
          strictFail(parser, "Unexpected close tag");
        } else {
          break;
        }
      }
      if (t2 < 0) {
        strictFail(parser, "Unmatched closing tag: " + parser.tagName);
        parser.textNode += "</" + parser.tagName + ">";
        parser.state = S.TEXT;
        return;
      }
      parser.tagName = tagName;
      var s2 = parser.tags.length;
      while (s2-- > t2) {
        var tag = parser.tag = parser.tags.pop();
        parser.tagName = parser.tag.name;
        emitNode(parser, "onclosetag", parser.tagName);
        var x = {};
        for (var i in tag.ns) {
          x[i] = tag.ns[i];
        }
        var parent = parser.tags[parser.tags.length - 1] || parser;
        if (parser.opt.xmlns && tag.ns !== parent.ns) {
          Object.keys(tag.ns).forEach(function(p) {
            var n = tag.ns[p];
            emitNode(parser, "onclosenamespace", { prefix: p, uri: n });
          });
        }
      }
      if (t2 === 0) parser.closedRoot = true;
      parser.tagName = parser.attribValue = parser.attribName = "";
      parser.attribList.length = 0;
      parser.state = S.TEXT;
    }
    function parseEntity(parser) {
      var entity = parser.entity;
      var entityLC = entity.toLowerCase();
      var num;
      var numStr = "";
      if (parser.ENTITIES[entity]) {
        return parser.ENTITIES[entity];
      }
      if (parser.ENTITIES[entityLC]) {
        return parser.ENTITIES[entityLC];
      }
      entity = entityLC;
      if (entity.charAt(0) === "#") {
        if (entity.charAt(1) === "x") {
          entity = entity.slice(2);
          num = parseInt(entity, 16);
          numStr = num.toString(16);
        } else {
          entity = entity.slice(1);
          num = parseInt(entity, 10);
          numStr = num.toString(10);
        }
      }
      entity = entity.replace(/^0+/, "");
      if (isNaN(num) || numStr.toLowerCase() !== entity || num < 0 || num > 1114111) {
        strictFail(parser, "Invalid character entity");
        return "&" + parser.entity + ";";
      }
      return String.fromCodePoint(num);
    }
    function beginWhiteSpace(parser, c) {
      if (c === "<") {
        parser.state = S.OPEN_WAKA;
        parser.startTagPosition = parser.position;
      } else if (!isWhitespace2(c)) {
        strictFail(parser, "Non-whitespace before first tag.");
        parser.textNode = c;
        parser.state = S.TEXT;
      }
    }
    function charAt(chunk, i) {
      var result = "";
      if (i < chunk.length) {
        result = chunk.charAt(i);
      }
      return result;
    }
    function write(chunk) {
      var parser = this;
      if (this.error) {
        throw this.error;
      }
      if (parser.closed) {
        return error2(
          parser,
          "Cannot write after close. Assign an onready handler."
        );
      }
      if (chunk === null) {
        return end(parser);
      }
      if (typeof chunk === "object") {
        chunk = chunk.toString();
      }
      var i = 0;
      var c = "";
      while (true) {
        c = charAt(chunk, i++);
        parser.c = c;
        if (!c) {
          break;
        }
        if (parser.trackPosition) {
          parser.position++;
          if (c === "\n") {
            parser.line++;
            parser.column = 0;
          } else {
            parser.column++;
          }
        }
        switch (parser.state) {
          case S.BEGIN:
            parser.state = S.BEGIN_WHITESPACE;
            if (c === "\uFEFF") {
              continue;
            }
            beginWhiteSpace(parser, c);
            continue;
          case S.BEGIN_WHITESPACE:
            beginWhiteSpace(parser, c);
            continue;
          case S.TEXT:
            if (parser.sawRoot && !parser.closedRoot) {
              var starti = i - 1;
              while (c && c !== "<" && c !== "&") {
                c = charAt(chunk, i++);
                if (c && parser.trackPosition) {
                  parser.position++;
                  if (c === "\n") {
                    parser.line++;
                    parser.column = 0;
                  } else {
                    parser.column++;
                  }
                }
              }
              parser.textNode += chunk.substring(starti, i - 1);
            }
            if (c === "<" && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
              parser.state = S.OPEN_WAKA;
              parser.startTagPosition = parser.position;
            } else {
              if (!isWhitespace2(c) && (!parser.sawRoot || parser.closedRoot)) {
                strictFail(parser, "Text data outside of root node.");
              }
              if (c === "&") {
                parser.state = S.TEXT_ENTITY;
              } else {
                parser.textNode += c;
              }
            }
            continue;
          case S.SCRIPT:
            if (c === "<") {
              parser.state = S.SCRIPT_ENDING;
            } else {
              parser.script += c;
            }
            continue;
          case S.SCRIPT_ENDING:
            if (c === "/") {
              parser.state = S.CLOSE_TAG;
            } else {
              parser.script += "<" + c;
              parser.state = S.SCRIPT;
            }
            continue;
          case S.OPEN_WAKA:
            if (c === "!") {
              parser.state = S.SGML_DECL;
              parser.sgmlDecl = "";
            } else if (isWhitespace2(c)) ;
            else if (isMatch(nameStart, c)) {
              parser.state = S.OPEN_TAG;
              parser.tagName = c;
            } else if (c === "/") {
              parser.state = S.CLOSE_TAG;
              parser.tagName = "";
            } else if (c === "?") {
              parser.state = S.PROC_INST;
              parser.procInstName = parser.procInstBody = "";
            } else {
              strictFail(parser, "Unencoded <");
              if (parser.startTagPosition + 1 < parser.position) {
                var pad = parser.position - parser.startTagPosition;
                c = new Array(pad).join(" ") + c;
              }
              parser.textNode += "<" + c;
              parser.state = S.TEXT;
            }
            continue;
          case S.SGML_DECL:
            if (parser.sgmlDecl + c === "--") {
              parser.state = S.COMMENT;
              parser.comment = "";
              parser.sgmlDecl = "";
              continue;
            }
            if (parser.doctype && parser.doctype !== true && parser.sgmlDecl) {
              parser.state = S.DOCTYPE_DTD;
              parser.doctype += "<!" + parser.sgmlDecl + c;
              parser.sgmlDecl = "";
            } else if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
              emitNode(parser, "onopencdata");
              parser.state = S.CDATA;
              parser.sgmlDecl = "";
              parser.cdata = "";
            } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
              parser.state = S.DOCTYPE;
              if (parser.doctype || parser.sawRoot) {
                strictFail(
                  parser,
                  "Inappropriately located doctype declaration"
                );
              }
              parser.doctype = "";
              parser.sgmlDecl = "";
            } else if (c === ">") {
              emitNode(parser, "onsgmldeclaration", parser.sgmlDecl);
              parser.sgmlDecl = "";
              parser.state = S.TEXT;
            } else if (isQuote(c)) {
              parser.state = S.SGML_DECL_QUOTED;
              parser.sgmlDecl += c;
            } else {
              parser.sgmlDecl += c;
            }
            continue;
          case S.SGML_DECL_QUOTED:
            if (c === parser.q) {
              parser.state = S.SGML_DECL;
              parser.q = "";
            }
            parser.sgmlDecl += c;
            continue;
          case S.DOCTYPE:
            if (c === ">") {
              parser.state = S.TEXT;
              emitNode(parser, "ondoctype", parser.doctype);
              parser.doctype = true;
            } else {
              parser.doctype += c;
              if (c === "[") {
                parser.state = S.DOCTYPE_DTD;
              } else if (isQuote(c)) {
                parser.state = S.DOCTYPE_QUOTED;
                parser.q = c;
              }
            }
            continue;
          case S.DOCTYPE_QUOTED:
            parser.doctype += c;
            if (c === parser.q) {
              parser.q = "";
              parser.state = S.DOCTYPE;
            }
            continue;
          case S.DOCTYPE_DTD:
            if (c === "]") {
              parser.doctype += c;
              parser.state = S.DOCTYPE;
            } else if (c === "<") {
              parser.state = S.OPEN_WAKA;
              parser.startTagPosition = parser.position;
            } else if (isQuote(c)) {
              parser.doctype += c;
              parser.state = S.DOCTYPE_DTD_QUOTED;
              parser.q = c;
            } else {
              parser.doctype += c;
            }
            continue;
          case S.DOCTYPE_DTD_QUOTED:
            parser.doctype += c;
            if (c === parser.q) {
              parser.state = S.DOCTYPE_DTD;
              parser.q = "";
            }
            continue;
          case S.COMMENT:
            if (c === "-") {
              parser.state = S.COMMENT_ENDING;
            } else {
              parser.comment += c;
            }
            continue;
          case S.COMMENT_ENDING:
            if (c === "-") {
              parser.state = S.COMMENT_ENDED;
              parser.comment = textopts(parser.opt, parser.comment);
              if (parser.comment) {
                emitNode(parser, "oncomment", parser.comment);
              }
              parser.comment = "";
            } else {
              parser.comment += "-" + c;
              parser.state = S.COMMENT;
            }
            continue;
          case S.COMMENT_ENDED:
            if (c !== ">") {
              strictFail(parser, "Malformed comment");
              parser.comment += "--" + c;
              parser.state = S.COMMENT;
            } else if (parser.doctype && parser.doctype !== true) {
              parser.state = S.DOCTYPE_DTD;
            } else {
              parser.state = S.TEXT;
            }
            continue;
          case S.CDATA:
            var starti = i - 1;
            while (c && c !== "]") {
              c = charAt(chunk, i++);
              if (c && parser.trackPosition) {
                parser.position++;
                if (c === "\n") {
                  parser.line++;
                  parser.column = 0;
                } else {
                  parser.column++;
                }
              }
            }
            parser.cdata += chunk.substring(starti, i - 1);
            if (c === "]") {
              parser.state = S.CDATA_ENDING;
            }
            continue;
          case S.CDATA_ENDING:
            if (c === "]") {
              parser.state = S.CDATA_ENDING_2;
            } else {
              parser.cdata += "]" + c;
              parser.state = S.CDATA;
            }
            continue;
          case S.CDATA_ENDING_2:
            if (c === ">") {
              if (parser.cdata) {
                emitNode(parser, "oncdata", parser.cdata);
              }
              emitNode(parser, "onclosecdata");
              parser.cdata = "";
              parser.state = S.TEXT;
            } else if (c === "]") {
              parser.cdata += "]";
            } else {
              parser.cdata += "]]" + c;
              parser.state = S.CDATA;
            }
            continue;
          case S.PROC_INST:
            if (c === "?") {
              parser.state = S.PROC_INST_ENDING;
            } else if (isWhitespace2(c)) {
              parser.state = S.PROC_INST_BODY;
            } else {
              parser.procInstName += c;
            }
            continue;
          case S.PROC_INST_BODY:
            if (!parser.procInstBody && isWhitespace2(c)) {
              continue;
            } else if (c === "?") {
              parser.state = S.PROC_INST_ENDING;
            } else {
              parser.procInstBody += c;
            }
            continue;
          case S.PROC_INST_ENDING:
            if (c === ">") {
              const procInstEndData = {
                name: parser.procInstName,
                body: parser.procInstBody
              };
              validateXmlDeclarationEncoding(parser, procInstEndData);
              emitNode(parser, "onprocessinginstruction", procInstEndData);
              parser.procInstName = parser.procInstBody = "";
              parser.state = S.TEXT;
            } else {
              parser.procInstBody += "?" + c;
              parser.state = S.PROC_INST_BODY;
            }
            continue;
          case S.OPEN_TAG:
            if (isMatch(nameBody, c)) {
              parser.tagName += c;
            } else {
              newTag(parser);
              if (c === ">") {
                openTag(parser);
              } else if (c === "/") {
                parser.state = S.OPEN_TAG_SLASH;
              } else {
                if (!isWhitespace2(c)) {
                  strictFail(parser, "Invalid character in tag name");
                }
                parser.state = S.ATTRIB;
              }
            }
            continue;
          case S.OPEN_TAG_SLASH:
            if (c === ">") {
              openTag(parser, true);
              closeTag(parser);
            } else {
              strictFail(
                parser,
                "Forward-slash in opening tag not followed by >"
              );
              parser.state = S.ATTRIB;
            }
            continue;
          case S.ATTRIB:
            if (isWhitespace2(c)) {
              continue;
            } else if (c === ">") {
              openTag(parser);
            } else if (c === "/") {
              parser.state = S.OPEN_TAG_SLASH;
            } else if (isMatch(nameStart, c)) {
              parser.attribName = c;
              parser.attribValue = "";
              parser.state = S.ATTRIB_NAME;
            } else {
              strictFail(parser, "Invalid attribute name");
            }
            continue;
          case S.ATTRIB_NAME:
            if (c === "=") {
              parser.state = S.ATTRIB_VALUE;
            } else if (c === ">") {
              strictFail(parser, "Attribute without value");
              parser.attribValue = parser.attribName;
              attrib(parser);
              openTag(parser);
            } else if (isWhitespace2(c)) {
              parser.state = S.ATTRIB_NAME_SAW_WHITE;
            } else if (isMatch(nameBody, c)) {
              parser.attribName += c;
            } else {
              strictFail(parser, "Invalid attribute name");
            }
            continue;
          case S.ATTRIB_NAME_SAW_WHITE:
            if (c === "=") {
              parser.state = S.ATTRIB_VALUE;
            } else if (isWhitespace2(c)) {
              continue;
            } else {
              strictFail(parser, "Attribute without value");
              parser.tag.attributes[parser.attribName] = "";
              parser.attribValue = "";
              emitNode(parser, "onattribute", {
                name: parser.attribName,
                value: ""
              });
              parser.attribName = "";
              if (c === ">") {
                openTag(parser);
              } else if (isMatch(nameStart, c)) {
                parser.attribName = c;
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, "Invalid attribute name");
                parser.state = S.ATTRIB;
              }
            }
            continue;
          case S.ATTRIB_VALUE:
            if (isWhitespace2(c)) {
              continue;
            } else if (isQuote(c)) {
              parser.q = c;
              parser.state = S.ATTRIB_VALUE_QUOTED;
            } else {
              if (!parser.opt.unquotedAttributeValues) {
                error2(parser, "Unquoted attribute value");
              }
              parser.state = S.ATTRIB_VALUE_UNQUOTED;
              parser.attribValue = c;
            }
            continue;
          case S.ATTRIB_VALUE_QUOTED:
            if (c !== parser.q) {
              if (c === "&") {
                parser.state = S.ATTRIB_VALUE_ENTITY_Q;
              } else {
                parser.attribValue += c;
              }
              continue;
            }
            attrib(parser);
            parser.q = "";
            parser.state = S.ATTRIB_VALUE_CLOSED;
            continue;
          case S.ATTRIB_VALUE_CLOSED:
            if (isWhitespace2(c)) {
              parser.state = S.ATTRIB;
            } else if (c === ">") {
              openTag(parser);
            } else if (c === "/") {
              parser.state = S.OPEN_TAG_SLASH;
            } else if (isMatch(nameStart, c)) {
              strictFail(parser, "No whitespace between attributes");
              parser.attribName = c;
              parser.attribValue = "";
              parser.state = S.ATTRIB_NAME;
            } else {
              strictFail(parser, "Invalid attribute name");
            }
            continue;
          case S.ATTRIB_VALUE_UNQUOTED:
            if (!isAttribEnd(c)) {
              if (c === "&") {
                parser.state = S.ATTRIB_VALUE_ENTITY_U;
              } else {
                parser.attribValue += c;
              }
              continue;
            }
            attrib(parser);
            if (c === ">") {
              openTag(parser);
            } else {
              parser.state = S.ATTRIB;
            }
            continue;
          case S.CLOSE_TAG:
            if (!parser.tagName) {
              if (isWhitespace2(c)) {
                continue;
              } else if (notMatch(nameStart, c)) {
                if (parser.script) {
                  parser.script += "</" + c;
                  parser.state = S.SCRIPT;
                } else {
                  strictFail(parser, "Invalid tagname in closing tag.");
                }
              } else {
                parser.tagName = c;
              }
            } else if (c === ">") {
              closeTag(parser);
            } else if (isMatch(nameBody, c)) {
              parser.tagName += c;
            } else if (parser.script) {
              parser.script += "</" + parser.tagName + c;
              parser.tagName = "";
              parser.state = S.SCRIPT;
            } else {
              if (!isWhitespace2(c)) {
                strictFail(parser, "Invalid tagname in closing tag");
              }
              parser.state = S.CLOSE_TAG_SAW_WHITE;
            }
            continue;
          case S.CLOSE_TAG_SAW_WHITE:
            if (isWhitespace2(c)) {
              continue;
            }
            if (c === ">") {
              closeTag(parser);
            } else {
              strictFail(parser, "Invalid characters in closing tag");
            }
            continue;
          case S.TEXT_ENTITY:
          case S.ATTRIB_VALUE_ENTITY_Q:
          case S.ATTRIB_VALUE_ENTITY_U:
            var returnState;
            var buffer;
            switch (parser.state) {
              case S.TEXT_ENTITY:
                returnState = S.TEXT;
                buffer = "textNode";
                break;
              case S.ATTRIB_VALUE_ENTITY_Q:
                returnState = S.ATTRIB_VALUE_QUOTED;
                buffer = "attribValue";
                break;
              case S.ATTRIB_VALUE_ENTITY_U:
                returnState = S.ATTRIB_VALUE_UNQUOTED;
                buffer = "attribValue";
                break;
            }
            if (c === ";") {
              var parsedEntity = parseEntity(parser);
              if (parser.opt.unparsedEntities && !Object.values(sax2.XML_ENTITIES).includes(parsedEntity)) {
                if ((parser.entityCount += 1) > parser.opt.maxEntityCount) {
                  error2(
                    parser,
                    "Parsed entity count exceeds max entity count"
                  );
                }
                if ((parser.entityDepth += 1) > parser.opt.maxEntityDepth) {
                  error2(
                    parser,
                    "Parsed entity depth exceeds max entity depth"
                  );
                }
                parser.entity = "";
                parser.state = returnState;
                parser.write(parsedEntity);
                parser.entityDepth -= 1;
              } else {
                parser[buffer] += parsedEntity;
                parser.entity = "";
                parser.state = returnState;
              }
            } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
              parser.entity += c;
            } else {
              strictFail(parser, "Invalid character in entity name");
              parser[buffer] += "&" + parser.entity + c;
              parser.entity = "";
              parser.state = returnState;
            }
            continue;
          default: {
            throw new Error(parser, "Unknown state: " + parser.state);
          }
        }
      }
      if (parser.position >= parser.bufferCheckPosition) {
        checkBufferLength(parser);
      }
      return parser;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    if (!String.fromCodePoint) {
      (function() {
        var stringFromCharCode = String.fromCharCode;
        var floor = Math.floor;
        var fromCodePoint = function() {
          var MAX_SIZE = 16384;
          var codeUnits = [];
          var highSurrogate;
          var lowSurrogate;
          var index = -1;
          var length = arguments.length;
          if (!length) {
            return "";
          }
          var result = "";
          while (++index < length) {
            var codePoint = Number(arguments[index]);
            if (!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
            codePoint < 0 || // not a valid Unicode code point
            codePoint > 1114111 || // not a valid Unicode code point
            floor(codePoint) !== codePoint) {
              throw RangeError("Invalid code point: " + codePoint);
            }
            if (codePoint <= 65535) {
              codeUnits.push(codePoint);
            } else {
              codePoint -= 65536;
              highSurrogate = (codePoint >> 10) + 55296;
              lowSurrogate = codePoint % 1024 + 56320;
              codeUnits.push(highSurrogate, lowSurrogate);
            }
            if (index + 1 === length || codeUnits.length > MAX_SIZE) {
              result += stringFromCharCode.apply(null, codeUnits);
              codeUnits.length = 0;
            }
          }
          return result;
        };
        if (Object.defineProperty) {
          Object.defineProperty(String, "fromCodePoint", {
            value: fromCodePoint,
            configurable: true,
            writable: true
          });
        } else {
          String.fromCodePoint = fromCodePoint;
        }
      })();
    }
  })(exports);
})(sax$1);
Object.defineProperty(xml, "__esModule", { value: true });
xml.XElement = void 0;
xml.parseXml = parseXml;
const sax = sax$1;
const error_1 = error;
class XElement {
  constructor(name) {
    this.name = name;
    this.value = "";
    this.attributes = null;
    this.isCData = false;
    this.elements = null;
    if (!name) {
      throw (0, error_1.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    }
    if (!isValidName(name)) {
      throw (0, error_1.newError)(`Invalid element name: ${name}`, "ERR_XML_ELEMENT_INVALID_NAME");
    }
  }
  attribute(name) {
    const result = this.attributes === null ? null : this.attributes[name];
    if (result == null) {
      throw (0, error_1.newError)(`No attribute "${name}"`, "ERR_XML_MISSED_ATTRIBUTE");
    }
    return result;
  }
  removeAttribute(name) {
    if (this.attributes !== null) {
      delete this.attributes[name];
    }
  }
  element(name, ignoreCase = false, errorIfMissed = null) {
    const result = this.elementOrNull(name, ignoreCase);
    if (result === null) {
      throw (0, error_1.newError)(errorIfMissed || `No element "${name}"`, "ERR_XML_MISSED_ELEMENT");
    }
    return result;
  }
  elementOrNull(name, ignoreCase = false) {
    if (this.elements === null) {
      return null;
    }
    for (const element of this.elements) {
      if (isNameEquals(element, name, ignoreCase)) {
        return element;
      }
    }
    return null;
  }
  getElements(name, ignoreCase = false) {
    if (this.elements === null) {
      return [];
    }
    return this.elements.filter((it) => isNameEquals(it, name, ignoreCase));
  }
  elementValueOrEmpty(name, ignoreCase = false) {
    const element = this.elementOrNull(name, ignoreCase);
    return element === null ? "" : element.value;
  }
}
xml.XElement = XElement;
const NAME_REG_EXP = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function isValidName(name) {
  return NAME_REG_EXP.test(name);
}
function isNameEquals(element, name, ignoreCase) {
  const elementName = element.name;
  return elementName === name || ignoreCase === true && elementName.length === name.length && elementName.toLowerCase() === name.toLowerCase();
}
function parseXml(data) {
  let rootElement = null;
  const parser = sax.parser(true, {});
  const elements = [];
  parser.onopentag = (saxElement) => {
    const element = new XElement(saxElement.name);
    element.attributes = saxElement.attributes;
    if (rootElement === null) {
      rootElement = element;
    } else {
      const parent = elements[elements.length - 1];
      if (parent.elements == null) {
        parent.elements = [];
      }
      parent.elements.push(element);
    }
    elements.push(element);
  };
  parser.onclosetag = () => {
    elements.pop();
  };
  parser.ontext = (text) => {
    if (elements.length > 0) {
      elements[elements.length - 1].value = text;
    }
  };
  parser.oncdata = (cdata) => {
    const element = elements[elements.length - 1];
    element.value = cdata;
    element.isCData = true;
  };
  parser.onerror = (err) => {
    throw err;
  };
  parser.write(data);
  return rootElement;
}
var objects = {};
Object.defineProperty(objects, "__esModule", { value: true });
objects.mapToObject = mapToObject;
objects.isValidKey = isValidKey;
objects.asArray = asArray;
objects.deepAssign = deepAssign;
objects.objectToArgs = objectToArgs;
function mapToObject(map2) {
  const obj = {};
  for (const [key, value] of map2) {
    if (!isValidKey(key)) {
      continue;
    }
    if (value instanceof Map) {
      obj[key] = mapToObject(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
function isValidKey(key) {
  const protectedProperties = ["__proto__", "prototype", "constructor"];
  if (protectedProperties.includes(key)) {
    return false;
  }
  return ["string", "number", "symbol", "boolean"].includes(typeof key) || key === null;
}
function asArray(v) {
  if (v == null) {
    return [];
  } else if (Array.isArray(v)) {
    return v;
  } else {
    return [v];
  }
}
function isObject$1(x) {
  if (Array.isArray(x)) {
    return false;
  }
  const type2 = typeof x;
  return type2 === "object" || type2 === "function";
}
function assignKey(target, from, key) {
  const value = from[key];
  if (value === void 0) {
    return;
  }
  const prevValue = target[key];
  if (prevValue == null || value == null || !isObject$1(prevValue) || !isObject$1(value)) {
    if (Array.isArray(prevValue) && Array.isArray(value)) {
      target[key] = Array.from(new Set(prevValue.concat(value)));
    } else {
      target[key] = value;
    }
  } else {
    target[key] = assign(prevValue, value);
  }
}
function assign(to, from) {
  if (to !== from) {
    for (const key of Object.getOwnPropertyNames(from)) {
      if (isValidKey(key)) {
        assignKey(to, from, key);
      }
    }
  }
  return to;
}
function deepAssign(target, ...objects2) {
  for (const o of objects2) {
    if (o != null) {
      assign(target, o);
    }
  }
  return target;
}
const SAFE_FLAG_NAME_RE = /^[a-zA-Z][a-zA-Z0-9-]*$/;
const UNSAFE_VALUE_RE = /[\0\r\n]/;
function objectToArgs(obj) {
  const args = Object.entries(obj).reduce((args2, [name, value]) => {
    if (!isValidKey(name) || value == null) {
      return args2;
    }
    if (!SAFE_FLAG_NAME_RE.test(name)) {
      throw new Error(`objectToArgs: unsafe flag name rejected: ${JSON.stringify(name)}`);
    }
    if (UNSAFE_VALUE_RE.test(value)) {
      throw new Error(`objectToArgs: value for --${name} contains a null byte or newline`);
    }
    return args2.concat([`--${name}`, value]);
  }, []);
  return Object.freeze(args);
}
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CURRENT_APP_PACKAGE_FILE_NAME = exports.CURRENT_APP_INSTALLER_FILE_NAME = exports.objectToArgs = exports.deepAssign = exports.asArray = exports.mapToObject = exports.isValidKey = exports.XElement = exports.parseXml = exports.UUID = exports.parseDn = exports.retry = exports.githubTagPrefix = exports.githubUrl = exports.getS3LikeProviderBaseUrl = exports.ProgressCallbackTransform = exports.MemoLazy = exports.safeStringifyJson = exports.safeGetHeader = exports.parseJson = exports.isSensitiveFieldName = exports.HttpExecutor = exports.hashSensitiveValue = exports.HttpError = exports.DigestTransform = exports.createHttpError = exports.configureRequestUrl = exports.configureRequestOptionsFromUrl = exports.configureRequestOptions = exports.newError = exports.CancellationToken = exports.CancellationError = void 0;
  var CancellationToken_12 = CancellationToken$1;
  Object.defineProperty(exports, "CancellationError", { enumerable: true, get: function() {
    return CancellationToken_12.CancellationError;
  } });
  Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function() {
    return CancellationToken_12.CancellationToken;
  } });
  var error_12 = error;
  Object.defineProperty(exports, "newError", { enumerable: true, get: function() {
    return error_12.newError;
  } });
  var httpExecutor_1 = httpExecutor;
  Object.defineProperty(exports, "configureRequestOptions", { enumerable: true, get: function() {
    return httpExecutor_1.configureRequestOptions;
  } });
  Object.defineProperty(exports, "configureRequestOptionsFromUrl", { enumerable: true, get: function() {
    return httpExecutor_1.configureRequestOptionsFromUrl;
  } });
  Object.defineProperty(exports, "configureRequestUrl", { enumerable: true, get: function() {
    return httpExecutor_1.configureRequestUrl;
  } });
  Object.defineProperty(exports, "createHttpError", { enumerable: true, get: function() {
    return httpExecutor_1.createHttpError;
  } });
  Object.defineProperty(exports, "DigestTransform", { enumerable: true, get: function() {
    return httpExecutor_1.DigestTransform;
  } });
  Object.defineProperty(exports, "HttpError", { enumerable: true, get: function() {
    return httpExecutor_1.HttpError;
  } });
  Object.defineProperty(exports, "hashSensitiveValue", { enumerable: true, get: function() {
    return httpExecutor_1.hashSensitiveValue;
  } });
  Object.defineProperty(exports, "HttpExecutor", { enumerable: true, get: function() {
    return httpExecutor_1.HttpExecutor;
  } });
  Object.defineProperty(exports, "isSensitiveFieldName", { enumerable: true, get: function() {
    return httpExecutor_1.isSensitiveFieldName;
  } });
  Object.defineProperty(exports, "parseJson", { enumerable: true, get: function() {
    return httpExecutor_1.parseJson;
  } });
  Object.defineProperty(exports, "safeGetHeader", { enumerable: true, get: function() {
    return httpExecutor_1.safeGetHeader;
  } });
  Object.defineProperty(exports, "safeStringifyJson", { enumerable: true, get: function() {
    return httpExecutor_1.safeStringifyJson;
  } });
  var MemoLazy_1 = MemoLazy$1;
  Object.defineProperty(exports, "MemoLazy", { enumerable: true, get: function() {
    return MemoLazy_1.MemoLazy;
  } });
  var ProgressCallbackTransform_12 = ProgressCallbackTransform$1;
  Object.defineProperty(exports, "ProgressCallbackTransform", { enumerable: true, get: function() {
    return ProgressCallbackTransform_12.ProgressCallbackTransform;
  } });
  var publishOptions_1 = publishOptions;
  Object.defineProperty(exports, "getS3LikeProviderBaseUrl", { enumerable: true, get: function() {
    return publishOptions_1.getS3LikeProviderBaseUrl;
  } });
  Object.defineProperty(exports, "githubUrl", { enumerable: true, get: function() {
    return publishOptions_1.githubUrl;
  } });
  Object.defineProperty(exports, "githubTagPrefix", { enumerable: true, get: function() {
    return publishOptions_1.githubTagPrefix;
  } });
  var retry_1 = retry$1;
  Object.defineProperty(exports, "retry", { enumerable: true, get: function() {
    return retry_1.retry;
  } });
  var rfc2253Parser_1 = rfc2253Parser;
  Object.defineProperty(exports, "parseDn", { enumerable: true, get: function() {
    return rfc2253Parser_1.parseDn;
  } });
  var uuid_1 = uuid;
  Object.defineProperty(exports, "UUID", { enumerable: true, get: function() {
    return uuid_1.UUID;
  } });
  var xml_1 = xml;
  Object.defineProperty(exports, "parseXml", { enumerable: true, get: function() {
    return xml_1.parseXml;
  } });
  Object.defineProperty(exports, "XElement", { enumerable: true, get: function() {
    return xml_1.XElement;
  } });
  var objects_1 = objects;
  Object.defineProperty(exports, "isValidKey", { enumerable: true, get: function() {
    return objects_1.isValidKey;
  } });
  Object.defineProperty(exports, "mapToObject", { enumerable: true, get: function() {
    return objects_1.mapToObject;
  } });
  Object.defineProperty(exports, "asArray", { enumerable: true, get: function() {
    return objects_1.asArray;
  } });
  Object.defineProperty(exports, "deepAssign", { enumerable: true, get: function() {
    return objects_1.deepAssign;
  } });
  Object.defineProperty(exports, "objectToArgs", { enumerable: true, get: function() {
    return objects_1.objectToArgs;
  } });
  exports.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe";
  exports.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
})(out);
var jsYaml = {};
var loader$1 = {};
var common$5 = {};
function isNothing(subject) {
  return typeof subject === "undefined" || subject === null;
}
function isObject(subject) {
  return typeof subject === "object" && subject !== null;
}
function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];
  return [sequence];
}
function extend(target, source) {
  var index, length, key, sourceKeys;
  if (source) {
    sourceKeys = Object.keys(source);
    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }
  return target;
}
function repeat(string, count) {
  var result = "", cycle;
  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }
  return result;
}
function isNegativeZero(number) {
  return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
common$5.isNothing = isNothing;
common$5.isObject = isObject;
common$5.toArray = toArray;
common$5.repeat = repeat;
common$5.isNegativeZero = isNegativeZero;
common$5.extend = extend;
function formatError(exception2, compact) {
  var where = "", message = exception2.reason || "(unknown reason)";
  if (!exception2.mark) return message;
  if (exception2.mark.name) {
    where += 'in "' + exception2.mark.name + '" ';
  }
  where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
  if (!compact && exception2.mark.snippet) {
    where += "\n\n" + exception2.mark.snippet;
  }
  return message + " " + where;
}
function YAMLException$4(reason, mark) {
  Error.call(this);
  this.name = "YAMLException";
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack || "";
  }
}
YAMLException$4.prototype = Object.create(Error.prototype);
YAMLException$4.prototype.constructor = YAMLException$4;
YAMLException$4.prototype.toString = function toString(compact) {
  return this.name + ": " + formatError(this, compact);
};
var exception = YAMLException$4;
var common$4 = common$5;
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = "";
  var tail = "";
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
    pos: position - lineStart + head.length
    // relative position
  };
}
function padStart(string, max) {
  return common$4.repeat(" ", max - string.length) + string;
}
function makeSnippet$1(mark, options) {
  options = Object.create(options || null);
  if (!mark.buffer) return null;
  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent !== "number") options.indent = 1;
  if (typeof options.linesBefore !== "number") options.linesBefore = 3;
  if (typeof options.linesAfter !== "number") options.linesAfter = 2;
  var re2 = /\r?\n|\r|\0/g;
  var lineStarts = [0];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;
  while (match = re2.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }
  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  var result = "", i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common$4.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
  }
  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common$4.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  result += common$4.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common$4.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  }
  return result.replace(/\n$/, "");
}
var snippet = makeSnippet$1;
var YAMLException$3 = exception;
var TYPE_CONSTRUCTOR_OPTIONS = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
];
var YAML_NODE_KINDS = [
  "scalar",
  "sequence",
  "mapping"
];
function compileStyleAliases(map2) {
  var result = {};
  if (map2 !== null) {
    Object.keys(map2).forEach(function(style) {
      map2[style].forEach(function(alias) {
        result[String(alias)] = style;
      });
    });
  }
  return result;
}
function Type$e(tag, options) {
  options = options || {};
  Object.keys(options).forEach(function(name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new YAMLException$3('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });
  this.options = options;
  this.tag = tag;
  this.kind = options["kind"] || null;
  this.resolve = options["resolve"] || function() {
    return true;
  };
  this.construct = options["construct"] || function(data) {
    return data;
  };
  this.instanceOf = options["instanceOf"] || null;
  this.predicate = options["predicate"] || null;
  this.represent = options["represent"] || null;
  this.representName = options["representName"] || null;
  this.defaultStyle = options["defaultStyle"] || null;
  this.multi = options["multi"] || false;
  this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new YAMLException$3('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}
var type = Type$e;
var YAMLException$2 = exception;
var Type$d = type;
function compileList(schema2, name) {
  var result = [];
  schema2[name].forEach(function(currentType) {
    var newIndex = result.length;
    result.forEach(function(previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
        newIndex = previousIndex;
      }
    });
    result[newIndex] = currentType;
  });
  return result;
}
function compileMap() {
  var result = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, index, length;
  function collectType(type2) {
    if (type2.multi) {
      result.multi[type2.kind].push(type2);
      result.multi["fallback"].push(type2);
    } else {
      result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
    }
  }
  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}
function Schema$1(definition) {
  return this.extend(definition);
}
Schema$1.prototype.extend = function extend2(definition) {
  var implicit = [];
  var explicit = [];
  if (definition instanceof Type$d) {
    explicit.push(definition);
  } else if (Array.isArray(definition)) {
    explicit = explicit.concat(definition);
  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);
  } else {
    throw new YAMLException$2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  }
  implicit.forEach(function(type2) {
    if (!(type2 instanceof Type$d)) {
      throw new YAMLException$2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
    if (type2.loadKind && type2.loadKind !== "scalar") {
      throw new YAMLException$2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    }
    if (type2.multi) {
      throw new YAMLException$2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }
  });
  explicit.forEach(function(type2) {
    if (!(type2 instanceof Type$d)) {
      throw new YAMLException$2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
  });
  var result = Object.create(Schema$1.prototype);
  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);
  result.compiledImplicit = compileList(result, "implicit");
  result.compiledExplicit = compileList(result, "explicit");
  result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
  return result;
};
var schema = Schema$1;
var Type$c = type;
var str = new Type$c("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(data) {
    return data !== null ? data : "";
  }
});
var Type$b = type;
var seq = new Type$b("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(data) {
    return data !== null ? data : [];
  }
});
var Type$a = type;
var map = new Type$a("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(data) {
    return data !== null ? data : {};
  }
});
var Schema = schema;
var failsafe = new Schema({
  explicit: [
    str,
    seq,
    map
  ]
});
var Type$9 = type;
function resolveYamlNull(data) {
  if (data === null) return true;
  var max = data.length;
  return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
  return null;
}
function isNull(object) {
  return object === null;
}
var _null = new Type$9("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
var Type$8 = type;
function resolveYamlBoolean(data) {
  if (data === null) return false;
  var max = data.length;
  return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
  return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean(object) {
  return Object.prototype.toString.call(object) === "[object Boolean]";
}
var bool = new Type$8("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function(object) {
      return object ? "true" : "false";
    },
    uppercase: function(object) {
      return object ? "TRUE" : "FALSE";
    },
    camelcase: function(object) {
      return object ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
var common$3 = common$5;
var Type$7 = type;
function isHexCode(c) {
  return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
  return 48 <= c && c <= 55;
}
function isDecCode(c) {
  return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
  if (data === null) return false;
  var max = data.length, index = 0, hasDigits = false, ch;
  if (!max) return false;
  ch = data[index];
  if (ch === "-" || ch === "+") {
    ch = data[++index];
  }
  if (ch === "0") {
    if (index + 1 === max) return true;
    ch = data[++index];
    if (ch === "b") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (ch !== "0" && ch !== "1") return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "x") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "o") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
  }
  if (ch === "_") return false;
  for (; index < max; index++) {
    ch = data[index];
    if (ch === "_") continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }
  if (!hasDigits || ch === "_") return false;
  return true;
}
function constructYamlInteger(data) {
  var value = data, sign = 1, ch;
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }
  ch = value[0];
  if (ch === "-" || ch === "+") {
    if (ch === "-") sign = -1;
    value = value.slice(1);
    ch = value[0];
  }
  if (value === "0") return 0;
  if (ch === "0") {
    if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
    if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
    if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
  }
  return sign * parseInt(value, 10);
}
function isInteger(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common$3.isNegativeZero(object));
}
var int = new Type$7("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary: function(obj) {
      return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
    },
    octal: function(obj) {
      return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
    },
    decimal: function(obj) {
      return obj.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(obj) {
      return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
var common$2 = common$5;
var Type$6 = type;
var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function resolveYamlFloat(data) {
  if (data === null) return false;
  if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  data[data.length - 1] === "_") {
    return false;
  }
  return true;
}
function constructYamlFloat(data) {
  var value, sign;
  value = data.replace(/_/g, "").toLowerCase();
  sign = value[0] === "-" ? -1 : 1;
  if ("+-".indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }
  if (value === ".inf") {
    return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if (value === ".nan") {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}
var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
function representYamlFloat(object, style) {
  var res;
  if (isNaN(object)) {
    switch (style) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  } else if (common$2.isNegativeZero(object)) {
    return "-0.0";
  }
  res = object.toString(10);
  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common$2.isNegativeZero(object));
}
var float = new Type$6("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: "lowercase"
});
var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});
var core = json;
var Type$5 = type;
var YAML_DATE_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
);
var YAML_TIMESTAMP_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}
function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
  if (match === null) throw new Error("Date resolve error");
  year = +match[1];
  month = +match[2] - 1;
  day = +match[3];
  if (!match[4]) {
    return new Date(Date.UTC(year, month, day));
  }
  hour = +match[4];
  minute = +match[5];
  second = +match[6];
  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) {
      fraction += "0";
    }
    fraction = +fraction;
  }
  if (match[9]) {
    tz_hour = +match[10];
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 6e4;
    if (match[9] === "-") delta = -delta;
  }
  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (delta) date.setTime(date.getTime() - delta);
  return date;
}
function representYamlTimestamp(object) {
  return object.toISOString();
}
var timestamp = new Type$5("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});
var Type$4 = type;
function resolveYamlMerge(data) {
  return data === "<<" || data === null;
}
var merge = new Type$4("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: resolveYamlMerge
});
var Type$3 = type;
var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
function resolveYamlBinary(data) {
  if (data === null) return false;
  var code, idx, bitlen = 0, max = data.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    code = map2.indexOf(data.charAt(idx));
    if (code > 64) continue;
    if (code < 0) return false;
    bitlen += 6;
  }
  return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
  var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map2 = BASE64_MAP, bits = 0, result = [];
  for (idx = 0; idx < max; idx++) {
    if (idx % 4 === 0 && idx) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    }
    bits = bits << 6 | map2.indexOf(input.charAt(idx));
  }
  tailbits = max % 4 * 6;
  if (tailbits === 0) {
    result.push(bits >> 16 & 255);
    result.push(bits >> 8 & 255);
    result.push(bits & 255);
  } else if (tailbits === 18) {
    result.push(bits >> 10 & 255);
    result.push(bits >> 2 & 255);
  } else if (tailbits === 12) {
    result.push(bits >> 4 & 255);
  }
  return new Uint8Array(result);
}
function representYamlBinary(object) {
  var result = "", bits = 0, idx, tail, max = object.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    if (idx % 3 === 0 && idx) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    }
    bits = (bits << 8) + object[idx];
  }
  tail = max % 3;
  if (tail === 0) {
    result += map2[bits >> 18 & 63];
    result += map2[bits >> 12 & 63];
    result += map2[bits >> 6 & 63];
    result += map2[bits & 63];
  } else if (tail === 2) {
    result += map2[bits >> 10 & 63];
    result += map2[bits >> 4 & 63];
    result += map2[bits << 2 & 63];
    result += map2[64];
  } else if (tail === 1) {
    result += map2[bits >> 2 & 63];
    result += map2[bits << 4 & 63];
    result += map2[64];
    result += map2[64];
  }
  return result;
}
function isBinary(obj) {
  return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
var binary = new Type$3("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});
var Type$2 = type;
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2 = Object.prototype.toString;
function resolveYamlOmap(data) {
  if (data === null) return true;
  var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;
    if (_toString$2.call(pair) !== "[object Object]") return false;
    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }
    if (!pairHasKey) return false;
    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }
  return true;
}
function constructYamlOmap(data) {
  return data !== null ? data : [];
}
var omap = new Type$2("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});
var Type$1 = type;
var _toString$1 = Object.prototype.toString;
function resolveYamlPairs(data) {
  if (data === null) return true;
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    if (_toString$1.call(pair) !== "[object Object]") return false;
    keys = Object.keys(pair);
    if (keys.length !== 1) return false;
    result[index] = [keys[0], pair[keys[0]]];
  }
  return true;
}
function constructYamlPairs(data) {
  if (data === null) return [];
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    keys = Object.keys(pair);
    result[index] = [keys[0], pair[keys[0]]];
  }
  return result;
}
var pairs = new Type$1("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});
var Type = type;
var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
function resolveYamlSet(data) {
  if (data === null) return true;
  var key, object = data;
  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }
  return true;
}
function constructYamlSet(data) {
  return data !== null ? data : {};
}
var set = new Type("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: resolveYamlSet,
  construct: constructYamlSet
});
var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});
var common$1 = common$5;
var YAMLException$1 = exception;
var makeSnippet = snippet;
var DEFAULT_SCHEMA$1 = _default;
var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
  return Object.prototype.toString.call(obj);
}
function is_EOL(c) {
  return c === 10 || c === 13;
}
function is_WHITE_SPACE(c) {
  return c === 9 || c === 32;
}
function is_WS_OR_EOL(c) {
  return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
  var lc;
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  lc = c | 32;
  if (97 <= lc && lc <= 102) {
    return lc - 97 + 10;
  }
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) {
    return 2;
  }
  if (c === 117) {
    return 4;
  }
  if (c === 85) {
    return 8;
  }
  return 0;
}
function fromDecimalCode(c) {
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  return -1;
}
function simpleEscapeSequence(c) {
  return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "" : c === 95 ? " " : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
  if (c <= 65535) {
    return String.fromCharCode(c);
  }
  return String.fromCharCode(
    (c - 65536 >> 10) + 55296,
    (c - 65536 & 1023) + 56320
  );
}
function setProperty(object, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value
    });
  } else {
    object[key] = value;
  }
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}
function State$1(input, options) {
  this.input = input;
  this.filename = options["filename"] || null;
  this.schema = options["schema"] || DEFAULT_SCHEMA$1;
  this.onWarning = options["onWarning"] || null;
  this.legacy = options["legacy"] || false;
  this.json = options["json"] || false;
  this.listener = options["listener"] || null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;
  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0;
  this.firstTabInLine = -1;
  this.documents = [];
}
function generateError(state, message) {
  var mark = {
    name: state.filename,
    buffer: state.input.slice(0, -1),
    // omit trailing \0
    position: state.position,
    line: state.line,
    column: state.position - state.lineStart
  };
  mark.snippet = makeSnippet(mark);
  return new YAMLException$1(message, mark);
}
function throwError(state, message) {
  throw generateError(state, message);
}
function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}
var directiveHandlers = {
  YAML: function handleYamlDirective(state, name, args) {
    var match, major2, minor2;
    if (state.version !== null) {
      throwError(state, "duplication of %YAML directive");
    }
    if (args.length !== 1) {
      throwError(state, "YAML directive accepts exactly one argument");
    }
    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match === null) {
      throwError(state, "ill-formed argument of the YAML directive");
    }
    major2 = parseInt(match[1], 10);
    minor2 = parseInt(match[2], 10);
    if (major2 !== 1) {
      throwError(state, "unacceptable YAML version of the document");
    }
    state.version = args[0];
    state.checkLineBreaks = minor2 < 2;
    if (minor2 !== 1 && minor2 !== 2) {
      throwWarning(state, "unsupported YAML version of the document");
    }
  },
  TAG: function handleTagDirective(state, name, args) {
    var handle, prefix;
    if (args.length !== 2) {
      throwError(state, "TAG directive accepts exactly two arguments");
    }
    handle = args[0];
    prefix = args[1];
    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    }
    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }
    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    }
    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, "tag prefix is malformed: " + prefix);
    }
    state.tagMap[handle] = prefix;
  }
};
function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;
  if (start < end) {
    _result = state.input.slice(start, end);
    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
          throwError(state, "expected valid JSON character");
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, "the stream contains non-printable characters");
    }
    state.result += _result;
  }
}
function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;
  if (!common$1.isObject(source)) {
    throwError(state, "cannot merge mappings; the provided source object is unacceptable");
  }
  sourceKeys = Object.keys(source);
  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];
    if (!_hasOwnProperty$1.call(destination, key)) {
      setProperty(destination, key, source[key]);
      overridableKeys[key] = true;
    }
  }
}
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
  var index, quantity;
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);
    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, "nested arrays are not supported inside keys");
      }
      if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
        keyNode[index] = "[object Object]";
      }
    }
  }
  if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
    keyNode = "[object Object]";
  }
  keyNode = String(keyNode);
  if (_result === null) {
    _result = {};
  }
  if (keyTag === "tag:yaml.org,2002:merge") {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, "duplicated mapping key");
    }
    setProperty(_result, keyNode, valueNode);
    delete overridableKeys[keyNode];
  }
  return _result;
}
function readLineBreak(state) {
  var ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 10) {
    state.position++;
  } else if (ch === 13) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) {
      state.position++;
    }
  } else {
    throwError(state, "a line break is expected");
  }
  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 9 && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 10 && ch !== 13 && ch !== 0);
    }
    if (is_EOL(ch)) {
      readLineBreak(state);
      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;
      while (ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }
  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, "deficient indentation");
  }
  return lineBreaks;
}
function testDocumentSeparator(state) {
  var _position = state.position, ch;
  ch = state.input.charCodeAt(_position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
    _position += 3;
    ch = state.input.charCodeAt(_position);
    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }
  return false;
}
function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += " ";
  } else if (count > 1) {
    state.result += common$1.repeat("\n", count - 1);
  }
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
  ch = state.input.charCodeAt(state.position);
  if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
    return false;
  }
  if (ch === 63 || ch === 45) {
    following = state.input.charCodeAt(state.position + 1);
    if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }
  state.kind = "scalar";
  state.result = "";
  captureStart = captureEnd = state.position;
  hasPendingContent = false;
  while (ch !== 0) {
    if (ch === 58) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }
    } else if (ch === 35) {
      preceding = state.input.charCodeAt(state.position - 1);
      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;
    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);
      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }
    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }
    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }
    ch = state.input.charCodeAt(++state.position);
  }
  captureSegment(state, captureStart, captureEnd, false);
  if (state.result) {
    return true;
  }
  state.kind = _kind;
  state.result = _result;
  return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
  var ch, captureStart, captureEnd;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 39) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 39) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (ch === 39) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a single quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 34) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 34) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    } else if (ch === 92) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;
        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);
          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, "expected hexadecimal character");
          }
        }
        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else {
        throwError(state, "unknown escape sequence");
      }
      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a double quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
  var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = /* @__PURE__ */ Object.create(null), keyNode, keyTag, valueNode, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 91) {
    terminator = 93;
    isMapping = false;
    _result = [];
  } else if (ch === 123) {
    terminator = 125;
    isMapping = true;
    _result = {};
  } else {
    return false;
  }
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(++state.position);
  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? "mapping" : "sequence";
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, "missed comma between flow collection entries");
    } else if (ch === 44) {
      throwError(state, "expected the node content, but found ','");
    }
    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;
    if (ch === 63) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }
    _line = state.line;
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if ((isExplicitPair || state.line === _line) && ch === 58) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }
    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === 44) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
  var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 124) {
    folding = false;
  } else if (ch === 62) {
    folding = true;
  } else {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);
    if (ch === 43 || ch === 45) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, "repeat of a chomping mode identifier");
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, "repeat of an indentation width identifier");
      }
    } else {
      break;
    }
  }
  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));
    if (ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }
  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;
    ch = state.input.charCodeAt(state.position);
    while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }
    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }
    if (state.lineIndent < textIndent) {
      if (chomping === CHOMPING_KEEP) {
        state.result += common$1.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          state.result += "\n";
        }
      }
      break;
    }
    if (folding) {
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        state.result += common$1.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common$1.repeat("\n", emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) {
          state.result += " ";
        }
      } else {
        state.result += common$1.repeat("\n", emptyLines);
      }
    } else {
      state.result += common$1.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
    }
    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;
    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, state.position, false);
  }
  return true;
}
function readBlockSequence(state, nodeIndent) {
  var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    if (ch !== 45) {
      break;
    }
    following = state.input.charCodeAt(state.position + 1);
    if (!is_WS_OR_EOL(following)) {
      break;
    }
    detected = true;
    state.position++;
    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }
    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a sequence entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "sequence";
    state.result = _result;
    return true;
  }
  return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
  var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = /* @__PURE__ */ Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line;
    if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
      if (ch === 63) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        atExplicitKey = false;
        allowCompact = true;
      } else {
        throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
      }
      state.position += 1;
      ch = following;
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;
      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        break;
      }
      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!is_WS_OR_EOL(ch)) {
            throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          }
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(state, "can not read an implicit mapping pair; a colon is missed");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      } else if (detected) {
        throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true;
      }
    }
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }
      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a mapping entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "mapping";
    state.result = _result;
  }
  return detected;
}
function readTagProperty(state) {
  var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 33) return false;
  if (state.tag !== null) {
    throwError(state, "duplication of a tag property");
  }
  ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = "!";
  }
  _position = state.position;
  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 62);
    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, "unexpected end of the stream within a verbatim tag");
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 33) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, "named tag handle cannot contain such characters");
          }
          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, "tag suffix cannot contain exclamation marks");
        }
      }
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(_position, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, "tag suffix cannot contain flow indicator characters");
    }
  }
  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, "tag name cannot contain such characters: " + tagName);
  }
  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, "tag name is malformed: " + tagName);
  }
  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === "!") {
    state.tag = "!" + tagName;
  } else if (tagHandle === "!!") {
    state.tag = "tag:yaml.org,2002:" + tagName;
  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }
  return true;
}
function readAnchorProperty(state) {
  var _position, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 38) return false;
  if (state.anchor !== null) {
    throwError(state, "duplication of an anchor property");
  }
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an anchor node must contain at least one character");
  }
  state.anchor = state.input.slice(_position, state.position);
  return true;
}
function readAlias(state) {
  var _position, alias, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 42) return false;
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an alias node must contain at least one character");
  }
  alias = state.input.slice(_position, state.position);
  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }
  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type2, flowIndent, blockIndent;
  if (state.listener !== null) {
    state.listener("open", state);
  }
  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;
  allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;
      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }
  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }
  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }
  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }
    blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;
          if (state.tag !== null || state.anchor !== null) {
            throwError(state, "alias node should not have any properties");
          }
        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;
          if (state.tag === null) {
            state.tag = "?";
          }
        }
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }
  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }
  } else if (state.tag === "?") {
    if (state.result !== null && state.kind !== "scalar") {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }
    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type2 = state.implicitTypes[typeIndex];
      if (type2.resolve(state.result)) {
        state.result = type2.construct(state.result);
        state.tag = type2.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== "!") {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
      type2 = state.typeMap[state.kind || "fallback"][state.tag];
    } else {
      type2 = null;
      typeList = state.typeMap.multi[state.kind || "fallback"];
      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type2 = typeList[typeIndex];
          break;
        }
      }
    }
    if (!type2) {
      throwError(state, "unknown tag !<" + state.tag + ">");
    }
    if (state.result !== null && type2.kind !== state.kind) {
      throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
    }
    if (!type2.resolve(state.result, state.tag)) {
      throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
    } else {
      state.result = type2.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }
  if (state.listener !== null) {
    state.listener("close", state);
  }
  return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
  var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = /* @__PURE__ */ Object.create(null);
  state.anchorMap = /* @__PURE__ */ Object.create(null);
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if (state.lineIndent > 0 || ch !== 37) {
      break;
    }
    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];
    if (directiveName.length < 1) {
      throwError(state, "directive name must not be less than one character in length");
    }
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));
        break;
      }
      if (is_EOL(ch)) break;
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveArgs.push(state.input.slice(_position, state.position));
    }
    if (ch !== 0) readLineBreak(state);
    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }
  skipSeparationSpace(state, true, -1);
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, "directives end mark is expected");
  }
  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);
  if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, "non-ASCII line breaks are interpreted as content");
  }
  state.documents.push(state.result);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 46) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }
  if (state.position < state.length - 1) {
    throwError(state, "end of the stream or a document separator is expected");
  } else {
    return;
  }
}
function loadDocuments(input, options) {
  input = String(input);
  options = options || {};
  if (input.length !== 0) {
    if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
      input += "\n";
    }
    if (input.charCodeAt(0) === 65279) {
      input = input.slice(1);
    }
  }
  var state = new State$1(input, options);
  var nullpos = input.indexOf("\0");
  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, "null byte is not allowed in input");
  }
  state.input += "\0";
  while (state.input.charCodeAt(state.position) === 32) {
    state.lineIndent += 1;
    state.position += 1;
  }
  while (state.position < state.length - 1) {
    readDocument(state);
  }
  return state.documents;
}
function loadAll(input, iterator, options) {
  if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
    options = iterator;
    iterator = null;
  }
  var documents = loadDocuments(input, options);
  if (typeof iterator !== "function") {
    return documents;
  }
  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}
function load(input, options) {
  var documents = loadDocuments(input, options);
  if (documents.length === 0) {
    return void 0;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new YAMLException$1("expected a single document in the stream, but found more");
}
loader$1.loadAll = loadAll;
loader$1.load = load;
var dumper$1 = {};
var common = common$5;
var YAMLException = exception;
var DEFAULT_SCHEMA = _default;
var _toString = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var CHAR_BOM = 65279;
var CHAR_TAB = 9;
var CHAR_LINE_FEED = 10;
var CHAR_CARRIAGE_RETURN = 13;
var CHAR_SPACE = 32;
var CHAR_EXCLAMATION = 33;
var CHAR_DOUBLE_QUOTE = 34;
var CHAR_SHARP = 35;
var CHAR_PERCENT = 37;
var CHAR_AMPERSAND = 38;
var CHAR_SINGLE_QUOTE = 39;
var CHAR_ASTERISK = 42;
var CHAR_COMMA = 44;
var CHAR_MINUS = 45;
var CHAR_COLON = 58;
var CHAR_EQUALS = 61;
var CHAR_GREATER_THAN = 62;
var CHAR_QUESTION = 63;
var CHAR_COMMERCIAL_AT = 64;
var CHAR_LEFT_SQUARE_BRACKET = 91;
var CHAR_RIGHT_SQUARE_BRACKET = 93;
var CHAR_GRAVE_ACCENT = 96;
var CHAR_LEFT_CURLY_BRACKET = 123;
var CHAR_VERTICAL_LINE = 124;
var CHAR_RIGHT_CURLY_BRACKET = 125;
var ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0] = "\\0";
ESCAPE_SEQUENCES[7] = "\\a";
ESCAPE_SEQUENCES[8] = "\\b";
ESCAPE_SEQUENCES[9] = "\\t";
ESCAPE_SEQUENCES[10] = "\\n";
ESCAPE_SEQUENCES[11] = "\\v";
ESCAPE_SEQUENCES[12] = "\\f";
ESCAPE_SEQUENCES[13] = "\\r";
ESCAPE_SEQUENCES[27] = "\\e";
ESCAPE_SEQUENCES[34] = '\\"';
ESCAPE_SEQUENCES[92] = "\\\\";
ESCAPE_SEQUENCES[133] = "\\N";
ESCAPE_SEQUENCES[160] = "\\_";
ESCAPE_SEQUENCES[8232] = "\\L";
ESCAPE_SEQUENCES[8233] = "\\P";
var DEPRECATED_BOOLEANS_SYNTAX = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
];
var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function compileStyleMap(schema2, map2) {
  var result, keys, index, length, tag, style, type2;
  if (map2 === null) return {};
  result = {};
  keys = Object.keys(map2);
  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map2[tag]);
    if (tag.slice(0, 2) === "!!") {
      tag = "tag:yaml.org,2002:" + tag.slice(2);
    }
    type2 = schema2.compiledTypeMap["fallback"][tag];
    if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
      style = type2.styleAliases[style];
    }
    result[tag] = style;
  }
  return result;
}
function encodeHex(character) {
  var string, handle, length;
  string = character.toString(16).toUpperCase();
  if (character <= 255) {
    handle = "x";
    length = 2;
  } else if (character <= 65535) {
    handle = "u";
    length = 4;
  } else if (character <= 4294967295) {
    handle = "U";
    length = 8;
  } else {
    throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
  }
  return "\\" + handle + common.repeat("0", length - string.length) + string;
}
var QUOTING_TYPE_SINGLE = 1, QUOTING_TYPE_DOUBLE = 2;
function State(options) {
  this.schema = options["schema"] || DEFAULT_SCHEMA;
  this.indent = Math.max(1, options["indent"] || 2);
  this.noArrayIndent = options["noArrayIndent"] || false;
  this.skipInvalid = options["skipInvalid"] || false;
  this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
  this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
  this.sortKeys = options["sortKeys"] || false;
  this.lineWidth = options["lineWidth"] || 80;
  this.noRefs = options["noRefs"] || false;
  this.noCompatMode = options["noCompatMode"] || false;
  this.condenseFlow = options["condenseFlow"] || false;
  this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes = options["forceQuotes"] || false;
  this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;
  this.tag = null;
  this.result = "";
  this.duplicates = [];
  this.usedDuplicates = null;
}
function indentString(string, spaces) {
  var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
  while (position < length) {
    next = string.indexOf("\n", position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }
    if (line.length && line !== "\n") result += ind;
    result += line;
  }
  return result;
}
function generateNextLine(state, level) {
  return "\n" + common.repeat(" ", state.indent * level);
}
function testImplicitResolving(state, str2) {
  var index, length, type2;
  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type2 = state.implicitTypes[index];
    if (type2.resolve(str2)) {
      return true;
    }
  }
  return false;
}
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}
function isPrintable(c) {
  return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
}
function isNsCharOrWhitespace(c) {
  return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
}
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (
    // ns-plain-safe
    (inblock ? (
      // c = flow-in
      cIsNsCharOrWhitespace
    ) : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar
  );
}
function isPlainSafeFirst(c) {
  return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
}
function isPlainSafeLast(c) {
  return !isWhitespace(c) && c !== CHAR_COLON;
}
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 56320 && second <= 57343) {
      return (first - 55296) * 1024 + second - 56320 + 65536;
    }
  }
  return first;
}
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}
var STYLE_PLAIN = 1, STYLE_SINGLE = 2, STYLE_LITERAL = 3, STYLE_FOLDED = 4, STYLE_DOUBLE = 5;
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false;
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1;
  var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
  if (singleLineOnly || forceQuotes) {
    for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
          i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
  }
  if (!hasLineBreak && !hasFoldableLine) {
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = function() {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
      }
    }
    var indent = state.indent * Math.max(1, level);
    var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
    var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
    function testAmbiguity(string2) {
      return testImplicitResolving(state, string2);
    }
    switch (chooseScalarStyle(
      string,
      singleLineOnly,
      state.indent,
      lineWidth,
      testAmbiguity,
      state.quotingType,
      state.forceQuotes && !iskey,
      inblock
    )) {
      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';
      default:
        throw new YAMLException("impossible error: invalid scalar style");
    }
  }();
}
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
  var clip = string[string.length - 1] === "\n";
  var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
  var chomp = keep ? "+" : clip ? "" : "-";
  return indentIndicator + chomp + "\n";
}
function dropEndingNewline(string) {
  return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function foldString(string, width) {
  var lineRe = /(\n+)([^\n]*)/g;
  var result = function() {
    var nextLF = string.indexOf("\n");
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }();
  var prevMoreIndented = string[0] === "\n" || string[0] === " ";
  var moreIndented;
  var match;
  while (match = lineRe.exec(string)) {
    var prefix = match[1], line = match[2];
    moreIndented = line[0] === " ";
    result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }
  return result;
}
function foldLine(line, width) {
  if (line === "" || line[0] === " ") return line;
  var breakRe = / [^ ]/g;
  var match;
  var start = 0, end, curr = 0, next = 0;
  var result = "";
  while (match = breakRe.exec(line)) {
    next = match.index;
    if (next - start > width) {
      end = curr > start ? curr : next;
      result += "\n" + line.slice(start, end);
      start = end + 1;
    }
    curr = next;
  }
  result += "\n";
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }
  return result.slice(1);
}
function escapeString(string) {
  var result = "";
  var char = 0;
  var escapeSeq;
  for (var i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];
    if (!escapeSeq && isPrintable(char)) {
      result += string[i];
      if (char >= 65536) result += string[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }
  return result;
}
function writeFlowSequence(state, level, object) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
      if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = "[" + _result + "]";
}
function writeBlockSequence(state, level, object, compact) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
      if (!compact || _result !== "") {
        _result += generateNextLine(state, level);
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += "-";
      } else {
        _result += "- ";
      }
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = _result || "[]";
}
function writeFlowMapping(state, level, object) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (_result !== "") pairBuffer += ", ";
    if (state.condenseFlow) pairBuffer += '"';
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level, objectKey, false, false)) {
      continue;
    }
    if (state.dump.length > 1024) pairBuffer += "? ";
    pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
    if (!writeNode(state, level, objectValue, false, false)) {
      continue;
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = "{" + _result + "}";
}
function writeBlockMapping(state, level, object, compact) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
  if (state.sortKeys === true) {
    objectKeyList.sort();
  } else if (typeof state.sortKeys === "function") {
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    throw new YAMLException("sortKeys must be a boolean or a function");
  }
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (!compact || _result !== "") {
      pairBuffer += generateNextLine(state, level);
    }
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue;
    }
    explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += "?";
      } else {
        pairBuffer += "? ";
      }
    }
    pairBuffer += state.dump;
    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }
    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue;
    }
    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ":";
    } else {
      pairBuffer += ": ";
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = _result || "{}";
}
function detectType(state, object, explicit) {
  var _result, typeList, index, length, type2, style;
  typeList = explicit ? state.explicitTypes : state.implicitTypes;
  for (index = 0, length = typeList.length; index < length; index += 1) {
    type2 = typeList[index];
    if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
      if (explicit) {
        if (type2.multi && type2.representName) {
          state.tag = type2.representName(object);
        } else {
          state.tag = type2.tag;
        }
      } else {
        state.tag = "?";
      }
      if (type2.represent) {
        style = state.styleMap[type2.tag] || type2.defaultStyle;
        if (_toString.call(type2.represent) === "[object Function]") {
          _result = type2.represent(object, style);
        } else if (_hasOwnProperty.call(type2.represent, style)) {
          _result = type2.represent[style](object, style);
        } else {
          throw new YAMLException("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
        }
        state.dump = _result;
      }
      return true;
    }
  }
  return false;
}
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;
  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }
  var type2 = _toString.call(state.dump);
  var inblock = block;
  var tagStr;
  if (block) {
    block = state.flowLevel < 0 || state.flowLevel > level;
  }
  var objectOrArray = type2 === "[object Object]" || type2 === "[object Array]", duplicateIndex, duplicate;
  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }
  if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
    compact = false;
  }
  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = "*ref_" + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type2 === "[object Object]") {
      if (block && Object.keys(state.dump).length !== 0) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object Array]") {
      if (block && state.dump.length !== 0) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object String]") {
      if (state.tag !== "?") {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type2 === "[object Undefined]") {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new YAMLException("unacceptable kind of an object to dump " + type2);
    }
    if (state.tag !== null && state.tag !== "?") {
      tagStr = encodeURI(
        state.tag[0] === "!" ? state.tag.slice(1) : state.tag
      ).replace(/!/g, "%21");
      if (state.tag[0] === "!") {
        tagStr = "!" + tagStr;
      } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
        tagStr = "!!" + tagStr.slice(18);
      } else {
        tagStr = "!<" + tagStr + ">";
      }
      state.dump = tagStr + " " + state.dump;
    }
  }
  return true;
}
function getDuplicateReferences(object, state) {
  var objects2 = [], duplicatesIndexes = [], index, length;
  inspectNode(object, objects2, duplicatesIndexes);
  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects2[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}
function inspectNode(object, objects2, duplicatesIndexes) {
  var objectKeyList, index, length;
  if (object !== null && typeof object === "object") {
    index = objects2.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects2.push(object);
      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects2, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);
        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects2, duplicatesIndexes);
        }
      }
    }
  }
}
function dump(input, options) {
  options = options || {};
  var state = new State(options);
  if (!state.noRefs) getDuplicateReferences(input, state);
  var value = input;
  if (state.replacer) {
    value = state.replacer.call({ "": value }, "", value);
  }
  if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
  return "";
}
dumper$1.dump = dump;
var loader = loader$1;
var dumper = dumper$1;
function renamed(from, to) {
  return function() {
    throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
  };
}
jsYaml.Type = type;
jsYaml.Schema = schema;
jsYaml.FAILSAFE_SCHEMA = failsafe;
jsYaml.JSON_SCHEMA = json;
jsYaml.CORE_SCHEMA = core;
jsYaml.DEFAULT_SCHEMA = _default;
jsYaml.load = loader.load;
jsYaml.loadAll = loader.loadAll;
jsYaml.dump = dumper.dump;
jsYaml.YAMLException = exception;
jsYaml.types = {
  binary,
  float,
  map,
  null: _null,
  pairs,
  set,
  timestamp,
  bool,
  int,
  merge,
  omap,
  seq,
  str
};
jsYaml.safeLoad = renamed("safeLoad", "load");
jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
jsYaml.safeDump = renamed("safeDump", "dump");
var main = {};
Object.defineProperty(main, "__esModule", { value: true });
main.Lazy = void 0;
class Lazy {
  constructor(creator) {
    this._value = null;
    this.creator = creator;
  }
  get hasValue() {
    return this.creator == null;
  }
  get value() {
    if (this.creator == null) {
      return this._value;
    }
    const result = this.creator();
    this.value = result;
    return result;
  }
  set value(value) {
    this._value = value;
    this.creator = null;
  }
}
main.Lazy = Lazy;
var re$2 = { exports: {} };
const SEMVER_SPEC_VERSION = "2.0.0";
const MAX_LENGTH$1 = 256;
const MAX_SAFE_INTEGER$1 = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991;
const MAX_SAFE_COMPONENT_LENGTH = 16;
const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH$1 - 6;
const RELEASE_TYPES = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var constants$1 = {
  MAX_LENGTH: MAX_LENGTH$1,
  MAX_SAFE_COMPONENT_LENGTH,
  MAX_SAFE_BUILD_LENGTH,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1,
  RELEASE_TYPES,
  SEMVER_SPEC_VERSION,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const debug$1 = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
};
var debug_1 = debug$1;
(function(module2, exports) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: MAX_SAFE_COMPONENT_LENGTH2,
    MAX_SAFE_BUILD_LENGTH: MAX_SAFE_BUILD_LENGTH2,
    MAX_LENGTH: MAX_LENGTH2
  } = constants$1;
  const debug2 = debug_1;
  exports = module2.exports = {};
  const re2 = exports.re = [];
  const safeRe = exports.safeRe = [];
  const src2 = exports.src = [];
  const safeSrc = exports.safeSrc = [];
  const t2 = exports.t = {};
  let R = 0;
  const LETTERDASHNUMBER = "[a-zA-Z0-9-]";
  const safeRegexReplacements = [
    ["\\s", 1],
    ["\\d", MAX_LENGTH2],
    [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH2]
  ];
  const makeSafeRegex = (value) => {
    for (const [token, max] of safeRegexReplacements) {
      value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
    }
    return value;
  };
  const createToken = (name, value, isGlobal) => {
    const safe = makeSafeRegex(value);
    const index = R++;
    debug2(name, index, value);
    t2[name] = index;
    src2[index] = value;
    safeSrc[index] = safe;
    re2[index] = new RegExp(value, isGlobal ? "g" : void 0);
    safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
  };
  createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
  createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
  createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
  createToken("MAINVERSION", `(${src2[t2.NUMERICIDENTIFIER]})\\.(${src2[t2.NUMERICIDENTIFIER]})\\.(${src2[t2.NUMERICIDENTIFIER]})`);
  createToken("MAINVERSIONLOOSE", `(${src2[t2.NUMERICIDENTIFIERLOOSE]})\\.(${src2[t2.NUMERICIDENTIFIERLOOSE]})\\.(${src2[t2.NUMERICIDENTIFIERLOOSE]})`);
  createToken("PRERELEASEIDENTIFIER", `(?:${src2[t2.NONNUMERICIDENTIFIER]}|${src2[t2.NUMERICIDENTIFIER]})`);
  createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src2[t2.NONNUMERICIDENTIFIER]}|${src2[t2.NUMERICIDENTIFIERLOOSE]})`);
  createToken("PRERELEASE", `(?:-(${src2[t2.PRERELEASEIDENTIFIER]}(?:\\.${src2[t2.PRERELEASEIDENTIFIER]})*))`);
  createToken("PRERELEASELOOSE", `(?:-?(${src2[t2.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src2[t2.PRERELEASEIDENTIFIERLOOSE]})*))`);
  createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
  createToken("BUILD", `(?:\\+(${src2[t2.BUILDIDENTIFIER]}(?:\\.${src2[t2.BUILDIDENTIFIER]})*))`);
  createToken("FULLPLAIN", `v?${src2[t2.MAINVERSION]}${src2[t2.PRERELEASE]}?${src2[t2.BUILD]}?`);
  createToken("FULL", `^${src2[t2.FULLPLAIN]}$`);
  createToken("LOOSEPLAIN", `[v=\\s]*${src2[t2.MAINVERSIONLOOSE]}${src2[t2.PRERELEASELOOSE]}?${src2[t2.BUILD]}?`);
  createToken("LOOSE", `^${src2[t2.LOOSEPLAIN]}$`);
  createToken("GTLT", "((?:<|>)?=?)");
  createToken("XRANGEIDENTIFIERLOOSE", `${src2[t2.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
  createToken("XRANGEIDENTIFIER", `${src2[t2.NUMERICIDENTIFIER]}|x|X|\\*`);
  createToken("XRANGEPLAIN", `[v=\\s]*(${src2[t2.XRANGEIDENTIFIER]})(?:\\.(${src2[t2.XRANGEIDENTIFIER]})(?:\\.(${src2[t2.XRANGEIDENTIFIER]})(?:${src2[t2.PRERELEASE]})?${src2[t2.BUILD]}?)?)?`);
  createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src2[t2.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src2[t2.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src2[t2.XRANGEIDENTIFIERLOOSE]})(?:${src2[t2.PRERELEASELOOSE]})?${src2[t2.BUILD]}?)?)?`);
  createToken("XRANGE", `^${src2[t2.GTLT]}\\s*${src2[t2.XRANGEPLAIN]}$`);
  createToken("XRANGELOOSE", `^${src2[t2.GTLT]}\\s*${src2[t2.XRANGEPLAINLOOSE]}$`);
  createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH2}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH2}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH2}}))?`);
  createToken("COERCE", `${src2[t2.COERCEPLAIN]}(?:$|[^\\d])`);
  createToken("COERCEFULL", src2[t2.COERCEPLAIN] + `(?:${src2[t2.PRERELEASE]})?(?:${src2[t2.BUILD]})?(?:$|[^\\d])`);
  createToken("COERCERTL", src2[t2.COERCE], true);
  createToken("COERCERTLFULL", src2[t2.COERCEFULL], true);
  createToken("LONETILDE", "(?:~>?)");
  createToken("TILDETRIM", `(\\s*)${src2[t2.LONETILDE]}\\s+`, true);
  exports.tildeTrimReplace = "$1~";
  createToken("TILDE", `^${src2[t2.LONETILDE]}${src2[t2.XRANGEPLAIN]}$`);
  createToken("TILDELOOSE", `^${src2[t2.LONETILDE]}${src2[t2.XRANGEPLAINLOOSE]}$`);
  createToken("LONECARET", "(?:\\^)");
  createToken("CARETTRIM", `(\\s*)${src2[t2.LONECARET]}\\s+`, true);
  exports.caretTrimReplace = "$1^";
  createToken("CARET", `^${src2[t2.LONECARET]}${src2[t2.XRANGEPLAIN]}$`);
  createToken("CARETLOOSE", `^${src2[t2.LONECARET]}${src2[t2.XRANGEPLAINLOOSE]}$`);
  createToken("COMPARATORLOOSE", `^${src2[t2.GTLT]}\\s*(${src2[t2.LOOSEPLAIN]})$|^$`);
  createToken("COMPARATOR", `^${src2[t2.GTLT]}\\s*(${src2[t2.FULLPLAIN]})$|^$`);
  createToken("COMPARATORTRIM", `(\\s*)${src2[t2.GTLT]}\\s*(${src2[t2.LOOSEPLAIN]}|${src2[t2.XRANGEPLAIN]})`, true);
  exports.comparatorTrimReplace = "$1$2$3";
  createToken("HYPHENRANGE", `^\\s*(${src2[t2.XRANGEPLAIN]})\\s+-\\s+(${src2[t2.XRANGEPLAIN]})\\s*$`);
  createToken("HYPHENRANGELOOSE", `^\\s*(${src2[t2.XRANGEPLAINLOOSE]})\\s+-\\s+(${src2[t2.XRANGEPLAINLOOSE]})\\s*$`);
  createToken("STAR", "(<|>)?=?\\s*\\*");
  createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
  createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(re$2, re$2.exports);
var reExports = re$2.exports;
const looseOption = Object.freeze({ loose: true });
const emptyOpts = Object.freeze({});
const parseOptions$1 = (options) => {
  if (!options) {
    return emptyOpts;
  }
  if (typeof options !== "object") {
    return looseOption;
  }
  return options;
};
var parseOptions_1 = parseOptions$1;
const numeric = /^[0-9]+$/;
const compareIdentifiers$1 = (a, b) => {
  if (typeof a === "number" && typeof b === "number") {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  const anum = numeric.test(a);
  const bnum = numeric.test(b);
  if (anum && bnum) {
    a = +a;
    b = +b;
  }
  return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
};
const rcompareIdentifiers = (a, b) => compareIdentifiers$1(b, a);
var identifiers$1 = {
  compareIdentifiers: compareIdentifiers$1,
  rcompareIdentifiers
};
const debug = debug_1;
const { MAX_LENGTH, MAX_SAFE_INTEGER } = constants$1;
const { safeRe: re$1, t: t$1 } = reExports;
const parseOptions = parseOptions_1;
const { compareIdentifiers } = identifiers$1;
let SemVer$d = class SemVer {
  constructor(version, options) {
    options = parseOptions(options);
    if (version instanceof SemVer) {
      if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
        return version;
      } else {
        version = version.version;
      }
    } else if (typeof version !== "string") {
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
    }
    if (version.length > MAX_LENGTH) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH} characters`
      );
    }
    debug("SemVer", version, options);
    this.options = options;
    this.loose = !!options.loose;
    this.includePrerelease = !!options.includePrerelease;
    const m = version.trim().match(options.loose ? re$1[t$1.LOOSE] : re$1[t$1.FULL]);
    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`);
    }
    this.raw = version;
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];
    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
      throw new TypeError("Invalid major version");
    }
    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
      throw new TypeError("Invalid minor version");
    }
    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
      throw new TypeError("Invalid patch version");
    }
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split(".").map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num;
          }
        }
        return id;
      });
    }
    this.build = m[5] ? m[5].split(".") : [];
    this.format();
  }
  format() {
    this.version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join(".")}`;
    }
    return this.version;
  }
  toString() {
    return this.version;
  }
  compare(other) {
    debug("SemVer.compare", this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === "string" && other === this.version) {
        return 0;
      }
      other = new SemVer(other, this.options);
    }
    if (other.version === this.version) {
      return 0;
    }
    return this.compareMain(other) || this.comparePre(other);
  }
  compareMain(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    if (this.major < other.major) {
      return -1;
    }
    if (this.major > other.major) {
      return 1;
    }
    if (this.minor < other.minor) {
      return -1;
    }
    if (this.minor > other.minor) {
      return 1;
    }
    if (this.patch < other.patch) {
      return -1;
    }
    if (this.patch > other.patch) {
      return 1;
    }
    return 0;
  }
  comparePre(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    if (this.prerelease.length && !other.prerelease.length) {
      return -1;
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1;
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0;
    }
    let i = 0;
    do {
      const a = this.prerelease[i];
      const b = other.prerelease[i];
      debug("prerelease compare", i, a, b);
      if (a === void 0 && b === void 0) {
        return 0;
      } else if (b === void 0) {
        return 1;
      } else if (a === void 0) {
        return -1;
      } else if (a === b) {
        continue;
      } else {
        return compareIdentifiers(a, b);
      }
    } while (++i);
  }
  compareBuild(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    let i = 0;
    do {
      const a = this.build[i];
      const b = other.build[i];
      debug("build compare", i, a, b);
      if (a === void 0 && b === void 0) {
        return 0;
      } else if (b === void 0) {
        return 1;
      } else if (a === void 0) {
        return -1;
      } else if (a === b) {
        continue;
      } else {
        return compareIdentifiers(a, b);
      }
    } while (++i);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(release, identifier, identifierBase) {
    if (release.startsWith("pre")) {
      if (!identifier && identifierBase === false) {
        throw new Error("invalid increment argument: identifier is empty");
      }
      if (identifier) {
        const match = `-${identifier}`.match(this.options.loose ? re$1[t$1.PRERELEASELOOSE] : re$1[t$1.PRERELEASE]);
        if (!match || match[1] !== identifier) {
          throw new Error(`invalid identifier: ${identifier}`);
        }
      }
    }
    switch (release) {
      case "premajor":
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor = 0;
        this.major++;
        this.inc("pre", identifier, identifierBase);
        break;
      case "preminor":
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor++;
        this.inc("pre", identifier, identifierBase);
        break;
      case "prepatch":
        this.prerelease.length = 0;
        this.inc("patch", identifier, identifierBase);
        this.inc("pre", identifier, identifierBase);
        break;
      case "prerelease":
        if (this.prerelease.length === 0) {
          this.inc("patch", identifier, identifierBase);
        }
        this.inc("pre", identifier, identifierBase);
        break;
      case "release":
        if (this.prerelease.length === 0) {
          throw new Error(`version ${this.raw} is not a prerelease`);
        }
        this.prerelease.length = 0;
        break;
      case "major":
        if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
          this.major++;
        }
        this.minor = 0;
        this.patch = 0;
        this.prerelease = [];
        break;
      case "minor":
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++;
        }
        this.patch = 0;
        this.prerelease = [];
        break;
      case "patch":
        if (this.prerelease.length === 0) {
          this.patch++;
        }
        this.prerelease = [];
        break;
      case "pre": {
        const base = Number(identifierBase) ? 1 : 0;
        if (this.prerelease.length === 0) {
          this.prerelease = [base];
        } else {
          let i = this.prerelease.length;
          while (--i >= 0) {
            if (typeof this.prerelease[i] === "number") {
              this.prerelease[i]++;
              i = -2;
            }
          }
          if (i === -1) {
            if (identifier === this.prerelease.join(".") && identifierBase === false) {
              throw new Error("invalid increment argument: identifier already exists");
            }
            this.prerelease.push(base);
          }
        }
        if (identifier) {
          let prerelease2 = [identifier, base];
          if (identifierBase === false) {
            prerelease2 = [identifier];
          }
          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = prerelease2;
            }
          } else {
            this.prerelease = prerelease2;
          }
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${release}`);
    }
    this.raw = this.format();
    if (this.build.length) {
      this.raw += `+${this.build.join(".")}`;
    }
    return this;
  }
};
var semver$2 = SemVer$d;
const SemVer$c = semver$2;
const parse$6 = (version, options, throwErrors = false) => {
  if (version instanceof SemVer$c) {
    return version;
  }
  try {
    return new SemVer$c(version, options);
  } catch (er) {
    if (!throwErrors) {
      return null;
    }
    throw er;
  }
};
var parse_1 = parse$6;
const parse$5 = parse_1;
const valid$2 = (version, options) => {
  const v = parse$5(version, options);
  return v ? v.version : null;
};
var valid_1 = valid$2;
const parse$4 = parse_1;
const clean$1 = (version, options) => {
  const s = parse$4(version.trim().replace(/^[=v]+/, ""), options);
  return s ? s.version : null;
};
var clean_1 = clean$1;
const SemVer$b = semver$2;
const inc$1 = (version, release, options, identifier, identifierBase) => {
  if (typeof options === "string") {
    identifierBase = identifier;
    identifier = options;
    options = void 0;
  }
  try {
    return new SemVer$b(
      version instanceof SemVer$b ? version.version : version,
      options
    ).inc(release, identifier, identifierBase).version;
  } catch (er) {
    return null;
  }
};
var inc_1 = inc$1;
const parse$3 = parse_1;
const diff$1 = (version1, version2) => {
  const v1 = parse$3(version1, null, true);
  const v2 = parse$3(version2, null, true);
  const comparison = v1.compare(v2);
  if (comparison === 0) {
    return null;
  }
  const v1Higher = comparison > 0;
  const highVersion = v1Higher ? v1 : v2;
  const lowVersion = v1Higher ? v2 : v1;
  const highHasPre = !!highVersion.prerelease.length;
  const lowHasPre = !!lowVersion.prerelease.length;
  if (lowHasPre && !highHasPre) {
    if (!lowVersion.patch && !lowVersion.minor) {
      return "major";
    }
    if (lowVersion.compareMain(highVersion) === 0) {
      if (lowVersion.minor && !lowVersion.patch) {
        return "minor";
      }
      return "patch";
    }
  }
  const prefix = highHasPre ? "pre" : "";
  if (v1.major !== v2.major) {
    return prefix + "major";
  }
  if (v1.minor !== v2.minor) {
    return prefix + "minor";
  }
  if (v1.patch !== v2.patch) {
    return prefix + "patch";
  }
  return "prerelease";
};
var diff_1 = diff$1;
const SemVer$a = semver$2;
const major$1 = (a, loose) => new SemVer$a(a, loose).major;
var major_1 = major$1;
const SemVer$9 = semver$2;
const minor$1 = (a, loose) => new SemVer$9(a, loose).minor;
var minor_1 = minor$1;
const SemVer$8 = semver$2;
const patch$1 = (a, loose) => new SemVer$8(a, loose).patch;
var patch_1 = patch$1;
const parse$2 = parse_1;
const prerelease$1 = (version, options) => {
  const parsed = parse$2(version, options);
  return parsed && parsed.prerelease.length ? parsed.prerelease : null;
};
var prerelease_1 = prerelease$1;
const SemVer$7 = semver$2;
const compare$b = (a, b, loose) => new SemVer$7(a, loose).compare(new SemVer$7(b, loose));
var compare_1 = compare$b;
const compare$a = compare_1;
const rcompare$1 = (a, b, loose) => compare$a(b, a, loose);
var rcompare_1 = rcompare$1;
const compare$9 = compare_1;
const compareLoose$1 = (a, b) => compare$9(a, b, true);
var compareLoose_1 = compareLoose$1;
const SemVer$6 = semver$2;
const compareBuild$3 = (a, b, loose) => {
  const versionA = new SemVer$6(a, loose);
  const versionB = new SemVer$6(b, loose);
  return versionA.compare(versionB) || versionA.compareBuild(versionB);
};
var compareBuild_1 = compareBuild$3;
const compareBuild$2 = compareBuild_1;
const sort$1 = (list, loose) => list.sort((a, b) => compareBuild$2(a, b, loose));
var sort_1 = sort$1;
const compareBuild$1 = compareBuild_1;
const rsort$1 = (list, loose) => list.sort((a, b) => compareBuild$1(b, a, loose));
var rsort_1 = rsort$1;
const compare$8 = compare_1;
const gt$4 = (a, b, loose) => compare$8(a, b, loose) > 0;
var gt_1 = gt$4;
const compare$7 = compare_1;
const lt$3 = (a, b, loose) => compare$7(a, b, loose) < 0;
var lt_1 = lt$3;
const compare$6 = compare_1;
const eq$2 = (a, b, loose) => compare$6(a, b, loose) === 0;
var eq_1 = eq$2;
const compare$5 = compare_1;
const neq$2 = (a, b, loose) => compare$5(a, b, loose) !== 0;
var neq_1 = neq$2;
const compare$4 = compare_1;
const gte$3 = (a, b, loose) => compare$4(a, b, loose) >= 0;
var gte_1 = gte$3;
const compare$3 = compare_1;
const lte$3 = (a, b, loose) => compare$3(a, b, loose) <= 0;
var lte_1 = lte$3;
const eq$1 = eq_1;
const neq$1 = neq_1;
const gt$3 = gt_1;
const gte$2 = gte_1;
const lt$2 = lt_1;
const lte$2 = lte_1;
const cmp$1 = (a, op, b, loose) => {
  switch (op) {
    case "===":
      if (typeof a === "object") {
        a = a.version;
      }
      if (typeof b === "object") {
        b = b.version;
      }
      return a === b;
    case "!==":
      if (typeof a === "object") {
        a = a.version;
      }
      if (typeof b === "object") {
        b = b.version;
      }
      return a !== b;
    case "":
    case "=":
    case "==":
      return eq$1(a, b, loose);
    case "!=":
      return neq$1(a, b, loose);
    case ">":
      return gt$3(a, b, loose);
    case ">=":
      return gte$2(a, b, loose);
    case "<":
      return lt$2(a, b, loose);
    case "<=":
      return lte$2(a, b, loose);
    default:
      throw new TypeError(`Invalid operator: ${op}`);
  }
};
var cmp_1 = cmp$1;
const SemVer$5 = semver$2;
const parse$1 = parse_1;
const { safeRe: re, t } = reExports;
const coerce$1 = (version, options) => {
  if (version instanceof SemVer$5) {
    return version;
  }
  if (typeof version === "number") {
    version = String(version);
  }
  if (typeof version !== "string") {
    return null;
  }
  options = options || {};
  let match = null;
  if (!options.rtl) {
    match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
  } else {
    const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
    let next;
    while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
      if (!match || next.index + next[0].length !== match.index + match[0].length) {
        match = next;
      }
      coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
    }
    coerceRtlRegex.lastIndex = -1;
  }
  if (match === null) {
    return null;
  }
  const major2 = match[2];
  const minor2 = match[3] || "0";
  const patch2 = match[4] || "0";
  const prerelease2 = options.includePrerelease && match[5] ? `-${match[5]}` : "";
  const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
  return parse$1(`${major2}.${minor2}.${patch2}${prerelease2}${build}`, options);
};
var coerce_1 = coerce$1;
class LRUCache {
  constructor() {
    this.max = 1e3;
    this.map = /* @__PURE__ */ new Map();
  }
  get(key) {
    const value = this.map.get(key);
    if (value === void 0) {
      return void 0;
    } else {
      this.map.delete(key);
      this.map.set(key, value);
      return value;
    }
  }
  delete(key) {
    return this.map.delete(key);
  }
  set(key, value) {
    const deleted = this.delete(key);
    if (!deleted && value !== void 0) {
      if (this.map.size >= this.max) {
        const firstKey = this.map.keys().next().value;
        this.delete(firstKey);
      }
      this.map.set(key, value);
    }
    return this;
  }
}
var lrucache = LRUCache;
var range;
var hasRequiredRange;
function requireRange() {
  if (hasRequiredRange) return range;
  hasRequiredRange = 1;
  const SPACE_CHARACTERS = /\s+/g;
  class Range2 {
    constructor(range2, options) {
      options = parseOptions2(options);
      if (range2 instanceof Range2) {
        if (range2.loose === !!options.loose && range2.includePrerelease === !!options.includePrerelease) {
          return range2;
        } else {
          return new Range2(range2.raw, options);
        }
      }
      if (range2 instanceof Comparator2) {
        this.raw = range2.value;
        this.set = [[range2]];
        this.formatted = void 0;
        return this;
      }
      this.options = options;
      this.loose = !!options.loose;
      this.includePrerelease = !!options.includePrerelease;
      this.raw = range2.trim().replace(SPACE_CHARACTERS, " ");
      this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
      if (!this.set.length) {
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      }
      if (this.set.length > 1) {
        const first = this.set[0];
        this.set = this.set.filter((c) => !isNullSet(c[0]));
        if (this.set.length === 0) {
          this.set = [first];
        } else if (this.set.length > 1) {
          for (const c of this.set) {
            if (c.length === 1 && isAny(c[0])) {
              this.set = [c];
              break;
            }
          }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let i = 0; i < this.set.length; i++) {
          if (i > 0) {
            this.formatted += "||";
          }
          const comps = this.set[i];
          for (let k = 0; k < comps.length; k++) {
            if (k > 0) {
              this.formatted += " ";
            }
            this.formatted += comps[k].toString().trim();
          }
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(range2) {
      const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
      const memoKey = memoOpts + ":" + range2;
      const cached = cache.get(memoKey);
      if (cached) {
        return cached;
      }
      const loose = this.options.loose;
      const hr = loose ? re2[t2.HYPHENRANGELOOSE] : re2[t2.HYPHENRANGE];
      range2 = range2.replace(hr, hyphenReplace(this.options.includePrerelease));
      debug2("hyphen replace", range2);
      range2 = range2.replace(re2[t2.COMPARATORTRIM], comparatorTrimReplace);
      debug2("comparator trim", range2);
      range2 = range2.replace(re2[t2.TILDETRIM], tildeTrimReplace);
      debug2("tilde trim", range2);
      range2 = range2.replace(re2[t2.CARETTRIM], caretTrimReplace);
      debug2("caret trim", range2);
      let rangeList = range2.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
      if (loose) {
        rangeList = rangeList.filter((comp) => {
          debug2("loose invalid filter", comp, this.options);
          return !!comp.match(re2[t2.COMPARATORLOOSE]);
        });
      }
      debug2("range list", rangeList);
      const rangeMap = /* @__PURE__ */ new Map();
      const comparators = rangeList.map((comp) => new Comparator2(comp, this.options));
      for (const comp of comparators) {
        if (isNullSet(comp)) {
          return [comp];
        }
        rangeMap.set(comp.value, comp);
      }
      if (rangeMap.size > 1 && rangeMap.has("")) {
        rangeMap.delete("");
      }
      const result = [...rangeMap.values()];
      cache.set(memoKey, result);
      return result;
    }
    intersects(range2, options) {
      if (!(range2 instanceof Range2)) {
        throw new TypeError("a Range is required");
      }
      return this.set.some((thisComparators) => {
        return isSatisfiable(thisComparators, options) && range2.set.some((rangeComparators) => {
          return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
            return rangeComparators.every((rangeComparator) => {
              return thisComparator.intersects(rangeComparator, options);
            });
          });
        });
      });
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(version) {
      if (!version) {
        return false;
      }
      if (typeof version === "string") {
        try {
          version = new SemVer3(version, this.options);
        } catch (er) {
          return false;
        }
      }
      for (let i = 0; i < this.set.length; i++) {
        if (testSet(this.set[i], version, this.options)) {
          return true;
        }
      }
      return false;
    }
  }
  range = Range2;
  const LRU = lrucache;
  const cache = new LRU();
  const parseOptions2 = parseOptions_1;
  const Comparator2 = requireComparator();
  const debug2 = debug_1;
  const SemVer3 = semver$2;
  const {
    safeRe: re2,
    t: t2,
    comparatorTrimReplace,
    tildeTrimReplace,
    caretTrimReplace
  } = reExports;
  const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = constants$1;
  const isNullSet = (c) => c.value === "<0.0.0-0";
  const isAny = (c) => c.value === "";
  const isSatisfiable = (comparators, options) => {
    let result = true;
    const remainingComparators = comparators.slice();
    let testComparator = remainingComparators.pop();
    while (result && remainingComparators.length) {
      result = remainingComparators.every((otherComparator) => {
        return testComparator.intersects(otherComparator, options);
      });
      testComparator = remainingComparators.pop();
    }
    return result;
  };
  const parseComparator = (comp, options) => {
    comp = comp.replace(re2[t2.BUILD], "");
    debug2("comp", comp, options);
    comp = replaceCarets(comp, options);
    debug2("caret", comp);
    comp = replaceTildes(comp, options);
    debug2("tildes", comp);
    comp = replaceXRanges(comp, options);
    debug2("xrange", comp);
    comp = replaceStars(comp, options);
    debug2("stars", comp);
    return comp;
  };
  const isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
  const replaceTildes = (comp, options) => {
    return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
  };
  const replaceTilde = (comp, options) => {
    const r = options.loose ? re2[t2.TILDELOOSE] : re2[t2.TILDE];
    return comp.replace(r, (_, M, m, p, pr) => {
      debug2("tilde", comp, _, M, m, p, pr);
      let ret;
      if (isX(M)) {
        ret = "";
      } else if (isX(m)) {
        ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
      } else if (isX(p)) {
        ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
      } else if (pr) {
        debug2("replaceTilde pr", pr);
        ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
      } else {
        ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
      }
      debug2("tilde return", ret);
      return ret;
    });
  };
  const replaceCarets = (comp, options) => {
    return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
  };
  const replaceCaret = (comp, options) => {
    debug2("caret", comp, options);
    const r = options.loose ? re2[t2.CARETLOOSE] : re2[t2.CARET];
    const z = options.includePrerelease ? "-0" : "";
    return comp.replace(r, (_, M, m, p, pr) => {
      debug2("caret", comp, _, M, m, p, pr);
      let ret;
      if (isX(M)) {
        ret = "";
      } else if (isX(m)) {
        ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
      } else if (isX(p)) {
        if (M === "0") {
          ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
        }
      } else if (pr) {
        debug2("replaceCaret pr", pr);
        if (M === "0") {
          if (m === "0") {
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
          }
        } else {
          ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
        }
      } else {
        debug2("no pr");
        if (M === "0") {
          if (m === "0") {
            ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
          } else {
            ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
          }
        } else {
          ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
        }
      }
      debug2("caret return", ret);
      return ret;
    });
  };
  const replaceXRanges = (comp, options) => {
    debug2("replaceXRanges", comp, options);
    return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
  };
  const replaceXRange = (comp, options) => {
    comp = comp.trim();
    const r = options.loose ? re2[t2.XRANGELOOSE] : re2[t2.XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
      debug2("xRange", comp, ret, gtlt, M, m, p, pr);
      const xM = isX(M);
      const xm = xM || isX(m);
      const xp = xm || isX(p);
      const anyX = xp;
      if (gtlt === "=" && anyX) {
        gtlt = "";
      }
      pr = options.includePrerelease ? "-0" : "";
      if (xM) {
        if (gtlt === ">" || gtlt === "<") {
          ret = "<0.0.0-0";
        } else {
          ret = "*";
        }
      } else if (gtlt && anyX) {
        if (xm) {
          m = 0;
        }
        p = 0;
        if (gtlt === ">") {
          gtlt = ">=";
          if (xm) {
            M = +M + 1;
            m = 0;
            p = 0;
          } else {
            m = +m + 1;
            p = 0;
          }
        } else if (gtlt === "<=") {
          gtlt = "<";
          if (xm) {
            M = +M + 1;
          } else {
            m = +m + 1;
          }
        }
        if (gtlt === "<") {
          pr = "-0";
        }
        ret = `${gtlt + M}.${m}.${p}${pr}`;
      } else if (xm) {
        ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
      } else if (xp) {
        ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
      }
      debug2("xRange return", ret);
      return ret;
    });
  };
  const replaceStars = (comp, options) => {
    debug2("replaceStars", comp, options);
    return comp.trim().replace(re2[t2.STAR], "");
  };
  const replaceGTE0 = (comp, options) => {
    debug2("replaceGTE0", comp, options);
    return comp.trim().replace(re2[options.includePrerelease ? t2.GTE0PRE : t2.GTE0], "");
  };
  const hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
    if (isX(fM)) {
      from = "";
    } else if (isX(fm)) {
      from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
    } else if (isX(fp)) {
      from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
    } else if (fpr) {
      from = `>=${from}`;
    } else {
      from = `>=${from}${incPr ? "-0" : ""}`;
    }
    if (isX(tM)) {
      to = "";
    } else if (isX(tm)) {
      to = `<${+tM + 1}.0.0-0`;
    } else if (isX(tp)) {
      to = `<${tM}.${+tm + 1}.0-0`;
    } else if (tpr) {
      to = `<=${tM}.${tm}.${tp}-${tpr}`;
    } else if (incPr) {
      to = `<${tM}.${tm}.${+tp + 1}-0`;
    } else {
      to = `<=${to}`;
    }
    return `${from} ${to}`.trim();
  };
  const testSet = (set2, version, options) => {
    for (let i = 0; i < set2.length; i++) {
      if (!set2[i].test(version)) {
        return false;
      }
    }
    if (version.prerelease.length && !options.includePrerelease) {
      for (let i = 0; i < set2.length; i++) {
        debug2(set2[i].semver);
        if (set2[i].semver === Comparator2.ANY) {
          continue;
        }
        if (set2[i].semver.prerelease.length > 0) {
          const allowed = set2[i].semver;
          if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
            return true;
          }
        }
      }
      return false;
    }
    return true;
  };
  return range;
}
var comparator;
var hasRequiredComparator;
function requireComparator() {
  if (hasRequiredComparator) return comparator;
  hasRequiredComparator = 1;
  const ANY2 = Symbol("SemVer ANY");
  class Comparator2 {
    static get ANY() {
      return ANY2;
    }
    constructor(comp, options) {
      options = parseOptions2(options);
      if (comp instanceof Comparator2) {
        if (comp.loose === !!options.loose) {
          return comp;
        } else {
          comp = comp.value;
        }
      }
      comp = comp.trim().split(/\s+/).join(" ");
      debug2("comparator", comp, options);
      this.options = options;
      this.loose = !!options.loose;
      this.parse(comp);
      if (this.semver === ANY2) {
        this.value = "";
      } else {
        this.value = this.operator + this.semver.version;
      }
      debug2("comp", this);
    }
    parse(comp) {
      const r = this.options.loose ? re2[t2.COMPARATORLOOSE] : re2[t2.COMPARATOR];
      const m = comp.match(r);
      if (!m) {
        throw new TypeError(`Invalid comparator: ${comp}`);
      }
      this.operator = m[1] !== void 0 ? m[1] : "";
      if (this.operator === "=") {
        this.operator = "";
      }
      if (!m[2]) {
        this.semver = ANY2;
      } else {
        this.semver = new SemVer3(m[2], this.options.loose);
      }
    }
    toString() {
      return this.value;
    }
    test(version) {
      debug2("Comparator.test", version, this.options.loose);
      if (this.semver === ANY2 || version === ANY2) {
        return true;
      }
      if (typeof version === "string") {
        try {
          version = new SemVer3(version, this.options);
        } catch (er) {
          return false;
        }
      }
      return cmp2(version, this.operator, this.semver, this.options);
    }
    intersects(comp, options) {
      if (!(comp instanceof Comparator2)) {
        throw new TypeError("a Comparator is required");
      }
      if (this.operator === "") {
        if (this.value === "") {
          return true;
        }
        return new Range2(comp.value, options).test(this.value);
      } else if (comp.operator === "") {
        if (comp.value === "") {
          return true;
        }
        return new Range2(this.value, options).test(comp.semver);
      }
      options = parseOptions2(options);
      if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
        return false;
      }
      if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
        return false;
      }
      if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
        return true;
      }
      if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
        return true;
      }
      if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
        return true;
      }
      if (cmp2(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
        return true;
      }
      if (cmp2(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
        return true;
      }
      return false;
    }
  }
  comparator = Comparator2;
  const parseOptions2 = parseOptions_1;
  const { safeRe: re2, t: t2 } = reExports;
  const cmp2 = cmp_1;
  const debug2 = debug_1;
  const SemVer3 = semver$2;
  const Range2 = requireRange();
  return comparator;
}
const Range$9 = requireRange();
const satisfies$4 = (version, range2, options) => {
  try {
    range2 = new Range$9(range2, options);
  } catch (er) {
    return false;
  }
  return range2.test(version);
};
var satisfies_1 = satisfies$4;
const Range$8 = requireRange();
const toComparators$1 = (range2, options) => new Range$8(range2, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
var toComparators_1 = toComparators$1;
const SemVer$4 = semver$2;
const Range$7 = requireRange();
const maxSatisfying$1 = (versions, range2, options) => {
  let max = null;
  let maxSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$7(range2, options);
  } catch (er) {
    return null;
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      if (!max || maxSV.compare(v) === -1) {
        max = v;
        maxSV = new SemVer$4(max, options);
      }
    }
  });
  return max;
};
var maxSatisfying_1 = maxSatisfying$1;
const SemVer$3 = semver$2;
const Range$6 = requireRange();
const minSatisfying$1 = (versions, range2, options) => {
  let min = null;
  let minSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$6(range2, options);
  } catch (er) {
    return null;
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      if (!min || minSV.compare(v) === 1) {
        min = v;
        minSV = new SemVer$3(min, options);
      }
    }
  });
  return min;
};
var minSatisfying_1 = minSatisfying$1;
const SemVer$2 = semver$2;
const Range$5 = requireRange();
const gt$2 = gt_1;
const minVersion$1 = (range2, loose) => {
  range2 = new Range$5(range2, loose);
  let minver = new SemVer$2("0.0.0");
  if (range2.test(minver)) {
    return minver;
  }
  minver = new SemVer$2("0.0.0-0");
  if (range2.test(minver)) {
    return minver;
  }
  minver = null;
  for (let i = 0; i < range2.set.length; ++i) {
    const comparators = range2.set[i];
    let setMin = null;
    comparators.forEach((comparator2) => {
      const compver = new SemVer$2(comparator2.semver.version);
      switch (comparator2.operator) {
        case ">":
          if (compver.prerelease.length === 0) {
            compver.patch++;
          } else {
            compver.prerelease.push(0);
          }
          compver.raw = compver.format();
        case "":
        case ">=":
          if (!setMin || gt$2(compver, setMin)) {
            setMin = compver;
          }
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${comparator2.operator}`);
      }
    });
    if (setMin && (!minver || gt$2(minver, setMin))) {
      minver = setMin;
    }
  }
  if (minver && range2.test(minver)) {
    return minver;
  }
  return null;
};
var minVersion_1 = minVersion$1;
const Range$4 = requireRange();
const validRange$1 = (range2, options) => {
  try {
    return new Range$4(range2, options).range || "*";
  } catch (er) {
    return null;
  }
};
var valid$1 = validRange$1;
const SemVer$1 = semver$2;
const Comparator$2 = requireComparator();
const { ANY: ANY$1 } = Comparator$2;
const Range$3 = requireRange();
const satisfies$3 = satisfies_1;
const gt$1 = gt_1;
const lt$1 = lt_1;
const lte$1 = lte_1;
const gte$1 = gte_1;
const outside$3 = (version, range2, hilo, options) => {
  version = new SemVer$1(version, options);
  range2 = new Range$3(range2, options);
  let gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case ">":
      gtfn = gt$1;
      ltefn = lte$1;
      ltfn = lt$1;
      comp = ">";
      ecomp = ">=";
      break;
    case "<":
      gtfn = lt$1;
      ltefn = gte$1;
      ltfn = gt$1;
      comp = "<";
      ecomp = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (satisfies$3(version, range2, options)) {
    return false;
  }
  for (let i = 0; i < range2.set.length; ++i) {
    const comparators = range2.set[i];
    let high = null;
    let low = null;
    comparators.forEach((comparator2) => {
      if (comparator2.semver === ANY$1) {
        comparator2 = new Comparator$2(">=0.0.0");
      }
      high = high || comparator2;
      low = low || comparator2;
      if (gtfn(comparator2.semver, high.semver, options)) {
        high = comparator2;
      } else if (ltfn(comparator2.semver, low.semver, options)) {
        low = comparator2;
      }
    });
    if (high.operator === comp || high.operator === ecomp) {
      return false;
    }
    if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
      return false;
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false;
    }
  }
  return true;
};
var outside_1 = outside$3;
const outside$2 = outside_1;
const gtr$1 = (version, range2, options) => outside$2(version, range2, ">", options);
var gtr_1 = gtr$1;
const outside$1 = outside_1;
const ltr$1 = (version, range2, options) => outside$1(version, range2, "<", options);
var ltr_1 = ltr$1;
const Range$2 = requireRange();
const intersects$1 = (r1, r2, options) => {
  r1 = new Range$2(r1, options);
  r2 = new Range$2(r2, options);
  return r1.intersects(r2, options);
};
var intersects_1 = intersects$1;
const satisfies$2 = satisfies_1;
const compare$2 = compare_1;
var simplify = (versions, range2, options) => {
  const set2 = [];
  let first = null;
  let prev = null;
  const v = versions.sort((a, b) => compare$2(a, b, options));
  for (const version of v) {
    const included = satisfies$2(version, range2, options);
    if (included) {
      prev = version;
      if (!first) {
        first = version;
      }
    } else {
      if (prev) {
        set2.push([first, prev]);
      }
      prev = null;
      first = null;
    }
  }
  if (first) {
    set2.push([first, null]);
  }
  const ranges = [];
  for (const [min, max] of set2) {
    if (min === max) {
      ranges.push(min);
    } else if (!max && min === v[0]) {
      ranges.push("*");
    } else if (!max) {
      ranges.push(`>=${min}`);
    } else if (min === v[0]) {
      ranges.push(`<=${max}`);
    } else {
      ranges.push(`${min} - ${max}`);
    }
  }
  const simplified = ranges.join(" || ");
  const original = typeof range2.raw === "string" ? range2.raw : String(range2);
  return simplified.length < original.length ? simplified : range2;
};
const Range$1 = requireRange();
const Comparator$1 = requireComparator();
const { ANY } = Comparator$1;
const satisfies$1 = satisfies_1;
const compare$1 = compare_1;
const subset$1 = (sub, dom, options = {}) => {
  if (sub === dom) {
    return true;
  }
  sub = new Range$1(sub, options);
  dom = new Range$1(dom, options);
  let sawNonNull = false;
  OUTER: for (const simpleSub of sub.set) {
    for (const simpleDom of dom.set) {
      const isSub = simpleSubset(simpleSub, simpleDom, options);
      sawNonNull = sawNonNull || isSub !== null;
      if (isSub) {
        continue OUTER;
      }
    }
    if (sawNonNull) {
      return false;
    }
  }
  return true;
};
const minimumVersionWithPreRelease = [new Comparator$1(">=0.0.0-0")];
const minimumVersion = [new Comparator$1(">=0.0.0")];
const simpleSubset = (sub, dom, options) => {
  if (sub === dom) {
    return true;
  }
  if (sub.length === 1 && sub[0].semver === ANY) {
    if (dom.length === 1 && dom[0].semver === ANY) {
      return true;
    } else if (options.includePrerelease) {
      sub = minimumVersionWithPreRelease;
    } else {
      sub = minimumVersion;
    }
  }
  if (dom.length === 1 && dom[0].semver === ANY) {
    if (options.includePrerelease) {
      return true;
    } else {
      dom = minimumVersion;
    }
  }
  const eqSet = /* @__PURE__ */ new Set();
  let gt2, lt2;
  for (const c of sub) {
    if (c.operator === ">" || c.operator === ">=") {
      gt2 = higherGT(gt2, c, options);
    } else if (c.operator === "<" || c.operator === "<=") {
      lt2 = lowerLT(lt2, c, options);
    } else {
      eqSet.add(c.semver);
    }
  }
  if (eqSet.size > 1) {
    return null;
  }
  let gtltComp;
  if (gt2 && lt2) {
    gtltComp = compare$1(gt2.semver, lt2.semver, options);
    if (gtltComp > 0) {
      return null;
    } else if (gtltComp === 0 && (gt2.operator !== ">=" || lt2.operator !== "<=")) {
      return null;
    }
  }
  for (const eq2 of eqSet) {
    if (gt2 && !satisfies$1(eq2, String(gt2), options)) {
      return null;
    }
    if (lt2 && !satisfies$1(eq2, String(lt2), options)) {
      return null;
    }
    for (const c of dom) {
      if (!satisfies$1(eq2, String(c), options)) {
        return false;
      }
    }
    return true;
  }
  let higher, lower;
  let hasDomLT, hasDomGT;
  let needDomLTPre = lt2 && !options.includePrerelease && lt2.semver.prerelease.length ? lt2.semver : false;
  let needDomGTPre = gt2 && !options.includePrerelease && gt2.semver.prerelease.length ? gt2.semver : false;
  if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt2.operator === "<" && needDomLTPre.prerelease[0] === 0) {
    needDomLTPre = false;
  }
  for (const c of dom) {
    hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
    hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
    if (gt2) {
      if (needDomGTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
          needDomGTPre = false;
        }
      }
      if (c.operator === ">" || c.operator === ">=") {
        higher = higherGT(gt2, c, options);
        if (higher === c && higher !== gt2) {
          return false;
        }
      } else if (gt2.operator === ">=" && !satisfies$1(gt2.semver, String(c), options)) {
        return false;
      }
    }
    if (lt2) {
      if (needDomLTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
          needDomLTPre = false;
        }
      }
      if (c.operator === "<" || c.operator === "<=") {
        lower = lowerLT(lt2, c, options);
        if (lower === c && lower !== lt2) {
          return false;
        }
      } else if (lt2.operator === "<=" && !satisfies$1(lt2.semver, String(c), options)) {
        return false;
      }
    }
    if (!c.operator && (lt2 || gt2) && gtltComp !== 0) {
      return false;
    }
  }
  if (gt2 && hasDomLT && !lt2 && gtltComp !== 0) {
    return false;
  }
  if (lt2 && hasDomGT && !gt2 && gtltComp !== 0) {
    return false;
  }
  if (needDomGTPre || needDomLTPre) {
    return false;
  }
  return true;
};
const higherGT = (a, b, options) => {
  if (!a) {
    return b;
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
};
const lowerLT = (a, b, options) => {
  if (!a) {
    return b;
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
};
var subset_1 = subset$1;
const internalRe = reExports;
const constants = constants$1;
const SemVer2 = semver$2;
const identifiers = identifiers$1;
const parse = parse_1;
const valid = valid_1;
const clean = clean_1;
const inc = inc_1;
const diff = diff_1;
const major = major_1;
const minor = minor_1;
const patch = patch_1;
const prerelease = prerelease_1;
const compare = compare_1;
const rcompare = rcompare_1;
const compareLoose = compareLoose_1;
const compareBuild = compareBuild_1;
const sort = sort_1;
const rsort = rsort_1;
const gt = gt_1;
const lt = lt_1;
const eq = eq_1;
const neq = neq_1;
const gte = gte_1;
const lte = lte_1;
const cmp = cmp_1;
const coerce = coerce_1;
const Comparator = requireComparator();
const Range = requireRange();
const satisfies = satisfies_1;
const toComparators = toComparators_1;
const maxSatisfying = maxSatisfying_1;
const minSatisfying = minSatisfying_1;
const minVersion = minVersion_1;
const validRange = valid$1;
const outside = outside_1;
const gtr = gtr_1;
const ltr = ltr_1;
const intersects = intersects_1;
const simplifyRange = simplify;
const subset = subset_1;
var semver$1 = {
  parse,
  valid,
  clean,
  inc,
  diff,
  major,
  minor,
  patch,
  prerelease,
  compare,
  rcompare,
  compareLoose,
  compareBuild,
  sort,
  rsort,
  gt,
  lt,
  eq,
  neq,
  gte,
  lte,
  cmp,
  coerce,
  Comparator,
  Range,
  satisfies,
  toComparators,
  maxSatisfying,
  minSatisfying,
  minVersion,
  validRange,
  outside,
  gtr,
  ltr,
  intersects,
  simplifyRange,
  subset,
  SemVer: SemVer2,
  re: internalRe.re,
  src: internalRe.src,
  tokens: internalRe.t,
  SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: constants.RELEASE_TYPES,
  compareIdentifiers: identifiers.compareIdentifiers,
  rcompareIdentifiers: identifiers.rcompareIdentifiers
};
var DownloadedUpdateHelper$1 = {};
var lodash_isequal = { exports: {} };
lodash_isequal.exports;
(function(module2, exports) {
  var LARGE_ARRAY_SIZE = 200;
  var HASH_UNDEFINED = "__lodash_hash_undefined__";
  var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
  var MAX_SAFE_INTEGER2 = 9007199254740991;
  var argsTag = "[object Arguments]", arrayTag = "[object Array]", asyncTag = "[object AsyncFunction]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag = "[object Map]", numberTag = "[object Number]", nullTag = "[object Null]", objectTag = "[object Object]", promiseTag = "[object Promise]", proxyTag = "[object Proxy]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag2 = "[object Symbol]", undefinedTag = "[object Undefined]", weakMapTag = "[object WeakMap]";
  var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
  var reRegExpChar2 = /[\\^$.*+?()[\]{}|]/g;
  var reIsHostCtor = /^\[object .+?Constructor\]$/;
  var reIsUint = /^(?:0|[1-9]\d*)$/;
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
  var freeGlobal2 = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
  var freeSelf2 = typeof self == "object" && self && self.Object === Object && self;
  var root2 = freeGlobal2 || freeSelf2 || Function("return this")();
  var freeExports = exports && !exports.nodeType && exports;
  var freeModule = freeExports && true && module2 && !module2.nodeType && module2;
  var moduleExports = freeModule && freeModule.exports === freeExports;
  var freeProcess = moduleExports && freeGlobal2.process;
  var nodeUtil = function() {
    try {
      return freeProcess && freeProcess.binding && freeProcess.binding("util");
    } catch (e) {
    }
  }();
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
  function arrayFilter(array, predicate) {
    var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }
  function arrayPush(array, values) {
    var index = -1, length = values.length, offset = array.length;
    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }
  function arraySome(array, predicate) {
    var index = -1, length = array == null ? 0 : array.length;
    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }
  function baseTimes(n, iteratee) {
    var index = -1, result = Array(n);
    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }
  function cacheHas(cache, key) {
    return cache.has(key);
  }
  function getValue(object, key) {
    return object == null ? void 0 : object[key];
  }
  function mapToArray(map2) {
    var index = -1, result = Array(map2.size);
    map2.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }
  function setToArray(set2) {
    var index = -1, result = Array(set2.size);
    set2.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }
  var arrayProto = Array.prototype, funcProto = Function.prototype, objectProto2 = Object.prototype;
  var coreJsData = root2["__core-js_shared__"];
  var funcToString = funcProto.toString;
  var hasOwnProperty = objectProto2.hasOwnProperty;
  var maskSrcKey = function() {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
    return uid ? "Symbol(src)_1." + uid : "";
  }();
  var nativeObjectToString = objectProto2.toString;
  var reIsNative = RegExp(
    "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar2, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  );
  var Buffer2 = moduleExports ? root2.Buffer : void 0, Symbol2 = root2.Symbol, Uint8Array2 = root2.Uint8Array, propertyIsEnumerable = objectProto2.propertyIsEnumerable, splice = arrayProto.splice, symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
  var nativeGetSymbols = Object.getOwnPropertySymbols, nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0, nativeKeys = overArg(Object.keys, Object);
  var DataView = getNative(root2, "DataView"), Map2 = getNative(root2, "Map"), Promise2 = getNative(root2, "Promise"), Set2 = getNative(root2, "Set"), WeakMap = getNative(root2, "WeakMap"), nativeCreate = getNative(Object, "create");
  var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise2), setCtorString = toSource(Set2), weakMapCtorString = toSource(WeakMap);
  var symbolProto2 = Symbol2 ? Symbol2.prototype : void 0, symbolValueOf = symbolProto2 ? symbolProto2.valueOf : void 0;
  function Hash(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
    this.size = 0;
  }
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? void 0 : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : void 0;
  }
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
  }
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
    return this;
  }
  Hash.prototype.clear = hashClear;
  Hash.prototype["delete"] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;
  function ListCache(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }
  function listCacheDelete(key) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }
  function listCacheGet(key) {
    var data = this.__data__, index = assocIndexOf(data, key);
    return index < 0 ? void 0 : data[index][1];
  }
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }
  function listCacheSet(key, value) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype["delete"] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;
  function MapCache(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      "hash": new Hash(),
      "map": new (Map2 || ListCache)(),
      "string": new Hash()
    };
  }
  function mapCacheDelete(key) {
    var result = getMapData(this, key)["delete"](key);
    this.size -= result ? 1 : 0;
    return result;
  }
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }
  function mapCacheSet(key, value) {
    var data = getMapData(this, key), size = data.size;
    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype["delete"] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;
  function SetCache(values) {
    var index = -1, length = values == null ? 0 : values.length;
    this.__data__ = new MapCache();
    while (++index < length) {
      this.add(values[index]);
    }
  }
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }
  function setCacheHas(value) {
    return this.__data__.has(value);
  }
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
  SetCache.prototype.has = setCacheHas;
  function Stack(entries) {
    var data = this.__data__ = new ListCache(entries);
    this.size = data.size;
  }
  function stackClear() {
    this.__data__ = new ListCache();
    this.size = 0;
  }
  function stackDelete(key) {
    var data = this.__data__, result = data["delete"](key);
    this.size = data.size;
    return result;
  }
  function stackGet(key) {
    return this.__data__.get(key);
  }
  function stackHas(key) {
    return this.__data__.has(key);
  }
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache) {
      var pairs2 = data.__data__;
      if (!Map2 || pairs2.length < LARGE_ARRAY_SIZE - 1) {
        pairs2.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new MapCache(pairs2);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }
  Stack.prototype.clear = stackClear;
  Stack.prototype["delete"] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
    for (var key in value) {
      if (hasOwnProperty.call(value, key) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
      (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
      isIndex(key, length)))) {
        result.push(key);
      }
    }
    return result;
  }
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq2(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
  }
  function baseGetTag(value) {
    if (value == null) {
      return value === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString2(value);
  }
  function baseIsArguments(value) {
    return isObjectLike2(value) && baseGetTag(value) == argsTag;
  }
  function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || !isObjectLike2(value) && !isObjectLike2(other)) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
  }
  function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
    var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
    objTag = objTag == argsTag ? objectTag : objTag;
    othTag = othTag == argsTag ? objectTag : othTag;
    var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
    if (isSameTag && isBuffer(object)) {
      if (!isBuffer(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack());
      return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
        stack || (stack = new Stack());
        return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new Stack());
    return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
  }
  function baseIsNative(value) {
    if (!isObject2(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }
  function baseIsTypedArray(value) {
    return isObjectLike2(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
  }
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != "constructor") {
        result.push(key);
      }
    }
    return result;
  }
  function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
    stack.set(array, other);
    stack.set(other, array);
    while (++index < arrLength) {
      var arrValue = array[index], othValue = other[index];
      if (customizer) {
        var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== void 0) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      if (seen) {
        if (!arraySome(other, function(othValue2, othIndex) {
          if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
            return seen.push(othIndex);
          }
        })) {
          result = false;
          break;
        }
      } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
        result = false;
        break;
      }
    }
    stack["delete"](array);
    stack["delete"](other);
    return result;
  }
  function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
      case dataViewTag:
        if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;
      case arrayBufferTag:
        if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
          return false;
        }
        return true;
      case boolTag:
      case dateTag:
      case numberTag:
        return eq2(+object, +other);
      case errorTag:
        return object.name == other.name && object.message == other.message;
      case regexpTag:
      case stringTag:
        return object == other + "";
      case mapTag:
        var convert = mapToArray;
      case setTag:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
        convert || (convert = setToArray);
        if (object.size != other.size && !isPartial) {
          return false;
        }
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= COMPARE_UNORDERED_FLAG;
        stack.set(object, other);
        var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
        stack["delete"](object);
        return result;
      case symbolTag2:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }
  function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
        return false;
      }
    }
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);
    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key], othValue = other[key];
      if (customizer) {
        var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
      }
      if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == "constructor");
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor, othCtor = other.constructor;
      if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack["delete"](object);
    stack["delete"](other);
    return result;
  }
  function getAllKeys(object) {
    return baseGetAllKeys(object, keys, getSymbols);
  }
  function getMapData(map2, key) {
    var data = map2.__data__;
    return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
  }
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : void 0;
  }
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
    try {
      value[symToStringTag] = void 0;
      var unmasked = true;
    } catch (e) {
    }
    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }
  var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
    if (object == null) {
      return [];
    }
    object = Object(object);
    return arrayFilter(nativeGetSymbols(object), function(symbol) {
      return propertyIsEnumerable.call(object, symbol);
    });
  };
  var getTag = baseGetTag;
  if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
    getTag = function(value) {
      var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }
  function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER2 : length;
    return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
  }
  function isKeyable(value) {
    var type2 = typeof value;
    return type2 == "string" || type2 == "number" || type2 == "symbol" || type2 == "boolean" ? value !== "__proto__" : value === null;
  }
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }
  function isPrototype(value) {
    var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto2;
    return value === proto;
  }
  function objectToString2(value) {
    return nativeObjectToString.call(value);
  }
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {
      }
      try {
        return func + "";
      } catch (e) {
      }
    }
    return "";
  }
  function eq2(value, other) {
    return value === other || value !== value && other !== other;
  }
  var isArguments = baseIsArguments(/* @__PURE__ */ function() {
    return arguments;
  }()) ? baseIsArguments : function(value) {
    return isObjectLike2(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
  };
  var isArray = Array.isArray;
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }
  var isBuffer = nativeIsBuffer || stubFalse;
  function isEqual2(value, other) {
    return baseIsEqual(value, other);
  }
  function isFunction(value) {
    if (!isObject2(value)) {
      return false;
    }
    var tag = baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }
  function isLength(value) {
    return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER2;
  }
  function isObject2(value) {
    var type2 = typeof value;
    return value != null && (type2 == "object" || type2 == "function");
  }
  function isObjectLike2(value) {
    return value != null && typeof value == "object";
  }
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }
  function stubArray() {
    return [];
  }
  function stubFalse() {
    return false;
  }
  module2.exports = isEqual2;
})(lodash_isequal, lodash_isequal.exports);
var lodash_isequalExports = lodash_isequal.exports;
Object.defineProperty(DownloadedUpdateHelper$1, "__esModule", { value: true });
DownloadedUpdateHelper$1.DownloadedUpdateHelper = void 0;
DownloadedUpdateHelper$1.createTempUpdateFile = createTempUpdateFile;
const crypto_1$2 = require$$0;
const fs_1$4 = fs$j;
const isEqual = lodash_isequalExports;
const fs_extra_1$6 = lib;
const path$9 = require$$1$1;
class DownloadedUpdateHelper {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this._file = null;
    this._packageFile = null;
    this.versionInfo = null;
    this.fileInfo = null;
    this._downloadedFileInfo = null;
  }
  get downloadedFileInfo() {
    return this._downloadedFileInfo;
  }
  get file() {
    return this._file;
  }
  get packageFile() {
    return this._packageFile;
  }
  get cacheDirForPendingUpdate() {
    return path$9.join(this.cacheDir, "pending");
  }
  async validateDownloadedPath(updateFile, updateInfo, fileInfo, logger) {
    if (this.versionInfo != null && this.file === updateFile && this.fileInfo != null) {
      if (isEqual(this.versionInfo, updateInfo) && isEqual(this.fileInfo.info, fileInfo.info) && await (0, fs_extra_1$6.pathExists)(updateFile)) {
        return updateFile;
      } else {
        return null;
      }
    }
    const cachedUpdateFile = await this.getValidCachedUpdateFile(fileInfo, logger);
    if (cachedUpdateFile === null) {
      return null;
    }
    logger.info(`Update has already been downloaded to ${updateFile}).`);
    this._file = cachedUpdateFile;
    return cachedUpdateFile;
  }
  async setDownloadedFile(downloadedFile, packageFile, versionInfo, fileInfo, updateFileName, isSaveCache) {
    this._file = downloadedFile;
    this._packageFile = packageFile;
    this.versionInfo = versionInfo;
    this.fileInfo = fileInfo;
    this._downloadedFileInfo = {
      fileName: updateFileName,
      sha512: fileInfo.info.sha512,
      isAdminRightsRequired: fileInfo.info.isAdminRightsRequired === true
    };
    if (isSaveCache) {
      await (0, fs_extra_1$6.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
    }
  }
  async clear() {
    this._file = null;
    this._packageFile = null;
    this.versionInfo = null;
    this.fileInfo = null;
    await this.cleanCacheDirForPendingUpdate();
  }
  async cleanCacheDirForPendingUpdate() {
    try {
      await (0, fs_extra_1$6.emptyDir)(this.cacheDirForPendingUpdate);
    } catch (_ignore) {
    }
  }
  /**
   * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
   * @param fileInfo
   * @param logger
   */
  async getValidCachedUpdateFile(fileInfo, logger) {
    const updateInfoFilePath = this.getUpdateInfoFile();
    const doesUpdateInfoFileExist = await (0, fs_extra_1$6.pathExists)(updateInfoFilePath);
    if (!doesUpdateInfoFileExist) {
      return null;
    }
    let cachedInfo;
    try {
      cachedInfo = await (0, fs_extra_1$6.readJson)(updateInfoFilePath);
    } catch (error2) {
      let message = `No cached update info available`;
      if (error2.code !== "ENOENT") {
        await this.cleanCacheDirForPendingUpdate();
        message += ` (error on read: ${error2.message})`;
      }
      logger.info(message);
      return null;
    }
    const isCachedInfoFileNameValid = (cachedInfo === null || cachedInfo === void 0 ? void 0 : cachedInfo.fileName) !== null;
    if (!isCachedInfoFileNameValid) {
      logger.warn(`Cached update info is corrupted: no fileName, directory for cached update will be cleaned`);
      await this.cleanCacheDirForPendingUpdate();
      return null;
    }
    if (fileInfo.info.sha512 !== cachedInfo.sha512) {
      logger.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${cachedInfo.sha512}, expected: ${fileInfo.info.sha512}. Directory for cached update will be cleaned`);
      await this.cleanCacheDirForPendingUpdate();
      return null;
    }
    const updateFile = path$9.join(this.cacheDirForPendingUpdate, cachedInfo.fileName);
    if (!await (0, fs_extra_1$6.pathExists)(updateFile)) {
      logger.info("Cached update file doesn't exist");
      return null;
    }
    const sha512 = await hashFile(updateFile);
    if (fileInfo.info.sha512 !== sha512) {
      logger.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${sha512}, expected: ${fileInfo.info.sha512}`);
      await this.cleanCacheDirForPendingUpdate();
      return null;
    }
    this._downloadedFileInfo = cachedInfo;
    return updateFile;
  }
  getUpdateInfoFile() {
    return path$9.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
DownloadedUpdateHelper$1.DownloadedUpdateHelper = DownloadedUpdateHelper;
function hashFile(file2, algorithm = "sha512", encoding = "base64", options) {
  return new Promise((resolve, reject) => {
    const hash2 = (0, crypto_1$2.createHash)(algorithm);
    hash2.on("error", reject).setEncoding(encoding);
    (0, fs_1$4.createReadStream)(file2, {
      ...options,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", reject).on("end", () => {
      hash2.end();
      resolve(hash2.read());
    }).pipe(hash2, { end: false });
  });
}
async function createTempUpdateFile(name, cacheDir, log) {
  let nameCounter = 0;
  let result = path$9.join(cacheDir, name);
  for (let i = 0; i < 3; i++) {
    try {
      await (0, fs_extra_1$6.unlink)(result);
      return result;
    } catch (e) {
      if (e.code === "ENOENT") {
        return result;
      }
      log.warn(`Error on remove temp update file: ${e}`);
      result = path$9.join(cacheDir, `${nameCounter++}-${name}`);
    }
  }
  return result;
}
var ElectronAppAdapter$1 = {};
var AppAdapter = {};
Object.defineProperty(AppAdapter, "__esModule", { value: true });
AppAdapter.getAppCacheDir = getAppCacheDir;
const path$8 = require$$1$1;
const os_1$1 = require$$2;
function getAppCacheDir() {
  const homedir = (0, os_1$1.homedir)();
  let result;
  if (process.platform === "win32") {
    result = process.env["LOCALAPPDATA"] || path$8.join(homedir, "AppData", "Local");
  } else if (process.platform === "darwin") {
    result = path$8.join(homedir, "Library", "Caches");
  } else {
    result = process.env["XDG_CACHE_HOME"] || path$8.join(homedir, ".cache");
  }
  return result;
}
Object.defineProperty(ElectronAppAdapter$1, "__esModule", { value: true });
ElectronAppAdapter$1.ElectronAppAdapter = void 0;
const path$7 = require$$1$1;
const AppAdapter_1 = AppAdapter;
class ElectronAppAdapter {
  constructor(app = require$$1.app) {
    this.app = app;
  }
  whenReady() {
    return this.app.whenReady();
  }
  get version() {
    return this.app.getVersion();
  }
  get name() {
    return this.app.getName();
  }
  get isPackaged() {
    return this.app.isPackaged === true;
  }
  get appUpdateConfigPath() {
    return this.isPackaged ? path$7.join(process.resourcesPath, "app-update.yml") : path$7.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, AppAdapter_1.getAppCacheDir)();
  }
  quit() {
    this.app.quit();
  }
  relaunch() {
    this.app.relaunch();
  }
  onQuit(handler) {
    this.app.once("quit", (_, exitCode) => handler(exitCode));
  }
}
ElectronAppAdapter$1.ElectronAppAdapter = ElectronAppAdapter;
var electronHttpExecutor = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ElectronHttpExecutor = exports.NET_SESSION_NAME = void 0;
  exports.getNetSession = getNetSession;
  const builder_util_runtime_12 = out;
  exports.NET_SESSION_NAME = "electron-updater";
  function getNetSession() {
    return require$$1.session.fromPartition(exports.NET_SESSION_NAME, {
      cache: false
    });
  }
  class ElectronHttpExecutor extends builder_util_runtime_12.HttpExecutor {
    constructor(proxyLoginCallback) {
      super();
      this.proxyLoginCallback = proxyLoginCallback;
      this.cachedSession = null;
    }
    async download(url, destination, options) {
      return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
        const requestOptions = {
          headers: options.headers || void 0,
          redirect: "manual"
        };
        (0, builder_util_runtime_12.configureRequestUrl)(url, requestOptions);
        (0, builder_util_runtime_12.configureRequestOptions)(requestOptions);
        this.doDownload(requestOptions, {
          destination,
          options,
          onCancel,
          callback: (error2) => {
            if (error2 == null) {
              resolve(destination);
            } else {
              reject(error2);
            }
          },
          responseHandler: null
        }, 0);
      });
    }
    createRequest(options, callback) {
      if (options.headers && options.headers.Host) {
        options.host = options.headers.Host;
        delete options.headers.Host;
      }
      if (this.cachedSession == null) {
        this.cachedSession = getNetSession();
      }
      const request = require$$1.net.request({
        ...options,
        session: this.cachedSession
      });
      request.on("response", callback);
      if (this.proxyLoginCallback != null) {
        request.on("login", this.proxyLoginCallback);
      }
      return request;
    }
    addRedirectHandlers(request, options, reject, redirectCount, handler) {
      request.on("redirect", (statusCode, method, redirectUrl) => {
        request.abort();
        if (redirectCount > this.maxRedirects) {
          reject(this.createMaxRedirectError());
        } else {
          handler(builder_util_runtime_12.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options));
        }
      });
    }
  }
  exports.ElectronHttpExecutor = ElectronHttpExecutor;
})(electronHttpExecutor);
var GenericProvider$1 = {};
var util = {};
Object.defineProperty(util, "__esModule", { value: true });
util.newBaseUrl = newBaseUrl;
util.newUrlFromBase = newUrlFromBase;
util.getChannelFilename = getChannelFilename;
const url_1$6 = require$$2$1;
function newBaseUrl(url) {
  const result = new url_1$6.URL(url);
  if (!result.pathname.endsWith("/")) {
    result.pathname += "/";
  }
  return result;
}
function newUrlFromBase(pathname, baseUrl, addRandomQueryToAvoidCaching = false) {
  const result = new url_1$6.URL(pathname, baseUrl);
  const search = baseUrl.search;
  if (search != null && search.length !== 0) {
    result.search = search;
  } else if (addRandomQueryToAvoidCaching) {
    result.search = `noCache=${Date.now().toString(32)}`;
  }
  return result;
}
function getChannelFilename(channel) {
  return `${channel}.yml`;
}
var Provider$1 = {};
var symbolTag = "[object Symbol]";
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g, reHasRegExpChar = RegExp(reRegExpChar.source);
var freeGlobal = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal || freeSelf || Function("return this")();
var objectProto = Object.prototype;
var objectToString = objectProto.toString;
var Symbol$1 = root.Symbol;
var symbolProto = Symbol$1 ? Symbol$1.prototype : void 0, symbolToString = symbolProto ? symbolProto.toString : void 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -Infinity ? "-0" : result;
}
function isObjectLike(value) {
  return !!value && typeof value == "object";
}
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
}
function toString2(value) {
  return value == null ? "" : baseToString(value);
}
function escapeRegExp$2(string) {
  string = toString2(string);
  return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, "\\$&") : string;
}
var lodash_escaperegexp = escapeRegExp$2;
Object.defineProperty(Provider$1, "__esModule", { value: true });
Provider$1.Provider = void 0;
Provider$1.findFile = findFile;
Provider$1.parseUpdateInfo = parseUpdateInfo;
Provider$1.getFileList = getFileList;
Provider$1.resolveFiles = resolveFiles;
const builder_util_runtime_1$f = out;
const js_yaml_1$2 = jsYaml;
const url_1$5 = require$$2$1;
const util_1$6 = util;
const escapeRegExp$1 = lodash_escaperegexp;
class Provider {
  constructor(runtimeOptions) {
    this.runtimeOptions = runtimeOptions;
    this.requestHeaders = null;
    this.executor = runtimeOptions.executor;
  }
  // By default, the blockmap file is in the same directory as the main file
  // But some providers may have a different blockmap file, so we need to override this method
  getBlockMapFiles(baseUrl, oldVersion, newVersion, oldBlockMapFileBaseUrl = null) {
    const newBlockMapUrl = (0, util_1$6.newUrlFromBase)(`${baseUrl.pathname}.blockmap`, baseUrl);
    const oldBlockMapUrl = (0, util_1$6.newUrlFromBase)(`${baseUrl.pathname.replace(new RegExp(escapeRegExp$1(newVersion), "g"), oldVersion)}.blockmap`, oldBlockMapFileBaseUrl ? new url_1$5.URL(oldBlockMapFileBaseUrl) : baseUrl);
    return [oldBlockMapUrl, newBlockMapUrl];
  }
  get isUseMultipleRangeRequest() {
    return this.runtimeOptions.isUseMultipleRangeRequest !== false;
  }
  getChannelFilePrefix() {
    if (this.runtimeOptions.platform === "linux") {
      const arch = process.env["TEST_UPDATER_ARCH"] || process.arch;
      const archSuffix = arch === "x64" ? "" : `-${arch}`;
      return "-linux" + archSuffix;
    } else {
      return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
    }
  }
  // due to historical reasons for windows we use channel name without platform specifier
  getDefaultChannelName() {
    return this.getCustomChannelName("latest");
  }
  getCustomChannelName(channel) {
    return `${channel}${this.getChannelFilePrefix()}`;
  }
  get fileExtraDownloadHeaders() {
    return null;
  }
  setRequestHeaders(value) {
    this.requestHeaders = value;
  }
  /**
   * Method to perform API request only to resolve update info, but not to download update.
   */
  httpRequest(url, headers, cancellationToken) {
    return this.executor.request(this.createRequestOptions(url, headers), cancellationToken);
  }
  createRequestOptions(url, headers) {
    const result = {};
    if (this.requestHeaders == null) {
      if (headers != null) {
        result.headers = headers;
      }
    } else {
      result.headers = headers == null ? this.requestHeaders : { ...this.requestHeaders, ...headers };
    }
    (0, builder_util_runtime_1$f.configureRequestUrl)(url, result);
    return result;
  }
}
Provider$1.Provider = Provider;
function findFile(files, extension, not) {
  var _a;
  if (files.length === 0) {
    throw (0, builder_util_runtime_1$f.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  }
  const filteredFiles = files.filter((it) => it.url.pathname.toLowerCase().endsWith(`.${extension.toLowerCase()}`));
  const result = (_a = filteredFiles.find((it) => [it.url.pathname, it.info.url].some((n) => n.includes(process.arch)))) !== null && _a !== void 0 ? _a : filteredFiles.shift();
  if (result) {
    return result;
  } else if (not == null) {
    return files[0];
  } else {
    return files.find((fileInfo) => !not.some((ext) => fileInfo.url.pathname.toLowerCase().endsWith(`.${ext.toLowerCase()}`)));
  }
}
function parseUpdateInfo(rawData, channelFile, channelFileUrl) {
  if (rawData == null) {
    throw (0, builder_util_runtime_1$f.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  let result;
  try {
    result = (0, js_yaml_1$2.load)(rawData);
  } catch (e) {
    throw (0, builder_util_runtime_1$f.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}, rawData: ${rawData}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return result;
}
function getFileList(updateInfo) {
  const files = updateInfo.files;
  if (files != null && files.length > 0) {
    return files;
  }
  if (updateInfo.path != null) {
    return [
      {
        url: updateInfo.path,
        sha2: updateInfo.sha2,
        sha512: updateInfo.sha512
      }
    ];
  } else {
    throw (0, builder_util_runtime_1$f.newError)(`No files provided: ${(0, builder_util_runtime_1$f.safeStringifyJson)(updateInfo)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
  }
}
function resolveFiles(updateInfo, baseUrl, pathTransformer = (p) => p) {
  const files = getFileList(updateInfo);
  const result = files.map((fileInfo) => {
    if (fileInfo.sha2 == null && fileInfo.sha512 == null) {
      throw (0, builder_util_runtime_1$f.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, builder_util_runtime_1$f.safeStringifyJson)(fileInfo)}`, "ERR_UPDATER_NO_CHECKSUM");
    }
    return {
      url: (0, util_1$6.newUrlFromBase)(pathTransformer(fileInfo.url), baseUrl),
      info: fileInfo
    };
  });
  const packages = updateInfo.packages;
  const packageInfo = packages == null ? null : packages[process.arch] || packages.ia32;
  if (packageInfo != null) {
    result[0].packageInfo = {
      ...packageInfo,
      path: (0, util_1$6.newUrlFromBase)(pathTransformer(packageInfo.path), baseUrl).href
    };
  }
  return result;
}
Object.defineProperty(GenericProvider$1, "__esModule", { value: true });
GenericProvider$1.GenericProvider = void 0;
const builder_util_runtime_1$e = out;
const util_1$5 = util;
const Provider_1$b = Provider$1;
class GenericProvider extends Provider_1$b.Provider {
  constructor(configuration, updater, runtimeOptions) {
    super(runtimeOptions);
    this.configuration = configuration;
    this.updater = updater;
    this.baseUrl = (0, util_1$5.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const result = this.updater.channel || this.configuration.channel;
    return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
  }
  async getLatestVersion() {
    const channelFile = (0, util_1$5.getChannelFilename)(this.channel);
    const channelUrl = (0, util_1$5.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let attemptNumber = 0; ; attemptNumber++) {
      try {
        return (0, Provider_1$b.parseUpdateInfo)(await this.httpRequest(channelUrl), channelFile, channelUrl);
      } catch (e) {
        if (e instanceof builder_util_runtime_1$e.HttpError && e.statusCode === 404) {
          throw (0, builder_util_runtime_1$e.newError)(`Cannot find channel "${channelFile}" update info: ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        } else if (e.code === "ECONNREFUSED") {
          if (attemptNumber < 3) {
            await new Promise((resolve, reject) => {
              try {
                setTimeout(resolve, 1e3 * attemptNumber);
              } catch (e2) {
                reject(e2);
              }
            });
            continue;
          }
        }
        throw e;
      }
    }
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$b.resolveFiles)(updateInfo, this.baseUrl);
  }
}
GenericProvider$1.GenericProvider = GenericProvider;
var providerFactory = {};
var BitbucketProvider$1 = {};
Object.defineProperty(BitbucketProvider$1, "__esModule", { value: true });
BitbucketProvider$1.BitbucketProvider = void 0;
const builder_util_runtime_1$d = out;
const util_1$4 = util;
const Provider_1$a = Provider$1;
class BitbucketProvider extends Provider_1$a.Provider {
  constructor(configuration, updater, runtimeOptions) {
    super({
      ...runtimeOptions,
      isUseMultipleRangeRequest: false
    });
    this.configuration = configuration;
    this.updater = updater;
    const { owner, slug } = configuration;
    this.baseUrl = (0, util_1$4.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${owner}/${slug}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const cancellationToken = new builder_util_runtime_1$d.CancellationToken();
    const channelFile = (0, util_1$4.getChannelFilename)(this.getCustomChannelName(this.channel));
    const channelUrl = (0, util_1$4.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const updateInfo = await this.httpRequest(channelUrl, void 0, cancellationToken);
      return (0, Provider_1$a.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
    } catch (e) {
      throw (0, builder_util_runtime_1$d.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$a.resolveFiles)(updateInfo, this.baseUrl);
  }
  toString() {
    const { owner, slug } = this.configuration;
    return `Bitbucket (owner: ${owner}, slug: ${slug}, channel: ${this.channel})`;
  }
}
BitbucketProvider$1.BitbucketProvider = BitbucketProvider;
var GitHubProvider$1 = {};
Object.defineProperty(GitHubProvider$1, "__esModule", { value: true });
GitHubProvider$1.GitHubProvider = GitHubProvider$1.BaseGitHubProvider = void 0;
GitHubProvider$1.computeReleaseNotes = computeReleaseNotes;
const builder_util_runtime_1$c = out;
const semver = semver$1;
const url_1$4 = require$$2$1;
const util_1$3 = util;
const Provider_1$9 = Provider$1;
const hrefRegExp = /\/tag\/(v?[^/]+)$/;
class BaseGitHubProvider extends Provider_1$9.Provider {
  constructor(options, defaultHost, runtimeOptions) {
    super({
      ...runtimeOptions,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: false
    });
    this.options = options;
    this.baseUrl = (0, util_1$3.newBaseUrl)((0, builder_util_runtime_1$c.githubUrl)(options, defaultHost));
    const apiHost = defaultHost === "github.com" ? "api.github.com" : defaultHost;
    this.baseApiUrl = (0, util_1$3.newBaseUrl)((0, builder_util_runtime_1$c.githubUrl)(options, apiHost));
  }
  computeGithubBasePath(result) {
    const host = this.options.host;
    return host && !["github.com", "api.github.com"].includes(host) ? `/api/v3${result}` : result;
  }
}
GitHubProvider$1.BaseGitHubProvider = BaseGitHubProvider;
class GitHubProvider extends BaseGitHubProvider {
  constructor(options, updater, runtimeOptions) {
    super(options, "github.com", runtimeOptions);
    this.options = options;
    this.updater = updater;
  }
  get channel() {
    const result = this.updater.channel || this.options.channel;
    return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
  }
  async getLatestVersion() {
    var _a, _b, _c, _d, _e;
    const cancellationToken = new builder_util_runtime_1$c.CancellationToken();
    const feedXml = await this.httpRequest((0, util_1$3.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, cancellationToken);
    const feed = (0, builder_util_runtime_1$c.parseXml)(feedXml);
    let latestRelease = feed.element("entry", false, `No published versions on GitHub`);
    let tag = null;
    try {
      if (this.updater.allowPrerelease) {
        const currentChannel = ((_a = this.updater) === null || _a === void 0 ? void 0 : _a.channel) || ((_b = semver.prerelease(this.updater.currentVersion)) === null || _b === void 0 ? void 0 : _b[0]) || null;
        if (currentChannel === null) {
          tag = hrefRegExp.exec(latestRelease.element("link").attribute("href"))[1];
        } else {
          for (const element of feed.getElements("entry")) {
            const hrefElement = hrefRegExp.exec(element.element("link").attribute("href"));
            if (hrefElement === null) {
              continue;
            }
            const hrefTag = hrefElement[1];
            if (!semver.valid(hrefTag)) {
              continue;
            }
            const hrefChannel = ((_c = semver.prerelease(hrefTag)) === null || _c === void 0 ? void 0 : _c[0]) || null;
            const shouldFetchVersion = !currentChannel || ["alpha", "beta"].includes(currentChannel);
            const isCustomChannel = hrefChannel !== null && !["alpha", "beta"].includes(String(hrefChannel));
            const channelMismatch = currentChannel === "beta" && hrefChannel === "alpha";
            if (shouldFetchVersion && !isCustomChannel && !channelMismatch) {
              tag = hrefTag;
              latestRelease = element;
              break;
            }
            const isNextPreRelease = hrefChannel && hrefChannel === currentChannel;
            if (isNextPreRelease) {
              tag = hrefTag;
              latestRelease = element;
              break;
            }
          }
        }
      } else {
        tag = await this.getLatestTagName(cancellationToken);
        for (const element of feed.getElements("entry")) {
          const hrefMatch = hrefRegExp.exec(element.element("link").attribute("href"));
          if (hrefMatch == null) {
            continue;
          }
          if (hrefMatch[1] === tag) {
            latestRelease = element;
            break;
          }
        }
      }
    } catch (e) {
      throw (0, builder_util_runtime_1$c.newError)(`Cannot parse releases feed: ${e.stack || e.message},
XML:
${feedXml}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (tag == null) {
      throw (0, builder_util_runtime_1$c.newError)(`No published versions on GitHub`, "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    }
    let rawData;
    let channelFile = "";
    let channelFileUrl = "";
    const fetchData = async (channelName) => {
      channelFile = (0, util_1$3.getChannelFilename)(channelName);
      channelFileUrl = (0, util_1$3.newUrlFromBase)(this.getBaseDownloadPath(String(tag), channelFile), this.baseUrl);
      const requestOptions = this.createRequestOptions(channelFileUrl);
      try {
        return await this.executor.request(requestOptions, cancellationToken);
      } catch (e) {
        if (e instanceof builder_util_runtime_1$c.HttpError && e.statusCode === 404) {
          throw (0, builder_util_runtime_1$c.newError)(`Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        }
        throw e;
      }
    };
    try {
      let channel = this.channel;
      if (this.updater.allowPrerelease && ((_d = semver.prerelease(tag)) === null || _d === void 0 ? void 0 : _d[0])) {
        channel = this.getCustomChannelName(String((_e = semver.prerelease(tag)) === null || _e === void 0 ? void 0 : _e[0]));
      }
      rawData = await fetchData(channel);
    } catch (e) {
      if (this.updater.allowPrerelease) {
        rawData = await fetchData(this.getDefaultChannelName());
      } else {
        throw e;
      }
    }
    const result = (0, Provider_1$9.parseUpdateInfo)(rawData, channelFile, channelFileUrl);
    if (result.releaseName == null) {
      result.releaseName = latestRelease.elementValueOrEmpty("title");
    }
    if (result.releaseNotes == null) {
      result.releaseNotes = computeReleaseNotes(this.updater.currentVersion, this.updater.fullChangelog, feed, latestRelease);
    }
    return {
      tag,
      ...result
    };
  }
  async getLatestTagName(cancellationToken) {
    const options = this.options;
    const url = options.host == null || options.host === "github.com" ? (0, util_1$3.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new url_1$4.URL(`${this.computeGithubBasePath(`/repos/${options.owner}/${options.repo}/releases`)}/latest`, this.baseApiUrl);
    try {
      const rawData = await this.httpRequest(url, { Accept: "application/json" }, cancellationToken);
      if (rawData == null) {
        return null;
      }
      const releaseInfo = JSON.parse(rawData);
      return releaseInfo.tag_name;
    } catch (e) {
      throw (0, builder_util_runtime_1$c.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`;
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$9.resolveFiles)(updateInfo, this.baseUrl, (p) => this.getBaseDownloadPath(updateInfo.tag, p.replace(/ /g, "-")));
  }
  getBaseDownloadPath(tag, fileName) {
    return `${this.basePath}/download/${tag}/${fileName}`;
  }
}
GitHubProvider$1.GitHubProvider = GitHubProvider;
function getNoteValue(parent) {
  const result = parent.elementValueOrEmpty("content");
  return result === "No content." ? "" : result;
}
function computeReleaseNotes(currentVersion, isFullChangelog, feed, latestRelease) {
  if (!isFullChangelog) {
    return getNoteValue(latestRelease);
  }
  const releaseVersionRegExp = /\/tag\/v?([^/]+)$/;
  let latestVersion = void 0;
  try {
    latestVersion = releaseVersionRegExp.exec(latestRelease.element("link").attribute("href"))[1];
    latestVersion = semver.valid(latestVersion) ? latestVersion : void 0;
  } catch {
  }
  if (latestVersion == null) {
    return null;
  }
  const releaseNotes = [];
  for (const release of feed.getElements("entry")) {
    let versionRelease;
    try {
      const match = releaseVersionRegExp.exec(release.element("link").attribute("href"));
      if (!match) {
        continue;
      }
      versionRelease = match[1];
    } catch {
      continue;
    }
    if (!semver.valid(versionRelease)) {
      continue;
    }
    const isGreaterThanCurrent = semver.gt(versionRelease, currentVersion.raw);
    const isLessOrEqualThanLatest = semver.lte(versionRelease, latestVersion);
    if (isGreaterThanCurrent && isLessOrEqualThanLatest) {
      releaseNotes.push({
        version: versionRelease,
        note: getNoteValue(release)
      });
    }
  }
  return releaseNotes.sort((a, b) => semver.rcompare(a.version, b.version));
}
var GitLabProvider$1 = {};
Object.defineProperty(GitLabProvider$1, "__esModule", { value: true });
GitLabProvider$1.GitLabProvider = void 0;
const builder_util_runtime_1$b = out;
const url_1$3 = require$$2$1;
const escapeRegExp = lodash_escaperegexp;
const util_1$2 = util;
const Provider_1$8 = Provider$1;
class GitLabProvider extends Provider_1$8.Provider {
  /**
   * Normalizes filenames by replacing spaces and underscores with dashes.
   *
   * This is a workaround to handle filename formatting differences between tools:
   * - electron-builder formats filenames like "test file.txt" as "test-file.txt"
   * - GitLab may provide asset URLs using underscores, such as "test_file.txt"
   *
   * Because of this mismatch, we can't reliably extract the correct filename from
   * the asset path without normalization. This function ensures consistent matching
   * across different filename formats by converting all spaces and underscores to dashes.
   *
   * @param filename The filename to normalize
   * @returns The normalized filename with spaces and underscores replaced by dashes
   */
  normalizeFilename(filename) {
    return filename.replace(/ |_/g, "-");
  }
  constructor(options, updater, runtimeOptions) {
    super({
      ...runtimeOptions,
      // GitLab might not support multiple range requests efficiently
      isUseMultipleRangeRequest: false
    });
    this.options = options;
    this.updater = updater;
    this.cachedLatestVersion = null;
    const defaultHost = "gitlab.com";
    const host = options.host || defaultHost;
    this.baseApiUrl = (0, util_1$2.newBaseUrl)(`https://${host}/api/v4`);
  }
  createRequestOptions(url, headers) {
    const result = super.createRequestOptions(url, headers);
    result.redirect = "manual";
    return result;
  }
  get channel() {
    const result = this.updater.channel || this.options.channel;
    return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
  }
  async getLatestVersion() {
    const cancellationToken = new builder_util_runtime_1$b.CancellationToken();
    const latestReleaseUrl = (0, util_1$2.newUrlFromBase)(`projects/${this.options.projectId}/releases/permalink/latest`, this.baseApiUrl);
    const header = { Accept: "application/json", ...this.setAuthHeaderForToken(this.options.token || null) };
    let releaseResponse;
    try {
      releaseResponse = await this.httpRequest(latestReleaseUrl, header, cancellationToken);
    } catch (e) {
      throw (0, builder_util_runtime_1$b.newError)(`Unable to find latest release on GitLab (${latestReleaseUrl}): ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
    if (!releaseResponse) {
      throw (0, builder_util_runtime_1$b.newError)("No published releases on GitLab", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    }
    let latestRelease;
    try {
      latestRelease = JSON.parse(releaseResponse);
    } catch (e) {
      throw (0, builder_util_runtime_1$b.newError)(`Unable to parse latest release response from GitLab (${latestReleaseUrl}): response was not valid JSON: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
    if (latestRelease.upcoming_release) {
      throw (0, builder_util_runtime_1$b.newError)("Latest GitLab release is scheduled but not yet published", "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
    const tag = latestRelease.tag_name;
    let rawData = null;
    let channelFile = "";
    let channelFileUrl = null;
    const fetchChannelData = async (channelName) => {
      channelFile = (0, util_1$2.getChannelFilename)(channelName);
      const channelAsset = latestRelease.assets.links.find((asset) => asset.name === channelFile);
      if (!channelAsset) {
        throw (0, builder_util_runtime_1$b.newError)(`Cannot find ${channelFile} in the latest release assets`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      }
      channelFileUrl = new url_1$3.URL(channelAsset.direct_asset_url);
      const authHeaders = this.setAuthHeaderForToken(this.options.token || null);
      const headers = Object.keys(authHeaders).length ? authHeaders : void 0;
      try {
        const result2 = await this.httpRequest(channelFileUrl, headers, cancellationToken);
        if (!result2) {
          throw (0, builder_util_runtime_1$b.newError)(`Empty response from ${channelFileUrl}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        }
        return result2;
      } catch (e) {
        if (e instanceof builder_util_runtime_1$b.HttpError && e.statusCode === 404) {
          throw (0, builder_util_runtime_1$b.newError)(`Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        }
        throw e;
      }
    };
    try {
      rawData = await fetchChannelData(this.channel);
    } catch (e) {
      if (this.channel !== this.getDefaultChannelName()) {
        rawData = await fetchChannelData(this.getDefaultChannelName());
      } else {
        throw e;
      }
    }
    if (!rawData) {
      throw (0, builder_util_runtime_1$b.newError)(`Unable to parse channel data from ${channelFile}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    }
    const result = (0, Provider_1$8.parseUpdateInfo)(rawData, channelFile, channelFileUrl);
    if (result.releaseName == null) {
      result.releaseName = latestRelease.name;
    }
    if (result.releaseNotes == null) {
      result.releaseNotes = latestRelease.description || null;
    }
    const gitlabUpdateInfo = {
      tag,
      assets: this.convertAssetsToMap(latestRelease.assets),
      ...result
    };
    this.cachedLatestVersion = gitlabUpdateInfo;
    return gitlabUpdateInfo;
  }
  /**
   * Utility function to convert GitlabReleaseAsset to Map<string, string>
   * Maps asset names to their download URLs
   */
  convertAssetsToMap(assets) {
    const assetsMap = /* @__PURE__ */ new Map();
    for (const asset of assets.links) {
      assetsMap.set(this.normalizeFilename(asset.name), asset.direct_asset_url);
    }
    return assetsMap;
  }
  /**
   * Find blockmap file URL in assets map for a specific filename
   */
  findBlockMapInAssets(assets, filename) {
    const possibleBlockMapNames = [`${filename}.blockmap`, `${this.normalizeFilename(filename)}.blockmap`];
    for (const blockMapName of possibleBlockMapNames) {
      const assetUrl = assets.get(blockMapName);
      if (assetUrl) {
        return new url_1$3.URL(assetUrl);
      }
    }
    return null;
  }
  async fetchReleaseInfoByVersion(version) {
    const cancellationToken = new builder_util_runtime_1$b.CancellationToken();
    const possibleReleaseIds = [`v${version}`, version];
    for (const releaseId of possibleReleaseIds) {
      const releaseUrl = (0, util_1$2.newUrlFromBase)(`projects/${this.options.projectId}/releases/${encodeURIComponent(releaseId)}`, this.baseApiUrl);
      try {
        const header = { Accept: "application/json", ...this.setAuthHeaderForToken(this.options.token || null) };
        const releaseResponse = await this.httpRequest(releaseUrl, header, cancellationToken);
        if (releaseResponse) {
          const release = JSON.parse(releaseResponse);
          return release;
        }
      } catch (e) {
        if (e instanceof builder_util_runtime_1$b.HttpError && e.statusCode === 404) {
          continue;
        }
        throw (0, builder_util_runtime_1$b.newError)(`Unable to find release ${releaseId} on GitLab (${releaseUrl}): ${e.stack || e.message}`, "ERR_UPDATER_RELEASE_NOT_FOUND");
      }
    }
    throw (0, builder_util_runtime_1$b.newError)(`Unable to find release with version ${version} (tried: ${possibleReleaseIds.join(", ")}) on GitLab`, "ERR_UPDATER_RELEASE_NOT_FOUND");
  }
  setAuthHeaderForToken(token) {
    const headers = {};
    if (token != null) {
      if (token.startsWith("Bearer")) {
        headers.authorization = token;
      } else {
        headers["PRIVATE-TOKEN"] = token;
      }
    }
    return headers;
  }
  /**
   * Get version info for blockmap files, using cache when possible
   */
  async getVersionInfoForBlockMap(version) {
    if (this.cachedLatestVersion && this.cachedLatestVersion.version === version) {
      return this.cachedLatestVersion.assets;
    }
    const versionInfo = await this.fetchReleaseInfoByVersion(version);
    if (versionInfo && versionInfo.assets) {
      return this.convertAssetsToMap(versionInfo.assets);
    }
    return null;
  }
  /**
   * Find blockmap URLs from version assets
   */
  async findBlockMapUrlsFromAssets(oldVersion, newVersion, baseFilename) {
    let newBlockMapUrl = null;
    let oldBlockMapUrl = null;
    const newVersionAssets = await this.getVersionInfoForBlockMap(newVersion);
    if (newVersionAssets) {
      newBlockMapUrl = this.findBlockMapInAssets(newVersionAssets, baseFilename);
    }
    const oldVersionAssets = await this.getVersionInfoForBlockMap(oldVersion);
    if (oldVersionAssets) {
      const oldFilename = baseFilename.replace(new RegExp(escapeRegExp(newVersion), "g"), oldVersion);
      oldBlockMapUrl = this.findBlockMapInAssets(oldVersionAssets, oldFilename);
    }
    return [oldBlockMapUrl, newBlockMapUrl];
  }
  async getBlockMapFiles(baseUrl, oldVersion, newVersion, oldBlockMapFileBaseUrl = null) {
    if (this.options.uploadTarget === "project_upload") {
      const baseFilename = baseUrl.pathname.split("/").pop() || "";
      const [oldBlockMapUrl, newBlockMapUrl] = await this.findBlockMapUrlsFromAssets(oldVersion, newVersion, baseFilename);
      if (!newBlockMapUrl) {
        throw (0, builder_util_runtime_1$b.newError)(`Cannot find blockmap file for ${newVersion} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      }
      if (!oldBlockMapUrl) {
        throw (0, builder_util_runtime_1$b.newError)(`Cannot find blockmap file for ${oldVersion} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      }
      return [oldBlockMapUrl, newBlockMapUrl];
    } else {
      return super.getBlockMapFiles(baseUrl, oldVersion, newVersion, oldBlockMapFileBaseUrl);
    }
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$8.getFileList)(updateInfo).map((fileInfo) => {
      const possibleNames = [
        fileInfo.url,
        // Original filename
        this.normalizeFilename(fileInfo.url)
        // Normalized filename (spaces/underscores → dashes)
      ];
      const matchingAssetName = possibleNames.find((name) => updateInfo.assets.has(name));
      const assetUrl = matchingAssetName ? updateInfo.assets.get(matchingAssetName) : void 0;
      if (!assetUrl) {
        throw (0, builder_util_runtime_1$b.newError)(`Cannot find asset "${fileInfo.url}" in GitLab release assets. Available assets: ${Array.from(updateInfo.assets.keys()).join(", ")}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      }
      return {
        url: new url_1$3.URL(assetUrl),
        info: fileInfo
      };
    });
  }
  toString() {
    return `GitLab (projectId: ${this.options.projectId}, channel: ${this.channel})`;
  }
}
GitLabProvider$1.GitLabProvider = GitLabProvider;
var KeygenProvider$1 = {};
Object.defineProperty(KeygenProvider$1, "__esModule", { value: true });
KeygenProvider$1.KeygenProvider = void 0;
const builder_util_runtime_1$a = out;
const util_1$1 = util;
const Provider_1$7 = Provider$1;
class KeygenProvider extends Provider_1$7.Provider {
  constructor(configuration, updater, runtimeOptions) {
    super({
      ...runtimeOptions,
      isUseMultipleRangeRequest: false
    });
    this.configuration = configuration;
    this.updater = updater;
    this.defaultHostname = "api.keygen.sh";
    const host = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, util_1$1.newBaseUrl)(`https://${host}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const cancellationToken = new builder_util_runtime_1$a.CancellationToken();
    const channelFile = (0, util_1$1.getChannelFilename)(this.getCustomChannelName(this.channel));
    const channelUrl = (0, util_1$1.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const updateInfo = await this.httpRequest(channelUrl, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, cancellationToken);
      return (0, Provider_1$7.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
    } catch (e) {
      throw (0, builder_util_runtime_1$a.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$7.resolveFiles)(updateInfo, this.baseUrl);
  }
  toString() {
    const { account, product, platform: platform2 } = this.configuration;
    return `Keygen (account: ${account}, product: ${product}, platform: ${platform2}, channel: ${this.channel})`;
  }
}
KeygenProvider$1.KeygenProvider = KeygenProvider;
var PrivateGitHubProvider$1 = {};
Object.defineProperty(PrivateGitHubProvider$1, "__esModule", { value: true });
PrivateGitHubProvider$1.PrivateGitHubProvider = void 0;
const builder_util_runtime_1$9 = out;
const js_yaml_1$1 = jsYaml;
const path$6 = require$$1$1;
const url_1$2 = require$$2$1;
const util_1 = util;
const GitHubProvider_1$1 = GitHubProvider$1;
const Provider_1$6 = Provider$1;
class PrivateGitHubProvider extends GitHubProvider_1$1.BaseGitHubProvider {
  constructor(options, updater, token, runtimeOptions) {
    super(options, "api.github.com", runtimeOptions);
    this.updater = updater;
    this.token = token;
  }
  createRequestOptions(url, headers) {
    const result = super.createRequestOptions(url, headers);
    result.redirect = "manual";
    return result;
  }
  async getLatestVersion() {
    const cancellationToken = new builder_util_runtime_1$9.CancellationToken();
    const channelFile = (0, util_1.getChannelFilename)(this.getDefaultChannelName());
    const releaseInfo = await this.getLatestVersionInfo(cancellationToken);
    const asset = releaseInfo.assets.find((it) => it.name === channelFile);
    if (asset == null) {
      throw (0, builder_util_runtime_1$9.newError)(`Cannot find ${channelFile} in the release ${releaseInfo.html_url || releaseInfo.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    }
    const url = new url_1$2.URL(asset.url);
    let result;
    try {
      result = (0, js_yaml_1$1.load)(await this.httpRequest(url, this.configureHeaders("application/octet-stream"), cancellationToken));
    } catch (e) {
      if (e instanceof builder_util_runtime_1$9.HttpError && e.statusCode === 404) {
        throw (0, builder_util_runtime_1$9.newError)(`Cannot find ${channelFile} in the latest release artifacts (${url}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      }
      throw e;
    }
    result.assets = releaseInfo.assets;
    return result;
  }
  get fileExtraDownloadHeaders() {
    return this.configureHeaders("application/octet-stream");
  }
  configureHeaders(accept) {
    return {
      accept,
      authorization: `token ${this.token}`
    };
  }
  async getLatestVersionInfo(cancellationToken) {
    const allowPrerelease = this.updater.allowPrerelease;
    let basePath = this.basePath;
    if (!allowPrerelease) {
      basePath = `${basePath}/latest`;
    }
    const url = (0, util_1.newUrlFromBase)(basePath, this.baseUrl);
    try {
      const version = JSON.parse(await this.httpRequest(url, this.configureHeaders("application/vnd.github.v3+json"), cancellationToken));
      if (allowPrerelease) {
        const candidates = version.filter((it) => !it.draft);
        return candidates.find((it) => it.prerelease) || candidates[0];
      } else {
        return version;
      }
    } catch (e) {
      throw (0, builder_util_runtime_1$9.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$6.getFileList)(updateInfo).map((it) => {
      const name = path$6.posix.basename(it.url).replace(/ /g, "-");
      const asset = updateInfo.assets.find((it2) => it2 != null && it2.name === name);
      if (asset == null) {
        throw (0, builder_util_runtime_1$9.newError)(`Cannot find asset "${name}" in: ${JSON.stringify(updateInfo.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      }
      return {
        url: new url_1$2.URL(asset.url),
        info: it
      };
    });
  }
}
PrivateGitHubProvider$1.PrivateGitHubProvider = PrivateGitHubProvider;
Object.defineProperty(providerFactory, "__esModule", { value: true });
providerFactory.isUrlProbablySupportMultiRangeRequests = isUrlProbablySupportMultiRangeRequests;
providerFactory.createClient = createClient;
const builder_util_runtime_1$8 = out;
const BitbucketProvider_1 = BitbucketProvider$1;
const GenericProvider_1$1 = GenericProvider$1;
const GitHubProvider_1 = GitHubProvider$1;
const GitLabProvider_1 = GitLabProvider$1;
const KeygenProvider_1 = KeygenProvider$1;
const PrivateGitHubProvider_1 = PrivateGitHubProvider$1;
function isUrlProbablySupportMultiRangeRequests(url) {
  return !url.includes("s3.amazonaws.com");
}
function createClient(data, updater, runtimeOptions) {
  if (typeof data === "string") {
    throw (0, builder_util_runtime_1$8.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  }
  const provider = data.provider;
  switch (provider) {
    case "github": {
      const githubOptions = data;
      const token = (githubOptions.private ? process.env["GH_TOKEN"] || process.env["GITHUB_TOKEN"] : null) || githubOptions.token;
      if (token == null) {
        return new GitHubProvider_1.GitHubProvider(githubOptions, updater, runtimeOptions);
      } else {
        return new PrivateGitHubProvider_1.PrivateGitHubProvider(githubOptions, updater, token, runtimeOptions);
      }
    }
    case "bitbucket":
      return new BitbucketProvider_1.BitbucketProvider(data, updater, runtimeOptions);
    case "gitlab":
      return new GitLabProvider_1.GitLabProvider(data, updater, runtimeOptions);
    case "keygen":
      return new KeygenProvider_1.KeygenProvider(data, updater, runtimeOptions);
    case "s3":
    case "spaces":
      return new GenericProvider_1$1.GenericProvider({
        provider: "generic",
        url: (0, builder_util_runtime_1$8.getS3LikeProviderBaseUrl)(data),
        channel: data.channel || null
      }, updater, {
        ...runtimeOptions,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: false
      });
    case "generic": {
      const options = data;
      return new GenericProvider_1$1.GenericProvider(options, updater, {
        ...runtimeOptions,
        isUseMultipleRangeRequest: options.useMultipleRangeRequest !== false && isUrlProbablySupportMultiRangeRequests(options.url)
      });
    }
    case "custom": {
      const options = data;
      const constructor = options.updateProvider;
      if (!constructor) {
        throw (0, builder_util_runtime_1$8.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      }
      return new constructor(options, updater, runtimeOptions);
    }
    default:
      throw (0, builder_util_runtime_1$8.newError)(`Unsupported provider: ${provider}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var GenericDifferentialDownloader$1 = {};
var DifferentialDownloader$1 = {};
var DataSplitter$1 = {};
var downloadPlanBuilder = {};
Object.defineProperty(downloadPlanBuilder, "__esModule", { value: true });
downloadPlanBuilder.OperationKind = void 0;
downloadPlanBuilder.computeOperations = computeOperations;
var OperationKind$1;
(function(OperationKind2) {
  OperationKind2[OperationKind2["COPY"] = 0] = "COPY";
  OperationKind2[OperationKind2["DOWNLOAD"] = 1] = "DOWNLOAD";
})(OperationKind$1 || (downloadPlanBuilder.OperationKind = OperationKind$1 = {}));
function computeOperations(oldBlockMap, newBlockMap, logger) {
  const nameToOldBlocks = buildBlockFileMap(oldBlockMap.files);
  const nameToNewBlocks = buildBlockFileMap(newBlockMap.files);
  let lastOperation = null;
  const blockMapFile = newBlockMap.files[0];
  const operations = [];
  const name = blockMapFile.name;
  const oldEntry = nameToOldBlocks.get(name);
  if (oldEntry == null) {
    throw new Error(`no file ${name} in old blockmap`);
  }
  const newFile = nameToNewBlocks.get(name);
  let changedBlockCount = 0;
  const { checksumToOffset: checksumToOldOffset, checksumToOldSize } = buildChecksumMap(nameToOldBlocks.get(name), oldEntry.offset, logger);
  let newOffset = blockMapFile.offset;
  for (let i = 0; i < newFile.checksums.length; newOffset += newFile.sizes[i], i++) {
    const blockSize = newFile.sizes[i];
    const checksum = newFile.checksums[i];
    let oldOffset = checksumToOldOffset.get(checksum);
    if (oldOffset != null && checksumToOldSize.get(checksum) !== blockSize) {
      logger.warn(`Checksum ("${checksum}") matches, but size differs (old: ${checksumToOldSize.get(checksum)}, new: ${blockSize})`);
      oldOffset = void 0;
    }
    if (oldOffset === void 0) {
      changedBlockCount++;
      if (lastOperation != null && lastOperation.kind === OperationKind$1.DOWNLOAD && lastOperation.end === newOffset) {
        lastOperation.end += blockSize;
      } else {
        lastOperation = {
          kind: OperationKind$1.DOWNLOAD,
          start: newOffset,
          end: newOffset + blockSize
          // oldBlocks: null,
        };
        validateAndAdd(lastOperation, operations, checksum, i);
      }
    } else {
      if (lastOperation != null && lastOperation.kind === OperationKind$1.COPY && lastOperation.end === oldOffset) {
        lastOperation.end += blockSize;
      } else {
        lastOperation = {
          kind: OperationKind$1.COPY,
          start: oldOffset,
          end: oldOffset + blockSize
          // oldBlocks: [checksum]
        };
        validateAndAdd(lastOperation, operations, checksum, i);
      }
    }
  }
  if (changedBlockCount > 0) {
    logger.info(`File${blockMapFile.name === "file" ? "" : " " + blockMapFile.name} has ${changedBlockCount} changed blocks`);
  }
  return operations;
}
const isValidateOperationRange = process.env["DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES"] === "true";
function validateAndAdd(operation, operations, checksum, index) {
  if (isValidateOperationRange && operations.length !== 0) {
    const lastOperation = operations[operations.length - 1];
    if (lastOperation.kind === operation.kind && operation.start < lastOperation.end && operation.start > lastOperation.start) {
      const min = [lastOperation.start, lastOperation.end, operation.start, operation.end].reduce((p, v) => p < v ? p : v);
      throw new Error(`operation (block index: ${index}, checksum: ${checksum}, kind: ${OperationKind$1[operation.kind]}) overlaps previous operation (checksum: ${checksum}):
abs: ${lastOperation.start} until ${lastOperation.end} and ${operation.start} until ${operation.end}
rel: ${lastOperation.start - min} until ${lastOperation.end - min} and ${operation.start - min} until ${operation.end - min}`);
    }
  }
  operations.push(operation);
}
function buildChecksumMap(file2, fileOffset, logger) {
  const checksumToOffset = /* @__PURE__ */ new Map();
  const checksumToSize = /* @__PURE__ */ new Map();
  let offset = fileOffset;
  for (let i = 0; i < file2.checksums.length; i++) {
    const checksum = file2.checksums[i];
    const size = file2.sizes[i];
    const existing = checksumToSize.get(checksum);
    if (existing === void 0) {
      checksumToOffset.set(checksum, offset);
      checksumToSize.set(checksum, size);
    } else if (logger.debug != null) {
      const sizeExplanation = existing === size ? "(same size)" : `(size: ${existing}, this size: ${size})`;
      logger.debug(`${checksum} duplicated in blockmap ${sizeExplanation}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
    }
    offset += size;
  }
  return { checksumToOffset, checksumToOldSize: checksumToSize };
}
function buildBlockFileMap(list) {
  const result = /* @__PURE__ */ new Map();
  for (const item of list) {
    result.set(item.name, item);
  }
  return result;
}
Object.defineProperty(DataSplitter$1, "__esModule", { value: true });
DataSplitter$1.DataSplitter = void 0;
DataSplitter$1.copyData = copyData;
const builder_util_runtime_1$7 = out;
const fs_1$3 = fs$j;
const stream_1$1 = require$$0$2;
const downloadPlanBuilder_1$2 = downloadPlanBuilder;
const DOUBLE_CRLF = Buffer.from("\r\n\r\n");
var ReadState;
(function(ReadState2) {
  ReadState2[ReadState2["INIT"] = 0] = "INIT";
  ReadState2[ReadState2["HEADER"] = 1] = "HEADER";
  ReadState2[ReadState2["BODY"] = 2] = "BODY";
})(ReadState || (ReadState = {}));
function copyData(task, out2, oldFileFd, reject, resolve) {
  const readStream = (0, fs_1$3.createReadStream)("", {
    fd: oldFileFd,
    autoClose: false,
    start: task.start,
    // end is inclusive
    end: task.end - 1
  });
  readStream.on("error", reject);
  readStream.once("end", resolve);
  readStream.pipe(out2, {
    end: false
  });
}
class DataSplitter extends stream_1$1.Writable {
  constructor(out2, options, partIndexToTaskIndex, boundary, partIndexToLength, finishHandler, grandTotalBytes, onProgress) {
    super();
    this.out = out2;
    this.options = options;
    this.partIndexToTaskIndex = partIndexToTaskIndex;
    this.partIndexToLength = partIndexToLength;
    this.finishHandler = finishHandler;
    this.grandTotalBytes = grandTotalBytes;
    this.onProgress = onProgress;
    this.start = Date.now();
    this.nextUpdate = this.start + 1e3;
    this.transferred = 0;
    this.delta = 0;
    this.partIndex = -1;
    this.headerListBuffer = null;
    this.readState = ReadState.INIT;
    this.ignoreByteCount = 0;
    this.remainingPartDataCount = 0;
    this.actualPartLength = 0;
    this.boundaryLength = boundary.length + 4;
    this.ignoreByteCount = this.boundaryLength - 2;
  }
  get isFinished() {
    return this.partIndex === this.partIndexToLength.length;
  }
  // noinspection JSUnusedGlobalSymbols
  _write(data, encoding, callback) {
    if (this.isFinished) {
      console.error(`Trailing ignored data: ${data.length} bytes`);
      return;
    }
    this.handleData(data).then(() => {
      if (this.onProgress) {
        const now = Date.now();
        if ((now >= this.nextUpdate || this.transferred === this.grandTotalBytes) && this.grandTotalBytes && (now - this.start) / 1e3) {
          this.nextUpdate = now + 1e3;
          this.onProgress({
            total: this.grandTotalBytes,
            delta: this.delta,
            transferred: this.transferred,
            percent: this.transferred / this.grandTotalBytes * 100,
            bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
          });
          this.delta = 0;
        }
      }
      callback();
    }).catch(callback);
  }
  async handleData(chunk) {
    let start = 0;
    if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0) {
      throw (0, builder_util_runtime_1$7.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
    }
    if (this.ignoreByteCount > 0) {
      const toIgnore = Math.min(this.ignoreByteCount, chunk.length);
      this.ignoreByteCount -= toIgnore;
      start = toIgnore;
    } else if (this.remainingPartDataCount > 0) {
      const toRead = Math.min(this.remainingPartDataCount, chunk.length);
      this.remainingPartDataCount -= toRead;
      await this.processPartData(chunk, 0, toRead);
      start = toRead;
    }
    if (start === chunk.length) {
      return;
    }
    if (this.readState === ReadState.HEADER) {
      const headerListEnd = this.searchHeaderListEnd(chunk, start);
      if (headerListEnd === -1) {
        return;
      }
      start = headerListEnd;
      this.readState = ReadState.BODY;
      this.headerListBuffer = null;
    }
    while (true) {
      if (this.readState === ReadState.BODY) {
        this.readState = ReadState.INIT;
      } else {
        this.partIndex++;
        let taskIndex = this.partIndexToTaskIndex.get(this.partIndex);
        if (taskIndex == null) {
          if (this.isFinished) {
            taskIndex = this.options.end;
          } else {
            throw (0, builder_util_runtime_1$7.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
          }
        }
        const prevTaskIndex = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
        if (prevTaskIndex < taskIndex) {
          await this.copyExistingData(prevTaskIndex, taskIndex);
        } else if (prevTaskIndex > taskIndex) {
          throw (0, builder_util_runtime_1$7.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
        }
        if (this.isFinished) {
          this.onPartEnd();
          this.finishHandler();
          return;
        }
        start = this.searchHeaderListEnd(chunk, start);
        if (start === -1) {
          this.readState = ReadState.HEADER;
          return;
        }
      }
      const partLength = this.partIndexToLength[this.partIndex];
      const end = start + partLength;
      const effectiveEnd = Math.min(end, chunk.length);
      await this.processPartStarted(chunk, start, effectiveEnd);
      this.remainingPartDataCount = partLength - (effectiveEnd - start);
      if (this.remainingPartDataCount > 0) {
        return;
      }
      start = end + this.boundaryLength;
      if (start >= chunk.length) {
        this.ignoreByteCount = this.boundaryLength - (chunk.length - end);
        return;
      }
    }
  }
  copyExistingData(index, end) {
    return new Promise((resolve, reject) => {
      const w = () => {
        if (index === end) {
          resolve();
          return;
        }
        const task = this.options.tasks[index];
        if (task.kind !== downloadPlanBuilder_1$2.OperationKind.COPY) {
          reject(new Error("Task kind must be COPY"));
          return;
        }
        copyData(task, this.out, this.options.oldFileFd, reject, () => {
          index++;
          w();
        });
      };
      w();
    });
  }
  searchHeaderListEnd(chunk, readOffset) {
    const headerListEnd = chunk.indexOf(DOUBLE_CRLF, readOffset);
    if (headerListEnd !== -1) {
      return headerListEnd + DOUBLE_CRLF.length;
    }
    const partialChunk = readOffset === 0 ? chunk : chunk.slice(readOffset);
    if (this.headerListBuffer == null) {
      this.headerListBuffer = partialChunk;
    } else {
      this.headerListBuffer = Buffer.concat([this.headerListBuffer, partialChunk]);
    }
    return -1;
  }
  onPartEnd() {
    const expectedLength = this.partIndexToLength[this.partIndex - 1];
    if (this.actualPartLength !== expectedLength) {
      throw (0, builder_util_runtime_1$7.newError)(`Expected length: ${expectedLength} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
    }
    this.actualPartLength = 0;
  }
  processPartStarted(data, start, end) {
    if (this.partIndex !== 0) {
      this.onPartEnd();
    }
    return this.processPartData(data, start, end);
  }
  processPartData(data, start, end) {
    this.actualPartLength += end - start;
    this.transferred += end - start;
    this.delta += end - start;
    const out2 = this.out;
    if (out2.write(start === 0 && data.length === end ? data : data.slice(start, end))) {
      return Promise.resolve();
    } else {
      return new Promise((resolve, reject) => {
        out2.on("error", reject);
        out2.once("drain", () => {
          out2.removeListener("error", reject);
          resolve();
        });
      });
    }
  }
}
DataSplitter$1.DataSplitter = DataSplitter;
var multipleRangeDownloader = {};
Object.defineProperty(multipleRangeDownloader, "__esModule", { value: true });
multipleRangeDownloader.executeTasksUsingMultipleRangeRequests = executeTasksUsingMultipleRangeRequests;
multipleRangeDownloader.checkIsRangesSupported = checkIsRangesSupported;
const builder_util_runtime_1$6 = out;
const DataSplitter_1$1 = DataSplitter$1;
const downloadPlanBuilder_1$1 = downloadPlanBuilder;
function executeTasksUsingMultipleRangeRequests(differentialDownloader, tasks, out2, oldFileFd, reject) {
  const w = (taskOffset) => {
    if (taskOffset >= tasks.length) {
      if (differentialDownloader.fileMetadataBuffer != null) {
        out2.write(differentialDownloader.fileMetadataBuffer);
      }
      out2.end();
      return;
    }
    const nextOffset = taskOffset + 1e3;
    doExecuteTasks(differentialDownloader, {
      tasks,
      start: taskOffset,
      end: Math.min(tasks.length, nextOffset),
      oldFileFd
    }, out2, () => w(nextOffset), reject);
  };
  return w;
}
function doExecuteTasks(differentialDownloader, options, out2, resolve, reject) {
  let ranges = "bytes=";
  let partCount = 0;
  let grandTotalBytes = 0;
  const partIndexToTaskIndex = /* @__PURE__ */ new Map();
  const partIndexToLength = [];
  for (let i = options.start; i < options.end; i++) {
    const task = options.tasks[i];
    if (task.kind === downloadPlanBuilder_1$1.OperationKind.DOWNLOAD) {
      ranges += `${task.start}-${task.end - 1}, `;
      partIndexToTaskIndex.set(partCount, i);
      partCount++;
      partIndexToLength.push(task.end - task.start);
      grandTotalBytes += task.end - task.start;
    }
  }
  if (partCount <= 1) {
    const w = (index) => {
      if (index >= options.end) {
        resolve();
        return;
      }
      const task = options.tasks[index++];
      if (task.kind === downloadPlanBuilder_1$1.OperationKind.COPY) {
        (0, DataSplitter_1$1.copyData)(task, out2, options.oldFileFd, reject, () => w(index));
      } else {
        const requestOptions2 = differentialDownloader.createRequestOptions();
        requestOptions2.headers.Range = `bytes=${task.start}-${task.end - 1}`;
        const request2 = differentialDownloader.httpExecutor.createRequest(requestOptions2, (response) => {
          response.on("error", reject);
          if (!checkIsRangesSupported(response, reject)) {
            return;
          }
          response.pipe(out2, {
            end: false
          });
          response.once("end", () => w(index));
        });
        differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request2, reject);
        request2.end();
      }
    };
    w(options.start);
    return;
  }
  const requestOptions = differentialDownloader.createRequestOptions();
  requestOptions.headers.Range = ranges.substring(0, ranges.length - 2);
  const request = differentialDownloader.httpExecutor.createRequest(requestOptions, (response) => {
    if (!checkIsRangesSupported(response, reject)) {
      return;
    }
    const contentType = (0, builder_util_runtime_1$6.safeGetHeader)(response, "content-type");
    const m = /^multipart\/.+?\s*;\s*boundary=(?:"([^"]+)"|([^\s";]+))\s*$/i.exec(contentType);
    if (m == null) {
      reject(new Error(`Content-Type "multipart/byteranges" is expected, but got "${contentType}"`));
      return;
    }
    const dicer = new DataSplitter_1$1.DataSplitter(out2, options, partIndexToTaskIndex, m[1] || m[2], partIndexToLength, resolve, grandTotalBytes, differentialDownloader.options.onProgress);
    dicer.on("error", reject);
    response.pipe(dicer);
    response.on("end", () => {
      setTimeout(() => {
        request.abort();
        reject(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
  request.end();
}
function checkIsRangesSupported(response, reject) {
  if (response.statusCode >= 400) {
    reject((0, builder_util_runtime_1$6.createHttpError)(response));
    return false;
  }
  if (response.statusCode !== 206) {
    const acceptRanges = (0, builder_util_runtime_1$6.safeGetHeader)(response, "accept-ranges");
    if (acceptRanges == null || acceptRanges === "none") {
      reject(new Error(`Server doesn't support Accept-Ranges (response code ${response.statusCode})`));
      return false;
    }
  }
  return true;
}
var ProgressDifferentialDownloadCallbackTransform$1 = {};
Object.defineProperty(ProgressDifferentialDownloadCallbackTransform$1, "__esModule", { value: true });
ProgressDifferentialDownloadCallbackTransform$1.ProgressDifferentialDownloadCallbackTransform = void 0;
const stream_1 = require$$0$2;
var OperationKind;
(function(OperationKind2) {
  OperationKind2[OperationKind2["COPY"] = 0] = "COPY";
  OperationKind2[OperationKind2["DOWNLOAD"] = 1] = "DOWNLOAD";
})(OperationKind || (OperationKind = {}));
class ProgressDifferentialDownloadCallbackTransform extends stream_1.Transform {
  constructor(progressDifferentialDownloadInfo, cancellationToken, onProgress) {
    super();
    this.progressDifferentialDownloadInfo = progressDifferentialDownloadInfo;
    this.cancellationToken = cancellationToken;
    this.onProgress = onProgress;
    this.start = Date.now();
    this.transferred = 0;
    this.delta = 0;
    this.expectedBytes = 0;
    this.index = 0;
    this.operationType = OperationKind.COPY;
    this.nextUpdate = this.start + 1e3;
  }
  _transform(chunk, encoding, callback) {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == OperationKind.COPY) {
      callback(null, chunk);
      return;
    }
    this.transferred += chunk.length;
    this.delta += chunk.length;
    const now = Date.now();
    if (now >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal) {
      this.nextUpdate = now + 1e3;
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
      });
      this.delta = 0;
    }
    callback(null, chunk);
  }
  beginFileCopy() {
    this.operationType = OperationKind.COPY;
  }
  beginRangeDownload() {
    this.operationType = OperationKind.DOWNLOAD;
    this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
  }
  endRangeDownload() {
    if (this.transferred !== this.progressDifferentialDownloadInfo.grandTotal) {
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      });
    }
  }
  // Called when we are 100% done with the connection/download
  _flush(callback) {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
    this.delta = 0;
    this.transferred = 0;
    callback(null);
  }
}
ProgressDifferentialDownloadCallbackTransform$1.ProgressDifferentialDownloadCallbackTransform = ProgressDifferentialDownloadCallbackTransform;
Object.defineProperty(DifferentialDownloader$1, "__esModule", { value: true });
DifferentialDownloader$1.DifferentialDownloader = void 0;
const builder_util_runtime_1$5 = out;
const fs_extra_1$5 = lib;
const fs_1$2 = fs$j;
const DataSplitter_1 = DataSplitter$1;
const url_1$1 = require$$2$1;
const downloadPlanBuilder_1 = downloadPlanBuilder;
const multipleRangeDownloader_1 = multipleRangeDownloader;
const ProgressDifferentialDownloadCallbackTransform_1 = ProgressDifferentialDownloadCallbackTransform$1;
class DifferentialDownloader {
  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor(blockAwareFileInfo, httpExecutor2, options) {
    this.blockAwareFileInfo = blockAwareFileInfo;
    this.httpExecutor = httpExecutor2;
    this.options = options;
    this.fileMetadataBuffer = null;
    this.logger = options.logger;
  }
  createRequestOptions() {
    const result = {
      headers: {
        ...this.options.requestHeaders,
        accept: "*/*"
      }
    };
    (0, builder_util_runtime_1$5.configureRequestUrl)(this.options.newUrl, result);
    (0, builder_util_runtime_1$5.configureRequestOptions)(result);
    return result;
  }
  doDownload(oldBlockMap, newBlockMap) {
    if (oldBlockMap.version !== newBlockMap.version) {
      throw new Error(`version is different (${oldBlockMap.version} - ${newBlockMap.version}), full download is required`);
    }
    const logger = this.logger;
    const operations = (0, downloadPlanBuilder_1.computeOperations)(oldBlockMap, newBlockMap, logger);
    if (logger.debug != null) {
      logger.debug(JSON.stringify(operations, null, 2));
    }
    let downloadSize = 0;
    let copySize = 0;
    for (const operation of operations) {
      const length = operation.end - operation.start;
      if (operation.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
        downloadSize += length;
      } else {
        copySize += length;
      }
    }
    const newSize = this.blockAwareFileInfo.size;
    if (downloadSize + copySize + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== newSize) {
      throw new Error(`Internal error, size mismatch: downloadSize: ${downloadSize}, copySize: ${copySize}, newSize: ${newSize}`);
    }
    logger.info(`Full: ${formatBytes(newSize)}, To download: ${formatBytes(downloadSize)} (${Math.round(downloadSize / (newSize / 100))}%)`);
    return this.downloadFile(operations);
  }
  downloadFile(tasks) {
    const fdList = [];
    const closeFiles = () => {
      return Promise.all(fdList.map((openedFile) => {
        return (0, fs_extra_1$5.close)(openedFile.descriptor).catch((e) => {
          this.logger.error(`cannot close file "${openedFile.path}": ${e}`);
        });
      }));
    };
    return this.doDownloadFile(tasks, fdList).then(closeFiles).catch((e) => {
      return closeFiles().catch((closeFilesError) => {
        try {
          this.logger.error(`cannot close files: ${closeFilesError}`);
        } catch (errorOnLog) {
          try {
            console.error(errorOnLog);
          } catch (_ignored) {
          }
        }
        throw e;
      }).then(() => {
        throw e;
      });
    });
  }
  async doDownloadFile(tasks, fdList) {
    const oldFileFd = await (0, fs_extra_1$5.open)(this.options.oldFile, "r");
    fdList.push({ descriptor: oldFileFd, path: this.options.oldFile });
    const newFileFd = await (0, fs_extra_1$5.open)(this.options.newFile, "w");
    fdList.push({ descriptor: newFileFd, path: this.options.newFile });
    const fileOut = (0, fs_1$2.createWriteStream)(this.options.newFile, { fd: newFileFd });
    await new Promise((resolve, reject) => {
      const streams = [];
      let downloadInfoTransform = void 0;
      if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
        const expectedByteCounts = [];
        let grandTotalBytes = 0;
        for (const task of tasks) {
          if (task.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
            expectedByteCounts.push(task.end - task.start);
            grandTotalBytes += task.end - task.start;
          }
        }
        const progressDifferentialDownloadInfo = {
          expectedByteCounts,
          grandTotal: grandTotalBytes
        };
        downloadInfoTransform = new ProgressDifferentialDownloadCallbackTransform_1.ProgressDifferentialDownloadCallbackTransform(progressDifferentialDownloadInfo, this.options.cancellationToken, this.options.onProgress);
        streams.push(downloadInfoTransform);
      }
      const digestTransform = new builder_util_runtime_1$5.DigestTransform(this.blockAwareFileInfo.sha512);
      digestTransform.isValidateOnEnd = false;
      streams.push(digestTransform);
      fileOut.on("finish", () => {
        fileOut.close(() => {
          fdList.splice(1, 1);
          try {
            digestTransform.validate();
          } catch (e) {
            reject(e);
            return;
          }
          resolve(void 0);
        });
      });
      streams.push(fileOut);
      let lastStream = null;
      for (const stream of streams) {
        stream.on("error", reject);
        if (lastStream == null) {
          lastStream = stream;
        } else {
          lastStream = lastStream.pipe(stream);
        }
      }
      const firstStream = streams[0];
      let w;
      if (this.options.isUseMultipleRangeRequest) {
        w = (0, multipleRangeDownloader_1.executeTasksUsingMultipleRangeRequests)(this, tasks, firstStream, oldFileFd, reject);
        w(0);
        return;
      }
      let downloadOperationCount = 0;
      let actualUrl = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const requestOptions = this.createRequestOptions();
      requestOptions.redirect = "manual";
      w = (index) => {
        var _a, _b;
        if (index >= tasks.length) {
          if (this.fileMetadataBuffer != null) {
            firstStream.write(this.fileMetadataBuffer);
          }
          firstStream.end();
          return;
        }
        const operation = tasks[index++];
        if (operation.kind === downloadPlanBuilder_1.OperationKind.COPY) {
          if (downloadInfoTransform) {
            downloadInfoTransform.beginFileCopy();
          }
          (0, DataSplitter_1.copyData)(operation, firstStream, oldFileFd, reject, () => w(index));
          return;
        }
        const range2 = `bytes=${operation.start}-${operation.end - 1}`;
        requestOptions.headers.range = range2;
        (_b = (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug) === null || _b === void 0 ? void 0 : _b.call(_a, `download range: ${range2}`);
        if (downloadInfoTransform) {
          downloadInfoTransform.beginRangeDownload();
        }
        const request = this.httpExecutor.createRequest(requestOptions, (response) => {
          response.on("error", reject);
          response.on("aborted", () => {
            reject(new Error("response has been aborted by the server"));
          });
          if (response.statusCode >= 400) {
            reject((0, builder_util_runtime_1$5.createHttpError)(response));
          }
          response.pipe(firstStream, {
            end: false
          });
          response.once("end", () => {
            if (downloadInfoTransform) {
              downloadInfoTransform.endRangeDownload();
            }
            if (++downloadOperationCount === 100) {
              downloadOperationCount = 0;
              setTimeout(() => w(index), 1e3);
            } else {
              w(index);
            }
          });
        });
        request.on("redirect", (statusCode, method, redirectUrl) => {
          this.logger.info(`Redirect to ${removeQuery(redirectUrl)}`);
          actualUrl = redirectUrl;
          (0, builder_util_runtime_1$5.configureRequestUrl)(new url_1$1.URL(actualUrl), requestOptions);
          request.followRedirect();
        });
        this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
        request.end();
      };
      w(0);
    });
  }
  async readRemoteBytes(start, endInclusive) {
    const buffer = Buffer.allocUnsafe(endInclusive + 1 - start);
    const requestOptions = this.createRequestOptions();
    requestOptions.headers.range = `bytes=${start}-${endInclusive}`;
    let position = 0;
    await this.request(requestOptions, (chunk) => {
      chunk.copy(buffer, position);
      position += chunk.length;
    });
    if (position !== buffer.length) {
      throw new Error(`Received data length ${position} is not equal to expected ${buffer.length}`);
    }
    return buffer;
  }
  request(requestOptions, dataHandler) {
    return new Promise((resolve, reject) => {
      const request = this.httpExecutor.createRequest(requestOptions, (response) => {
        if (!(0, multipleRangeDownloader_1.checkIsRangesSupported)(response, reject)) {
          return;
        }
        response.on("error", reject);
        response.on("aborted", () => {
          reject(new Error("response has been aborted by the server"));
        });
        response.on("data", dataHandler);
        response.on("end", () => resolve());
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
      request.end();
    });
  }
}
DifferentialDownloader$1.DifferentialDownloader = DifferentialDownloader;
function formatBytes(value, symbol = " KB") {
  return new Intl.NumberFormat("en").format((value / 1024).toFixed(2)) + symbol;
}
function removeQuery(url) {
  const index = url.indexOf("?");
  return index < 0 ? url : url.substring(0, index);
}
Object.defineProperty(GenericDifferentialDownloader$1, "__esModule", { value: true });
GenericDifferentialDownloader$1.GenericDifferentialDownloader = void 0;
const DifferentialDownloader_1$1 = DifferentialDownloader$1;
class GenericDifferentialDownloader extends DifferentialDownloader_1$1.DifferentialDownloader {
  download(oldBlockMap, newBlockMap) {
    return this.doDownload(oldBlockMap, newBlockMap);
  }
}
GenericDifferentialDownloader$1.GenericDifferentialDownloader = GenericDifferentialDownloader;
var types = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.UpdaterSignal = exports.UPDATE_DOWNLOADED = exports.DOWNLOAD_PROGRESS = exports.CancellationToken = void 0;
  exports.addHandler = addHandler;
  const builder_util_runtime_12 = out;
  Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function() {
    return builder_util_runtime_12.CancellationToken;
  } });
  exports.DOWNLOAD_PROGRESS = "download-progress";
  exports.UPDATE_DOWNLOADED = "update-downloaded";
  class UpdaterSignal {
    constructor(emitter) {
      this.emitter = emitter;
    }
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(handler) {
      addHandler(this.emitter, "login", handler);
    }
    progress(handler) {
      addHandler(this.emitter, exports.DOWNLOAD_PROGRESS, handler);
    }
    updateDownloaded(handler) {
      addHandler(this.emitter, exports.UPDATE_DOWNLOADED, handler);
    }
    updateCancelled(handler) {
      addHandler(this.emitter, "update-cancelled", handler);
    }
  }
  exports.UpdaterSignal = UpdaterSignal;
  function addHandler(emitter, event, handler) {
    {
      emitter.on(event, handler);
    }
  }
})(types);
Object.defineProperty(AppUpdater$1, "__esModule", { value: true });
AppUpdater$1.NoOpLogger = AppUpdater$1.AppUpdater = void 0;
const builder_util_runtime_1$4 = out;
const crypto_1$1 = require$$0;
const os_1 = require$$2;
const events_1 = require$$0$3;
const fs_extra_1$4 = lib;
const js_yaml_1 = jsYaml;
const lazy_val_1 = main;
const path$5 = require$$1$1;
const semver_1 = semver$1;
const DownloadedUpdateHelper_1 = DownloadedUpdateHelper$1;
const ElectronAppAdapter_1 = ElectronAppAdapter$1;
const electronHttpExecutor_1 = electronHttpExecutor;
const GenericProvider_1 = GenericProvider$1;
const providerFactory_1 = providerFactory;
const zlib_1$1 = require$$14;
const GenericDifferentialDownloader_1 = GenericDifferentialDownloader$1;
const types_1$5 = types;
class AppUpdater extends events_1.EventEmitter {
  /**
   * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
   */
  get channel() {
    return this._channel;
  }
  /**
   * Set the update channel. Overrides `channel` in the update configuration.
   *
   * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
   */
  set channel(value) {
    if (this._channel != null) {
      if (typeof value !== "string") {
        throw (0, builder_util_runtime_1$4.newError)(`Channel must be a string, but got: ${value}`, "ERR_UPDATER_INVALID_CHANNEL");
      } else if (value.length === 0) {
        throw (0, builder_util_runtime_1$4.newError)(`Channel must be not an empty string`, "ERR_UPDATER_INVALID_CHANNEL");
      }
    }
    this._channel = value;
    this.allowDowngrade = true;
  }
  /**
   *  Shortcut for explicitly adding auth tokens to request headers
   */
  addAuthHeader(token) {
    this.requestHeaders = Object.assign({}, this.requestHeaders, {
      authorization: token
    });
  }
  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  get netSession() {
    return (0, electronHttpExecutor_1.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(value) {
    this._logger = value == null ? new NoOpLogger() : value;
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(value) {
    this.clientPromise = null;
    this._appUpdateConfigPath = value;
    this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
  }
  /**
   * Allows developer to override default logic for determining if an update is supported.
   * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
   */
  get isUpdateSupported() {
    return this._isUpdateSupported;
  }
  set isUpdateSupported(value) {
    if (value) {
      this._isUpdateSupported = value;
    }
  }
  /**
   * Allows developer to override default logic for determining if the user is below the rollout threshold.
   * The default logic compares the staging percentage with numerical representation of user ID.
   * An override can define custom logic, or bypass it if needed.
   */
  get isUserWithinRollout() {
    return this._isUserWithinRollout;
  }
  set isUserWithinRollout(value) {
    if (value) {
      this._isUserWithinRollout = value;
    }
  }
  constructor(options, app) {
    super();
    this.autoDownload = true;
    this.autoInstallOnAppQuit = true;
    this.autoRunAppAfterInstall = true;
    this.allowPrerelease = false;
    this.fullChangelog = false;
    this.allowDowngrade = false;
    this.disableWebInstaller = false;
    this.disableDifferentialDownload = false;
    this.forceDevUpdateConfig = false;
    this.previousBlockmapBaseUrlOverride = null;
    this._channel = null;
    this.downloadedUpdateHelper = null;
    this.requestHeaders = null;
    this._logger = console;
    this.signals = new types_1$5.UpdaterSignal(this);
    this._appUpdateConfigPath = null;
    this._isUpdateSupported = (updateInfo) => this.checkIfUpdateSupported(updateInfo);
    this._isUserWithinRollout = (updateInfo) => this.isStagingMatch(updateInfo);
    this.clientPromise = null;
    this.stagingUserIdPromise = new lazy_val_1.Lazy(() => this.getOrCreateStagingUserId());
    this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
    this.checkForUpdatesPromise = null;
    this.downloadPromise = null;
    this.updateInfoAndProvider = null;
    this._testOnlyOptions = null;
    this.on("error", (error2) => {
      this._logger.error(`Error: ${error2.stack || error2.message}`);
    });
    if (app == null) {
      this.app = new ElectronAppAdapter_1.ElectronAppAdapter();
      this.httpExecutor = new electronHttpExecutor_1.ElectronHttpExecutor((authInfo, callback) => this.emit("login", authInfo, callback));
    } else {
      this.app = app;
      this.httpExecutor = null;
    }
    const currentVersionString = this.app.version;
    const currentVersion = (0, semver_1.parse)(currentVersionString);
    if (currentVersion == null) {
      throw (0, builder_util_runtime_1$4.newError)(`App version is not a valid semver version: "${currentVersionString}"`, "ERR_UPDATER_INVALID_VERSION");
    }
    this.currentVersion = currentVersion;
    this.allowPrerelease = hasPrereleaseComponents(currentVersion);
    if (options != null) {
      this.setFeedURL(options);
      if (typeof options !== "string" && options.requestHeaders) {
        this.requestHeaders = options.requestHeaders;
      }
    }
  }
  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  getFeedURL() {
    return "Deprecated. Do not use it.";
  }
  /**
   * Configure update provider. If value is `string`, [GenericServerOptions](https://www.electron.build/publish#genericserveroptions) will be set with value as `url`.
   * @param options If you want to override configuration in the `app-update.yml`.
   */
  setFeedURL(options) {
    const runtimeOptions = this.createProviderRuntimeOptions();
    let provider;
    if (typeof options === "string") {
      provider = new GenericProvider_1.GenericProvider({ provider: "generic", url: options }, this, {
        ...runtimeOptions,
        isUseMultipleRangeRequest: (0, providerFactory_1.isUrlProbablySupportMultiRangeRequests)(options)
      });
    } else {
      provider = (0, providerFactory_1.createClient)(options, this, runtimeOptions);
    }
    this.clientPromise = Promise.resolve(provider);
  }
  /**
   * Asks the server whether there is an update.
   * @returns null if the updater is disabled, otherwise info about the latest version
   */
  checkForUpdates() {
    if (!this.isUpdaterActive()) {
      return Promise.resolve(null);
    }
    let checkForUpdatesPromise = this.checkForUpdatesPromise;
    if (checkForUpdatesPromise != null) {
      this._logger.info("Checking for update (already in progress)");
      return checkForUpdatesPromise;
    }
    const nullizePromise = () => this.checkForUpdatesPromise = null;
    this._logger.info("Checking for update");
    checkForUpdatesPromise = this.doCheckForUpdates().then((it) => {
      nullizePromise();
      return it;
    }).catch((e) => {
      nullizePromise();
      this.emit("error", e, `Cannot check for updates: ${(e.stack || e).toString()}`);
      throw e;
    });
    this.checkForUpdatesPromise = checkForUpdatesPromise;
    return checkForUpdatesPromise;
  }
  isUpdaterActive() {
    const isEnabled = this.app.isPackaged || this.forceDevUpdateConfig;
    if (!isEnabled) {
      this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced");
      return false;
    }
    return true;
  }
  // noinspection JSUnusedGlobalSymbols
  checkForUpdatesAndNotify(downloadNotification) {
    return this.checkForUpdates().then((it) => {
      if (!(it === null || it === void 0 ? void 0 : it.downloadPromise)) {
        if (this._logger.debug != null) {
          this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null");
        }
        return it;
      }
      void it.downloadPromise.then(() => {
        const notificationContent = AppUpdater.formatDownloadNotification(it.updateInfo.version, this.app.name, downloadNotification);
        new require$$1.Notification(notificationContent).show();
      });
      return it;
    });
  }
  static formatDownloadNotification(version, appName, downloadNotification) {
    if (downloadNotification == null) {
      downloadNotification = {
        title: "A new update is ready to install",
        body: `{appName} version {version} has been downloaded and will be automatically installed on exit`
      };
    }
    downloadNotification = {
      title: downloadNotification.title.replace("{appName}", appName).replace("{version}", version),
      body: downloadNotification.body.replace("{appName}", appName).replace("{version}", version)
    };
    return downloadNotification;
  }
  async isStagingMatch(updateInfo) {
    const rawStagingPercentage = updateInfo.stagingPercentage;
    let stagingPercentage = rawStagingPercentage;
    if (stagingPercentage == null) {
      return true;
    }
    stagingPercentage = parseInt(stagingPercentage, 10);
    if (isNaN(stagingPercentage)) {
      this._logger.warn(`Staging percentage is NaN: ${rawStagingPercentage}`);
      return true;
    }
    stagingPercentage = stagingPercentage / 100;
    const stagingUserId = await this.stagingUserIdPromise.value;
    const val = builder_util_runtime_1$4.UUID.parse(stagingUserId).readUInt32BE(12);
    const percentage = val / 4294967295;
    this._logger.info(`Staging percentage: ${stagingPercentage}, percentage: ${percentage}, user id: ${stagingUserId}`);
    return percentage < stagingPercentage;
  }
  computeFinalHeaders(headers) {
    if (this.requestHeaders != null) {
      Object.assign(headers, this.requestHeaders);
    }
    return headers;
  }
  async isUpdateAvailable(updateInfo) {
    const latestVersion = (0, semver_1.parse)(updateInfo.version);
    if (latestVersion == null) {
      throw (0, builder_util_runtime_1$4.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${updateInfo.version}"`, "ERR_UPDATER_INVALID_VERSION");
    }
    const currentVersion = this.currentVersion;
    if ((0, semver_1.eq)(latestVersion, currentVersion)) {
      return false;
    }
    if (!await Promise.resolve(this.isUpdateSupported(updateInfo))) {
      return false;
    }
    const isUserWithinRollout = await Promise.resolve(this.isUserWithinRollout(updateInfo));
    if (!isUserWithinRollout) {
      return false;
    }
    const isLatestVersionNewer = (0, semver_1.gt)(latestVersion, currentVersion);
    const isLatestVersionOlder = (0, semver_1.lt)(latestVersion, currentVersion);
    if (isLatestVersionNewer) {
      return true;
    }
    return this.allowDowngrade && isLatestVersionOlder;
  }
  checkIfUpdateSupported(updateInfo) {
    const minimumSystemVersion = updateInfo === null || updateInfo === void 0 ? void 0 : updateInfo.minimumSystemVersion;
    const currentOSVersion = (0, os_1.release)();
    if (minimumSystemVersion) {
      try {
        if ((0, semver_1.lt)(currentOSVersion, minimumSystemVersion)) {
          this._logger.info(`Current OS version ${currentOSVersion} is less than the minimum OS version required ${minimumSystemVersion} for version ${currentOSVersion}`);
          return false;
        }
      } catch (e) {
        this._logger.warn(`Failed to compare current OS version(${currentOSVersion}) with minimum OS version(${minimumSystemVersion}): ${(e.message || e).toString()}`);
      }
    }
    return true;
  }
  async getUpdateInfoAndProvider() {
    await this.app.whenReady();
    if (this.clientPromise == null) {
      this.clientPromise = this.configOnDisk.value.then((it) => (0, providerFactory_1.createClient)(it, this, this.createProviderRuntimeOptions()));
    }
    const client = await this.clientPromise;
    const stagingUserId = await this.stagingUserIdPromise.value;
    client.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": stagingUserId }));
    return {
      info: await client.getLatestVersion(),
      provider: client
    };
  }
  createProviderRuntimeOptions() {
    return {
      isUseMultipleRangeRequest: true,
      platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
      executor: this.httpExecutor
    };
  }
  async doCheckForUpdates() {
    this.emit("checking-for-update");
    const result = await this.getUpdateInfoAndProvider();
    const updateInfo = result.info;
    if (!await this.isUpdateAvailable(updateInfo)) {
      this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${updateInfo.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`);
      this.emit("update-not-available", updateInfo);
      return {
        isUpdateAvailable: false,
        versionInfo: updateInfo,
        updateInfo
      };
    }
    this.updateInfoAndProvider = result;
    this.onUpdateAvailable(updateInfo);
    const cancellationToken = new builder_util_runtime_1$4.CancellationToken();
    return {
      isUpdateAvailable: true,
      versionInfo: updateInfo,
      updateInfo,
      cancellationToken,
      downloadPromise: this.autoDownload ? this.downloadUpdate(cancellationToken) : null
    };
  }
  onUpdateAvailable(updateInfo) {
    this._logger.info(`Found version ${updateInfo.version} (url: ${(0, builder_util_runtime_1$4.asArray)(updateInfo.files).map((it) => it.url).join(", ")})`);
    this.emit("update-available", updateInfo);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(cancellationToken = new builder_util_runtime_1$4.CancellationToken()) {
    const updateInfoAndProvider = this.updateInfoAndProvider;
    if (updateInfoAndProvider == null) {
      const error2 = new Error("Please check update first");
      this.dispatchError(error2);
      return Promise.reject(error2);
    }
    if (this.downloadPromise != null) {
      this._logger.info("Downloading update (already in progress)");
      return this.downloadPromise;
    }
    this._logger.info(`Downloading update from ${(0, builder_util_runtime_1$4.asArray)(updateInfoAndProvider.info.files).map((it) => it.url).join(", ")}`);
    const errorHandler = (e) => {
      if (!(e instanceof builder_util_runtime_1$4.CancellationError)) {
        try {
          this.dispatchError(e);
        } catch (nestedError) {
          this._logger.warn(`Cannot dispatch error event: ${nestedError.stack || nestedError}`);
        }
      }
      return e;
    };
    this.downloadPromise = this.doDownloadUpdate({
      updateInfoAndProvider,
      requestHeaders: this.computeRequestHeaders(updateInfoAndProvider.provider),
      cancellationToken,
      disableWebInstaller: this.disableWebInstaller,
      disableDifferentialDownload: this.disableDifferentialDownload
    }).catch((e) => {
      throw errorHandler(e);
    }).finally(() => {
      this.downloadPromise = null;
    });
    return this.downloadPromise;
  }
  dispatchError(e) {
    this.emit("error", e, (e.stack || e).toString());
  }
  dispatchUpdateDownloaded(event) {
    this.emit(types_1$5.UPDATE_DOWNLOADED, event);
  }
  async loadUpdateConfig() {
    if (this._appUpdateConfigPath == null) {
      this._appUpdateConfigPath = this.app.appUpdateConfigPath;
    }
    return (0, js_yaml_1.load)(await (0, fs_extra_1$4.readFile)(this._appUpdateConfigPath, "utf-8"));
  }
  computeRequestHeaders(provider) {
    const fileExtraDownloadHeaders = provider.fileExtraDownloadHeaders;
    if (fileExtraDownloadHeaders != null) {
      const requestHeaders = this.requestHeaders;
      return requestHeaders == null ? fileExtraDownloadHeaders : {
        ...fileExtraDownloadHeaders,
        ...requestHeaders
      };
    }
    return this.computeFinalHeaders({ accept: "*/*" });
  }
  async getOrCreateStagingUserId() {
    const file2 = path$5.join(this.app.userDataPath, ".updaterId");
    try {
      const id2 = await (0, fs_extra_1$4.readFile)(file2, "utf-8");
      if (builder_util_runtime_1$4.UUID.check(id2)) {
        return id2;
      } else {
        this._logger.warn(`Staging user id file exists, but content was invalid: ${id2}`);
      }
    } catch (e) {
      if (e.code !== "ENOENT") {
        this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${e}`);
      }
    }
    const id = builder_util_runtime_1$4.UUID.v5((0, crypto_1$1.randomBytes)(4096), builder_util_runtime_1$4.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${id}`);
    try {
      await (0, fs_extra_1$4.outputFile)(file2, id);
    } catch (e) {
      this._logger.warn(`Couldn't write out staging user ID: ${e}`);
    }
    return id;
  }
  /** @internal */
  get isAddNoCacheQuery() {
    const headers = this.requestHeaders;
    if (headers == null) {
      return true;
    }
    for (const headerName of Object.keys(headers)) {
      const s = headerName.toLowerCase();
      if (s === "authorization" || s === "private-token") {
        return false;
      }
    }
    return true;
  }
  async getOrCreateDownloadHelper() {
    let result = this.downloadedUpdateHelper;
    if (result == null) {
      const dirName = (await this.configOnDisk.value).updaterCacheDirName;
      const logger = this._logger;
      if (dirName == null) {
        logger.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
      }
      const cacheDir = path$5.join(this.app.baseCachePath, dirName || this.app.name);
      if (logger.debug != null) {
        logger.debug(`updater cache dir: ${cacheDir}`);
      }
      result = new DownloadedUpdateHelper_1.DownloadedUpdateHelper(cacheDir);
      this.downloadedUpdateHelper = result;
    }
    return result;
  }
  async executeDownload(taskOptions) {
    const fileInfo = taskOptions.fileInfo;
    const downloadOptions = {
      headers: taskOptions.downloadUpdateOptions.requestHeaders,
      cancellationToken: taskOptions.downloadUpdateOptions.cancellationToken,
      sha2: fileInfo.info.sha2,
      sha512: fileInfo.info.sha512
    };
    if (this.listenerCount(types_1$5.DOWNLOAD_PROGRESS) > 0) {
      downloadOptions.onProgress = (it) => this.emit(types_1$5.DOWNLOAD_PROGRESS, it);
    }
    const updateInfo = taskOptions.downloadUpdateOptions.updateInfoAndProvider.info;
    const version = updateInfo.version;
    const packageInfo = fileInfo.packageInfo;
    function getCacheUpdateFileName() {
      const urlPath = decodeURIComponent(taskOptions.fileInfo.url.pathname);
      if (urlPath.toLowerCase().endsWith(`.${taskOptions.fileExtension.toLowerCase()}`)) {
        return path$5.basename(urlPath);
      } else {
        return path$5.basename(taskOptions.fileInfo.info.url);
      }
    }
    const downloadedUpdateHelper = await this.getOrCreateDownloadHelper();
    const cacheDir = downloadedUpdateHelper.cacheDirForPendingUpdate;
    await (0, fs_extra_1$4.mkdir)(cacheDir, { recursive: true });
    const updateFileName = getCacheUpdateFileName();
    let updateFile = path$5.join(cacheDir, updateFileName);
    const packageFile = packageInfo == null ? null : path$5.join(cacheDir, `package-${version}${path$5.extname(packageInfo.path) || ".7z"}`);
    const done = async (isSaveCache) => {
      await downloadedUpdateHelper.setDownloadedFile(updateFile, packageFile, updateInfo, fileInfo, updateFileName, isSaveCache);
      await taskOptions.done({
        ...updateInfo,
        downloadedFile: updateFile
      });
      const currentBlockMapFile = path$5.join(cacheDir, "current.blockmap");
      if (await (0, fs_extra_1$4.pathExists)(currentBlockMapFile)) {
        await (0, fs_extra_1$4.copyFile)(currentBlockMapFile, path$5.join(downloadedUpdateHelper.cacheDir, "current.blockmap"));
      }
      return packageFile == null ? [updateFile] : [updateFile, packageFile];
    };
    const log = this._logger;
    const cachedUpdateFile = await downloadedUpdateHelper.validateDownloadedPath(updateFile, updateInfo, fileInfo, log);
    if (cachedUpdateFile != null) {
      updateFile = cachedUpdateFile;
      return await done(false);
    }
    const removeFileIfAny = async () => {
      await downloadedUpdateHelper.clear().catch(() => {
      });
      return await (0, fs_extra_1$4.unlink)(updateFile).catch(() => {
      });
    };
    const tempUpdateFile = await (0, DownloadedUpdateHelper_1.createTempUpdateFile)(`temp-${updateFileName}`, cacheDir, log);
    try {
      await taskOptions.task(tempUpdateFile, downloadOptions, packageFile, removeFileIfAny);
      await (0, builder_util_runtime_1$4.retry)(() => (0, fs_extra_1$4.rename)(tempUpdateFile, updateFile), {
        retries: 60,
        interval: 500,
        shouldRetry: (error2) => {
          if (error2 instanceof Error && /^EBUSY:/.test(error2.message)) {
            return true;
          }
          log.warn(`Cannot rename temp file to final file: ${error2.message || error2.stack}`);
          return false;
        }
      });
    } catch (e) {
      await removeFileIfAny();
      if (e instanceof builder_util_runtime_1$4.CancellationError) {
        log.info("cancelled");
        this.emit("update-cancelled", updateInfo);
      }
      throw e;
    }
    log.info(`New version ${version} has been downloaded to ${updateFile}`);
    return await done(true);
  }
  async differentialDownloadInstaller(fileInfo, downloadUpdateOptions, installerPath, provider, oldInstallerFileName) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload) {
        return true;
      }
      const provider2 = downloadUpdateOptions.updateInfoAndProvider.provider;
      const blockmapFileUrls = await provider2.getBlockMapFiles(fileInfo.url, this.app.version, downloadUpdateOptions.updateInfoAndProvider.info.version, this.previousBlockmapBaseUrlOverride);
      this._logger.info(`Download block maps (old: "${blockmapFileUrls[0]}", new: ${blockmapFileUrls[1]})`);
      const downloadBlockMap = async (url) => {
        const data = await this.httpExecutor.downloadToBuffer(url, {
          headers: downloadUpdateOptions.requestHeaders,
          cancellationToken: downloadUpdateOptions.cancellationToken
        });
        if (data == null || data.length === 0) {
          throw new Error(`Blockmap "${url.href}" is empty`);
        }
        try {
          return JSON.parse((0, zlib_1$1.gunzipSync)(data).toString());
        } catch (e) {
          throw new Error(`Cannot parse blockmap "${url.href}", error: ${e}`);
        }
      };
      const downloadOptions = {
        newUrl: fileInfo.url,
        oldFile: path$5.join(this.downloadedUpdateHelper.cacheDir, oldInstallerFileName),
        logger: this._logger,
        newFile: installerPath,
        isUseMultipleRangeRequest: provider2.isUseMultipleRangeRequest,
        requestHeaders: downloadUpdateOptions.requestHeaders,
        cancellationToken: downloadUpdateOptions.cancellationToken
      };
      if (this.listenerCount(types_1$5.DOWNLOAD_PROGRESS) > 0) {
        downloadOptions.onProgress = (it) => this.emit(types_1$5.DOWNLOAD_PROGRESS, it);
      }
      const saveBlockMapToCacheDir = async (blockMapData, cacheDir) => {
        const blockMapFile = path$5.join(cacheDir, "current.blockmap");
        await (0, fs_extra_1$4.outputFile)(blockMapFile, (0, zlib_1$1.gzipSync)(JSON.stringify(blockMapData)));
      };
      const getBlockMapFromCacheDir = async (cacheDir) => {
        const blockMapFile = path$5.join(cacheDir, "current.blockmap");
        try {
          if (await (0, fs_extra_1$4.pathExists)(blockMapFile)) {
            return JSON.parse((0, zlib_1$1.gunzipSync)(await (0, fs_extra_1$4.readFile)(blockMapFile)).toString());
          }
        } catch (e) {
          this._logger.warn(`Cannot parse blockmap "${blockMapFile}", error: ${e}`);
        }
        return null;
      };
      const newBlockMapData = await downloadBlockMap(blockmapFileUrls[1]);
      await saveBlockMapToCacheDir(newBlockMapData, this.downloadedUpdateHelper.cacheDirForPendingUpdate);
      let oldBlockMapData = await getBlockMapFromCacheDir(this.downloadedUpdateHelper.cacheDir);
      if (oldBlockMapData == null) {
        oldBlockMapData = await downloadBlockMap(blockmapFileUrls[0]);
      }
      await new GenericDifferentialDownloader_1.GenericDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download(oldBlockMapData, newBlockMapData);
      return false;
    } catch (e) {
      this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
      if (this._testOnlyOptions != null) {
        throw e;
      }
      return true;
    }
  }
}
AppUpdater$1.AppUpdater = AppUpdater;
function hasPrereleaseComponents(version) {
  const versionPrereleaseComponent = (0, semver_1.prerelease)(version);
  return versionPrereleaseComponent != null && versionPrereleaseComponent.length > 0;
}
class NoOpLogger {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(message) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(message) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(message) {
  }
}
AppUpdater$1.NoOpLogger = NoOpLogger;
Object.defineProperty(BaseUpdater$1, "__esModule", { value: true });
BaseUpdater$1.BaseUpdater = void 0;
const child_process_1$3 = require$$1$3;
const path$4 = require$$1$1;
const AppUpdater_1$1 = AppUpdater$1;
class BaseUpdater extends AppUpdater_1$1.AppUpdater {
  constructor(options, app) {
    super(options, app);
    this.quitAndInstallCalled = false;
    this.quitHandlerAdded = false;
  }
  quitAndInstall(isSilent = false, isForceRunAfter = false) {
    this._logger.info(`Install on explicit quitAndInstall`);
    const isInstalled = this.install(isSilent, isSilent ? isForceRunAfter : this.autoRunAppAfterInstall);
    if (isInstalled) {
      setImmediate(() => {
        require$$1.autoUpdater.emit("before-quit-for-update");
        this.app.quit();
      });
    } else {
      this.quitAndInstallCalled = false;
    }
  }
  executeDownload(taskOptions) {
    return super.executeDownload({
      ...taskOptions,
      done: (event) => {
        this.dispatchUpdateDownloaded(event);
        this.addQuitHandler();
        return Promise.resolve();
      }
    });
  }
  get installerPath() {
    return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
  }
  // must be sync (because quit even handler is not async)
  install(isSilent = false, isForceRunAfter = false) {
    if (this.quitAndInstallCalled) {
      this._logger.warn("install call ignored: quitAndInstallCalled is set to true");
      return false;
    }
    const downloadedUpdateHelper = this.downloadedUpdateHelper;
    const installerPath = this.installerPath;
    const downloadedFileInfo = downloadedUpdateHelper == null ? null : downloadedUpdateHelper.downloadedFileInfo;
    if (installerPath == null || downloadedFileInfo == null) {
      this.dispatchError(new Error("No update filepath provided, can't quit and install"));
      return false;
    }
    this.quitAndInstallCalled = true;
    try {
      this._logger.info(`Install: isSilent: ${isSilent}, isForceRunAfter: ${isForceRunAfter}`);
      return this.doInstall({
        isSilent,
        isForceRunAfter,
        isAdminRightsRequired: downloadedFileInfo.isAdminRightsRequired
      });
    } catch (e) {
      this.dispatchError(e);
      return false;
    }
  }
  addQuitHandler() {
    if (this.quitHandlerAdded || !this.autoInstallOnAppQuit) {
      return;
    }
    this.quitHandlerAdded = true;
    this.app.onQuit((exitCode) => {
      if (this.quitAndInstallCalled) {
        this._logger.info("Update installer has already been triggered. Quitting application.");
        return;
      }
      if (!this.autoInstallOnAppQuit) {
        this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
        return;
      }
      if (exitCode !== 0) {
        this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${exitCode}`);
        return;
      }
      this._logger.info("Auto install update on quit");
      this.install(true, false);
    });
  }
  /**
   * Strips relative-path entries from a PATH string.
   * Prevents PATH-poisoning where a writable directory earlier in PATH shadows
   * a trusted package manager binary.
   */
  sanitizeEnvPath(envPath) {
    return envPath.split(path$4.delimiter).filter((dir) => path$4.isAbsolute(dir)).join(path$4.delimiter);
  }
  spawnSyncLog(cmd, args = [], env = {}) {
    var _a;
    this._logger.info(`Executing: ${cmd} with args: ${args}`);
    const mergedEnv = { ...process.env, ...env };
    const response = (0, child_process_1$3.spawnSync)(cmd, args, {
      env: { ...mergedEnv, PATH: this.sanitizeEnvPath((_a = mergedEnv.PATH) !== null && _a !== void 0 ? _a : "") },
      encoding: "utf-8",
      shell: true
    });
    const { error: error2, status, stdout, stderr } = response;
    if (error2 != null) {
      this._logger.error(stderr);
      throw error2;
    } else if (status != null && status !== 0) {
      this._logger.error(stderr);
      throw new Error(`Command ${cmd} exited with code ${status}`);
    }
    return stdout.trim();
  }
  /**
   * This handles both node 8 and node 10 way of emitting error when spawning a process
   *   - node 8: Throws the error
   *   - node 10: Emit the error(Need to listen with on)
   */
  // https://github.com/electron-userland/electron-builder/issues/1129
  // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
  async spawnLog(cmd, args = [], env = void 0, stdio = "ignore") {
    this._logger.info(`Executing: ${cmd} with args: ${args}`);
    return new Promise((resolve, reject) => {
      try {
        const params = { stdio, env, detached: true };
        const p = (0, child_process_1$3.spawn)(cmd, args, params);
        p.on("error", (error2) => {
          reject(error2);
        });
        p.unref();
        if (p.pid !== void 0) {
          resolve(true);
        }
      } catch (error2) {
        reject(error2);
      }
    });
  }
}
BaseUpdater$1.BaseUpdater = BaseUpdater;
var AppImageUpdater$1 = {};
var FileWithEmbeddedBlockMapDifferentialDownloader$1 = {};
Object.defineProperty(FileWithEmbeddedBlockMapDifferentialDownloader$1, "__esModule", { value: true });
FileWithEmbeddedBlockMapDifferentialDownloader$1.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const fs_extra_1$3 = lib;
const DifferentialDownloader_1 = DifferentialDownloader$1;
const zlib_1 = require$$14;
class FileWithEmbeddedBlockMapDifferentialDownloader extends DifferentialDownloader_1.DifferentialDownloader {
  async download() {
    const packageInfo = this.blockAwareFileInfo;
    const fileSize = packageInfo.size;
    const offset = fileSize - (packageInfo.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(offset, fileSize - 1);
    const newBlockMap = readBlockMap(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await readEmbeddedBlockMapData(this.options.oldFile), newBlockMap);
  }
}
FileWithEmbeddedBlockMapDifferentialDownloader$1.FileWithEmbeddedBlockMapDifferentialDownloader = FileWithEmbeddedBlockMapDifferentialDownloader;
function readBlockMap(data) {
  return JSON.parse((0, zlib_1.inflateRawSync)(data).toString());
}
async function readEmbeddedBlockMapData(file2) {
  const fd = await (0, fs_extra_1$3.open)(file2, "r");
  try {
    const fileSize = (await (0, fs_extra_1$3.fstat)(fd)).size;
    const sizeBuffer = Buffer.allocUnsafe(4);
    await (0, fs_extra_1$3.read)(fd, sizeBuffer, 0, sizeBuffer.length, fileSize - sizeBuffer.length);
    const dataBuffer = Buffer.allocUnsafe(sizeBuffer.readUInt32BE(0));
    await (0, fs_extra_1$3.read)(fd, dataBuffer, 0, dataBuffer.length, fileSize - sizeBuffer.length - dataBuffer.length);
    await (0, fs_extra_1$3.close)(fd);
    return readBlockMap(dataBuffer);
  } catch (e) {
    await (0, fs_extra_1$3.close)(fd);
    throw e;
  }
}
Object.defineProperty(AppImageUpdater$1, "__esModule", { value: true });
AppImageUpdater$1.AppImageUpdater = void 0;
const builder_util_runtime_1$3 = out;
const child_process_1$2 = require$$1$3;
const fs_extra_1$2 = lib;
const fs_1$1 = fs$j;
const path$3 = require$$1$1;
const BaseUpdater_1$2 = BaseUpdater$1;
const FileWithEmbeddedBlockMapDifferentialDownloader_1$1 = FileWithEmbeddedBlockMapDifferentialDownloader$1;
const Provider_1$5 = Provider$1;
const types_1$4 = types;
class AppImageUpdater extends BaseUpdater_1$2.BaseUpdater {
  constructor(options, app) {
    super(options, app);
  }
  isUpdaterActive() {
    if (process.env["APPIMAGE"] == null && !this.forceDevUpdateConfig) {
      if (process.env["SNAP"] == null) {
        this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage");
      } else {
        this._logger.info("SNAP env is defined, updater is disabled");
      }
      return false;
    }
    return super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1$5.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo,
      downloadUpdateOptions,
      task: async (updateFile, downloadOptions) => {
        const oldFile = process.env["APPIMAGE"];
        if (oldFile == null) {
          throw (0, builder_util_runtime_1$3.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        }
        if (downloadUpdateOptions.disableDifferentialDownload || await this.downloadDifferential(fileInfo, oldFile, updateFile, provider, downloadUpdateOptions)) {
          await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
        }
        await (0, fs_extra_1$2.chmod)(updateFile, 493);
      }
    });
  }
  async downloadDifferential(fileInfo, oldFile, updateFile, provider, downloadUpdateOptions) {
    try {
      const downloadOptions = {
        newUrl: fileInfo.url,
        oldFile,
        logger: this._logger,
        newFile: updateFile,
        isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
        requestHeaders: downloadUpdateOptions.requestHeaders,
        cancellationToken: downloadUpdateOptions.cancellationToken
      };
      if (this.listenerCount(types_1$4.DOWNLOAD_PROGRESS) > 0) {
        downloadOptions.onProgress = (it) => this.emit(types_1$4.DOWNLOAD_PROGRESS, it);
      }
      await new FileWithEmbeddedBlockMapDifferentialDownloader_1$1.FileWithEmbeddedBlockMapDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download();
      return false;
    } catch (e) {
      this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
      return process.platform === "linux";
    }
  }
  doInstall(options) {
    const appImageFile = process.env["APPIMAGE"];
    if (appImageFile == null) {
      throw (0, builder_util_runtime_1$3.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    }
    if (!path$3.isAbsolute(appImageFile) || appImageFile.includes("\0")) {
      throw (0, builder_util_runtime_1$3.newError)(`APPIMAGE env is not a valid absolute path: "${appImageFile}"`, "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    }
    (0, fs_1$1.unlinkSync)(appImageFile);
    let destination;
    const existingBaseName = path$3.basename(appImageFile);
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No update filepath provided, can't quit and install"));
      return false;
    }
    if (path$3.basename(installerPath) === existingBaseName || !/\d+\.\d+\.\d+/.test(existingBaseName)) {
      destination = appImageFile;
    } else {
      destination = path$3.join(path$3.dirname(appImageFile), path$3.basename(installerPath));
    }
    (0, child_process_1$2.execFileSync)("mv", ["-f", installerPath, destination]);
    if (destination !== appImageFile) {
      this.emit("appimage-filename-updated", destination);
    }
    const env = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    if (options.isForceRunAfter) {
      this.spawnLog(destination, [], env);
    } else {
      env.APPIMAGE_EXIT_AFTER_INSTALL = "true";
      (0, child_process_1$2.execFileSync)(destination, [], { env });
    }
    return true;
  }
}
AppImageUpdater$1.AppImageUpdater = AppImageUpdater;
var DebUpdater$1 = {};
var LinuxUpdater$1 = {};
Object.defineProperty(LinuxUpdater$1, "__esModule", { value: true });
LinuxUpdater$1.LinuxUpdater = void 0;
const BaseUpdater_1$1 = BaseUpdater$1;
const SAFE_PM_REGEX = /^[a-zA-Z0-9_-]+$/;
class LinuxUpdater extends BaseUpdater_1$1.BaseUpdater {
  constructor(options, app) {
    super(options, app);
  }
  /**
   * Returns true if the current process is running as root.
   */
  isRunningAsRoot() {
    var _a;
    return ((_a = process.getuid) === null || _a === void 0 ? void 0 : _a.call(process)) === 0;
  }
  /**
   * Sanitizes the installer path for use with shell:true spawn calls.
   * Backslash-escapes metacharacters that have special meaning in POSIX shell.
   * Note: paths containing single-quotes (') are not supported.
   */
  get installerPath() {
    const raw = super.installerPath;
    if (raw == null) {
      return null;
    }
    return raw.replace(/\\/g, "\\\\").replace(/([`$!" ;|&()<>])/g, "\\$1").replace(/[\n\r]/g, "");
  }
  runCommandWithSudoIfNeeded(commandWithArgs) {
    if (this.isRunningAsRoot()) {
      this._logger.info("Running as root, no need to use sudo");
      return this.spawnSyncLog(commandWithArgs[0], commandWithArgs.slice(1));
    }
    const { name } = this.app;
    const safeName = name.replace(/["`$\\!\n\r;|&<>(){}*?[\]#~]/g, "");
    const installComment = `"${safeName} would like to update"`;
    const sudo = this.sudoWithArgs(installComment);
    this._logger.info(`Running as non-root user, using sudo to install: ${sudo}`);
    let wrapper = `"`;
    if (/pkexec/i.test(sudo[0]) || sudo[0] === "sudo") {
      wrapper = "";
    }
    return this.spawnSyncLog(sudo[0], [...sudo.length > 1 ? sudo.slice(1) : [], `${wrapper}/bin/bash`, "-c", `'${commandWithArgs.join(" ")}'${wrapper}`]);
  }
  sudoWithArgs(installComment) {
    const sudo = this.determineSudoCommand();
    const command = [sudo];
    if (/kdesudo/i.test(sudo)) {
      command.push("--comment", installComment);
      command.push("-c");
    } else if (/gksudo/i.test(sudo)) {
      command.push("--message", installComment);
    } else if (/pkexec/i.test(sudo)) {
      command.push("--disable-internal-agent");
    }
    return command;
  }
  hasCommand(cmd) {
    try {
      this.spawnSyncLog(`command`, ["-v", cmd]);
      return true;
    } catch {
      return false;
    }
  }
  determineSudoCommand() {
    const sudos = ["gksudo", "kdesudo", "pkexec", "beesu"];
    for (const sudo of sudos) {
      if (this.hasCommand(sudo)) {
        return sudo;
      }
    }
    return "sudo";
  }
  /**
   * Detects the package manager to use based on the available commands.
   * Allows overriding the default behavior by setting the ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER environment variable.
   * If the environment variable is set, it will be used directly. (This is useful for testing each package manager logic path.)
   * Otherwise, it checks for the presence of the specified package manager commands in the order provided.
   * @param pms - An array of package manager commands to check for, in priority order.
   * @returns The detected package manager command or "unknown" if none are found.
   */
  detectPackageManager(pms) {
    var _a;
    let availablePMs = pms;
    const pmOverride = (_a = process.env.ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER) === null || _a === void 0 ? void 0 : _a.trim();
    if (pmOverride) {
      if (!SAFE_PM_REGEX.test(pmOverride)) {
        this._logger.warn(`ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER "${pmOverride}" contains unsafe characters. Ignoring override.`);
      } else {
        availablePMs = [pmOverride];
      }
    }
    for (const pm of availablePMs) {
      if (this.hasCommand(pm)) {
        return pm;
      }
    }
    const searchList = pmOverride ? `ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER override "${pmOverride}", ` : "";
    const defaultPM = pms[0];
    this._logger.warn(`No package manager found in the list: ${searchList}${pms.join(", ")}. Utilizing default: ${defaultPM}`);
    return defaultPM;
  }
}
LinuxUpdater$1.LinuxUpdater = LinuxUpdater;
Object.defineProperty(DebUpdater$1, "__esModule", { value: true });
DebUpdater$1.DebUpdater = void 0;
const Provider_1$4 = Provider$1;
const types_1$3 = types;
const LinuxUpdater_1$2 = LinuxUpdater$1;
class DebUpdater extends LinuxUpdater_1$2.LinuxUpdater {
  constructor(options, app) {
    super(options, app);
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1$4.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo,
      downloadUpdateOptions,
      task: async (updateFile, downloadOptions) => {
        if (this.listenerCount(types_1$3.DOWNLOAD_PROGRESS) > 0) {
          downloadOptions.onProgress = (it) => this.emit(types_1$3.DOWNLOAD_PROGRESS, it);
        }
        await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
      }
    });
  }
  doInstall(options) {
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No update filepath provided, can't quit and install"));
      return false;
    }
    if (!this.hasCommand("dpkg") && !this.hasCommand("apt")) {
      this.dispatchError(new Error("Neither dpkg nor apt command found. Cannot install .deb package."));
      return false;
    }
    const priorityList = ["dpkg", "apt"];
    const packageManager = this.detectPackageManager(priorityList);
    try {
      DebUpdater.installWithCommandRunner(packageManager, installerPath, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (error2) {
      this.dispatchError(error2);
      return false;
    }
    if (options.isForceRunAfter) {
      this.app.relaunch();
    }
    return true;
  }
  static installWithCommandRunner(packageManager, installerPath, commandRunner, logger) {
    var _a;
    if (packageManager === "dpkg") {
      try {
        commandRunner(["dpkg", "-i", installerPath]);
      } catch (error2) {
        logger.warn((_a = error2.message) !== null && _a !== void 0 ? _a : error2);
        logger.warn("dpkg installation failed, trying to fix broken dependencies with apt-get");
        commandRunner(["apt-get", "install", "-f", "-y"]);
      }
    } else if (packageManager === "apt") {
      logger.warn("Using apt to install a local .deb. This may fail for unsigned packages unless properly configured.");
      commandRunner([
        "apt",
        "install",
        "-y",
        "--allow-unauthenticated",
        // needed for unsigned .debs
        "--allow-downgrades",
        // allow lower version installs
        "--allow-change-held-packages",
        installerPath
      ]);
    } else {
      throw new Error(`Package manager ${packageManager} not supported`);
    }
  }
}
DebUpdater$1.DebUpdater = DebUpdater;
var PacmanUpdater$1 = {};
Object.defineProperty(PacmanUpdater$1, "__esModule", { value: true });
PacmanUpdater$1.PacmanUpdater = void 0;
const types_1$2 = types;
const Provider_1$3 = Provider$1;
const LinuxUpdater_1$1 = LinuxUpdater$1;
class PacmanUpdater extends LinuxUpdater_1$1.LinuxUpdater {
  constructor(options, app) {
    super(options, app);
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1$3.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo,
      downloadUpdateOptions,
      task: async (updateFile, downloadOptions) => {
        if (this.listenerCount(types_1$2.DOWNLOAD_PROGRESS) > 0) {
          downloadOptions.onProgress = (it) => this.emit(types_1$2.DOWNLOAD_PROGRESS, it);
        }
        await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
      }
    });
  }
  doInstall(options) {
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No update filepath provided, can't quit and install"));
      return false;
    }
    try {
      PacmanUpdater.installWithCommandRunner(installerPath, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (error2) {
      this.dispatchError(error2);
      return false;
    }
    if (options.isForceRunAfter) {
      this.app.relaunch();
    }
    return true;
  }
  static installWithCommandRunner(installerPath, commandRunner, logger) {
    var _a;
    try {
      commandRunner(["pacman", "-U", "--noconfirm", installerPath]);
    } catch (error2) {
      logger.warn((_a = error2.message) !== null && _a !== void 0 ? _a : error2);
      logger.warn("pacman installation failed, attempting to update package database and retry");
      try {
        commandRunner(["pacman", "-Sy", "--noconfirm"]);
        commandRunner(["pacman", "-U", "--noconfirm", installerPath]);
      } catch (retryError) {
        logger.error("Retry after pacman -Sy failed");
        throw retryError;
      }
    }
  }
}
PacmanUpdater$1.PacmanUpdater = PacmanUpdater;
var RpmUpdater$1 = {};
Object.defineProperty(RpmUpdater$1, "__esModule", { value: true });
RpmUpdater$1.RpmUpdater = void 0;
const types_1$1 = types;
const Provider_1$2 = Provider$1;
const LinuxUpdater_1 = LinuxUpdater$1;
class RpmUpdater extends LinuxUpdater_1.LinuxUpdater {
  constructor(options, app) {
    super(options, app);
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1$2.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo,
      downloadUpdateOptions,
      task: async (updateFile, downloadOptions) => {
        if (this.listenerCount(types_1$1.DOWNLOAD_PROGRESS) > 0) {
          downloadOptions.onProgress = (it) => this.emit(types_1$1.DOWNLOAD_PROGRESS, it);
        }
        await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
      }
    });
  }
  doInstall(options) {
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No update filepath provided, can't quit and install"));
      return false;
    }
    const priorityList = ["zypper", "dnf", "yum", "rpm"];
    const packageManager = this.detectPackageManager(priorityList);
    try {
      RpmUpdater.installWithCommandRunner(packageManager, installerPath, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (error2) {
      this.dispatchError(error2);
      return false;
    }
    if (options.isForceRunAfter) {
      this.app.relaunch();
    }
    return true;
  }
  static installWithCommandRunner(packageManager, installerPath, commandRunner, logger) {
    if (packageManager === "zypper") {
      return commandRunner(["zypper", "--non-interactive", "--no-refresh", "install", "--allow-unsigned-rpm", "-f", installerPath]);
    }
    if (packageManager === "dnf") {
      return commandRunner(["dnf", "install", "--nogpgcheck", "-y", installerPath]);
    }
    if (packageManager === "yum") {
      return commandRunner(["yum", "install", "--nogpgcheck", "-y", installerPath]);
    }
    if (packageManager === "rpm") {
      logger.warn("Installing with rpm only (no dependency resolution).");
      return commandRunner(["rpm", "-Uvh", "--replacepkgs", "--replacefiles", "--nodeps", installerPath]);
    }
    throw new Error(`Package manager ${packageManager} not supported`);
  }
}
RpmUpdater$1.RpmUpdater = RpmUpdater;
var MacUpdater$1 = {};
Object.defineProperty(MacUpdater$1, "__esModule", { value: true });
MacUpdater$1.MacUpdater = void 0;
const builder_util_runtime_1$2 = out;
const fs_extra_1$1 = lib;
const fs_1 = fs$j;
const path$2 = require$$1$1;
const http_1 = require$$4$1;
const AppUpdater_1 = AppUpdater$1;
const Provider_1$1 = Provider$1;
const child_process_1$1 = require$$1$3;
const crypto_1 = require$$0;
class MacUpdater extends AppUpdater_1.AppUpdater {
  constructor(options, app) {
    super(options, app);
    this.nativeUpdater = require$$1.autoUpdater;
    this.squirrelDownloadedUpdate = false;
    this.nativeUpdater.on("error", (it) => {
      this._logger.warn(it);
      this.emit("error", it);
    });
    this.nativeUpdater.on("update-downloaded", () => {
      this.squirrelDownloadedUpdate = true;
      this.debug("nativeUpdater.update-downloaded");
    });
  }
  /** Filters update files to the appropriate architecture.
   * On arm64 Macs (including Rosetta), arm64 files are preferred when available.
   * On x64 Macs, arm64 files are excluded. */
  static filterFilesForArch(files, isArm64Mac) {
    const isArm64File = (file2) => {
      var _a;
      return file2.url.pathname.includes("arm64") || ((_a = file2.info.url) === null || _a === void 0 ? void 0 : _a.includes("arm64"));
    };
    if (isArm64Mac && files.some(isArm64File)) {
      return files.filter((file2) => isArm64Mac === isArm64File(file2));
    }
    return files.filter((file2) => !isArm64File(file2));
  }
  debug(message) {
    if (this._logger.debug != null) {
      this._logger.debug(message);
    }
  }
  closeServerIfExists() {
    if (this.server) {
      this.debug("Closing proxy server");
      this.server.close((err) => {
        if (err) {
          this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
        }
      });
    }
  }
  async doDownloadUpdate(downloadUpdateOptions) {
    let files = downloadUpdateOptions.updateInfoAndProvider.provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info);
    const log = this._logger;
    const sysctlRosettaInfoKey = "sysctl.proc_translated";
    let isRosetta = false;
    try {
      this.debug("Checking for macOS Rosetta environment");
      const result = (0, child_process_1$1.execFileSync)("sysctl", [sysctlRosettaInfoKey], { encoding: "utf8" });
      isRosetta = result.includes(`${sysctlRosettaInfoKey}: 1`);
      log.info(`Checked for macOS Rosetta environment (isRosetta=${isRosetta})`);
    } catch (e) {
      log.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${e}`);
    }
    let isArm64Mac = false;
    try {
      this.debug("Checking for arm64 in uname");
      const result = (0, child_process_1$1.execFileSync)("uname", ["-a"], { encoding: "utf8" });
      const isArm = result.includes("ARM");
      log.info(`Checked 'uname -a': arm64=${isArm}`);
      isArm64Mac = isArm64Mac || isArm;
    } catch (e) {
      log.warn(`uname shell command to check for arm64 failed: ${e}`);
    }
    isArm64Mac = isArm64Mac || process.arch === "arm64" || isRosetta;
    files = MacUpdater.filterFilesForArch(files, isArm64Mac);
    const zipFileInfo = (0, Provider_1$1.findFile)(files, "zip", ["pkg", "dmg"]);
    if (zipFileInfo == null) {
      throw (0, builder_util_runtime_1$2.newError)(`ZIP file not provided: ${(0, builder_util_runtime_1$2.safeStringifyJson)(files)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    }
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const CURRENT_MAC_APP_ZIP_FILE_NAME = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: zipFileInfo,
      downloadUpdateOptions,
      task: async (destinationFile, downloadOptions) => {
        const cachedUpdateFilePath = path$2.join(this.downloadedUpdateHelper.cacheDir, CURRENT_MAC_APP_ZIP_FILE_NAME);
        const canDifferentialDownload = () => {
          if (!(0, fs_extra_1$1.pathExistsSync)(cachedUpdateFilePath)) {
            log.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download");
            return false;
          }
          return !downloadUpdateOptions.disableDifferentialDownload;
        };
        let differentialDownloadFailed = true;
        if (canDifferentialDownload()) {
          differentialDownloadFailed = await this.differentialDownloadInstaller(zipFileInfo, downloadUpdateOptions, destinationFile, provider, CURRENT_MAC_APP_ZIP_FILE_NAME);
        }
        if (differentialDownloadFailed) {
          await this.httpExecutor.download(zipFileInfo.url, destinationFile, downloadOptions);
        }
      },
      done: async (event) => {
        if (!downloadUpdateOptions.disableDifferentialDownload) {
          try {
            const cachedUpdateFilePath = path$2.join(this.downloadedUpdateHelper.cacheDir, CURRENT_MAC_APP_ZIP_FILE_NAME);
            await (0, fs_extra_1$1.copyFile)(event.downloadedFile, cachedUpdateFilePath);
          } catch (error2) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${error2.message}`);
          }
        }
        return this.updateDownloaded(zipFileInfo, event);
      }
    });
  }
  async updateDownloaded(zipFileInfo, event) {
    var _a;
    const downloadedFile = event.downloadedFile;
    const updateFileSize = (_a = zipFileInfo.info.size) !== null && _a !== void 0 ? _a : (await (0, fs_extra_1$1.stat)(downloadedFile)).size;
    const log = this._logger;
    const logContext = `fileToProxy=${zipFileInfo.url.href}`;
    this.closeServerIfExists();
    this.debug(`Creating proxy server for native Squirrel.Mac (${logContext})`);
    this.server = (0, http_1.createServer)();
    this.debug(`Proxy server for native Squirrel.Mac is created (${logContext})`);
    this.server.on("close", () => {
      log.info(`Proxy server for native Squirrel.Mac is closed (${logContext})`);
    });
    const getServerUrl = (s) => {
      const address = s.address();
      if (typeof address === "string") {
        return address;
      }
      return `http://127.0.0.1:${address === null || address === void 0 ? void 0 : address.port}`;
    };
    return await new Promise((resolve, reject) => {
      const pass = (0, crypto_1.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
      const authInfo = Buffer.from(`autoupdater:${pass}`, "ascii");
      const fileUrl = `/${(0, crypto_1.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", (request, response) => {
        const requestUrl = request.url;
        log.info(`${requestUrl} requested`);
        if (requestUrl === "/") {
          if (!request.headers.authorization || request.headers.authorization.indexOf("Basic ") === -1) {
            response.statusCode = 401;
            response.statusMessage = "Invalid Authentication Credentials";
            response.end();
            log.warn("No authenthication info");
            return;
          }
          const base64Credentials = request.headers.authorization.split(" ")[1];
          const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
          const [username, password] = credentials.split(":");
          if (username !== "autoupdater" || password !== pass) {
            response.statusCode = 401;
            response.statusMessage = "Invalid Authentication Credentials";
            response.end();
            log.warn("Invalid authenthication credentials");
            return;
          }
          const data = Buffer.from(`{ "url": "${getServerUrl(this.server)}${fileUrl}" }`);
          response.writeHead(200, { "Content-Type": "application/json", "Content-Length": data.length });
          response.end(data);
          return;
        }
        if (!requestUrl.startsWith(fileUrl)) {
          log.warn(`${requestUrl} requested, but not supported`);
          response.writeHead(404);
          response.end();
          return;
        }
        log.info(`${fileUrl} requested by Squirrel.Mac, pipe ${downloadedFile}`);
        let errorOccurred = false;
        response.on("finish", () => {
          if (!errorOccurred) {
            this.nativeUpdater.removeListener("error", reject);
            resolve([]);
          }
        });
        const readStream = (0, fs_1.createReadStream)(downloadedFile);
        readStream.on("error", (error2) => {
          try {
            response.end();
          } catch (e) {
            log.warn(`cannot end response: ${e}`);
          }
          errorOccurred = true;
          this.nativeUpdater.removeListener("error", reject);
          reject(new Error(`Cannot pipe "${downloadedFile}": ${error2}`));
        });
        response.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": updateFileSize
        });
        readStream.pipe(response);
      });
      this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${logContext})`);
      this.server.listen(0, "127.0.0.1", () => {
        this.debug(`Proxy server for native Squirrel.Mac is listening (address=${getServerUrl(this.server)}, ${logContext})`);
        this.nativeUpdater.setFeedURL({
          url: getServerUrl(this.server),
          headers: {
            "Cache-Control": "no-cache",
            Authorization: `Basic ${authInfo.toString("base64")}`
          }
        });
        this.dispatchUpdateDownloaded(event);
        if (this.autoInstallOnAppQuit) {
          this.nativeUpdater.once("error", reject);
          this.nativeUpdater.checkForUpdates();
        } else {
          resolve([]);
        }
      });
    });
  }
  handleUpdateDownloaded() {
    if (this.autoRunAppAfterInstall) {
      this.nativeUpdater.quitAndInstall();
    } else {
      this.app.quit();
    }
    this.closeServerIfExists();
  }
  quitAndInstall() {
    if (this.squirrelDownloadedUpdate) {
      this.handleUpdateDownloaded();
    } else {
      this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded());
      if (!this.autoInstallOnAppQuit) {
        this.nativeUpdater.checkForUpdates();
      }
    }
  }
}
MacUpdater$1.MacUpdater = MacUpdater;
var NsisUpdater$1 = {};
var windowsExecutableCodeSignatureVerifier = {};
Object.defineProperty(windowsExecutableCodeSignatureVerifier, "__esModule", { value: true });
windowsExecutableCodeSignatureVerifier.verifySignature = verifySignature;
const builder_util_runtime_1$1 = out;
const child_process_1 = require$$1$3;
const os = require$$2;
const path$1 = require$$1$1;
function preparePowerShellExec(command, timeout) {
  const executable = `set "PSModulePath=" & chcp 65001 >NUL & powershell.exe`;
  const args = ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", command];
  const options = {
    shell: true,
    timeout
  };
  return [executable, args, options];
}
function verifySignature(publisherNames, unescapedTempUpdateFile, logger) {
  return new Promise((resolve, reject) => {
    const tempUpdateFile = unescapedTempUpdateFile.replace(/'/g, "''");
    logger.info(`Verifying signature ${tempUpdateFile}`);
    (0, child_process_1.execFile)(...preparePowerShellExec(`"Get-AuthenticodeSignature -LiteralPath '${tempUpdateFile}' | ConvertTo-Json -Compress"`, 20 * 1e3), (error2, stdout, stderr) => {
      var _a;
      try {
        if (error2 != null || stderr) {
          handleError(logger, error2, stderr, reject);
          resolve(null);
          return;
        }
        const data = parseOut(stdout);
        if (data.Status === 0) {
          try {
            const normlaizedUpdateFilePath = path$1.normalize(data.Path);
            const normalizedTempUpdateFile = path$1.normalize(unescapedTempUpdateFile);
            logger.info(`LiteralPath: ${normlaizedUpdateFilePath}. Update Path: ${normalizedTempUpdateFile}`);
            if (normlaizedUpdateFilePath !== normalizedTempUpdateFile) {
              handleError(logger, new Error(`LiteralPath of ${normlaizedUpdateFilePath} is different than ${normalizedTempUpdateFile}`), stderr, reject);
              resolve(null);
              return;
            }
          } catch (error3) {
            logger.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(_a = error3.message) !== null && _a !== void 0 ? _a : error3.stack}`);
          }
          const subject = (0, builder_util_runtime_1$1.parseDn)(data.SignerCertificate.Subject);
          let match = false;
          for (const name of publisherNames) {
            const dn = (0, builder_util_runtime_1$1.parseDn)(name);
            if (dn.size) {
              const allKeys = Array.from(dn.keys());
              match = allKeys.every((key) => {
                return dn.get(key) === subject.get(key);
              });
            } else if (name === subject.get("CN")) {
              logger.warn(`Signature validated using only CN ${name}. Please add your full Distinguished Name (DN) to publisherNames configuration`);
              match = true;
            }
            if (match) {
              resolve(null);
              return;
            }
          }
        }
        const result = `publisherNames: ${publisherNames.join(" | ")}, raw info: ` + JSON.stringify(data, (name, value) => name === "RawData" ? void 0 : value, 2);
        logger.warn(`Sign verification failed, installer signed with incorrect certificate: ${result}`);
        resolve(result);
      } catch (e) {
        handleError(logger, e, null, reject);
        resolve(null);
        return;
      }
    });
  });
}
function parseOut(out2) {
  const data = JSON.parse(out2);
  delete data.PrivateKey;
  delete data.IsOSBinary;
  delete data.SignatureType;
  const signerCertificate = data.SignerCertificate;
  if (signerCertificate != null) {
    delete signerCertificate.Archived;
    delete signerCertificate.Extensions;
    delete signerCertificate.Handle;
    delete signerCertificate.HasPrivateKey;
    delete signerCertificate.SubjectName;
  }
  return data;
}
function handleError(logger, error2, stderr, reject) {
  if (isOldWin6()) {
    logger.warn(`Cannot execute Get-AuthenticodeSignature: ${error2 || stderr}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, child_process_1.execFileSync)(...preparePowerShellExec("ConvertTo-Json test", 10 * 1e3));
  } catch (testError) {
    logger.warn(`Cannot execute ConvertTo-Json: ${testError.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  if (error2 != null) {
    reject(error2);
  }
  if (stderr) {
    reject(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${stderr}. Failing signature validation due to unknown stderr.`));
  }
}
function isOldWin6() {
  const winVersion = os.release();
  return winVersion.startsWith("6.") && !winVersion.startsWith("6.3");
}
Object.defineProperty(NsisUpdater$1, "__esModule", { value: true });
NsisUpdater$1.NsisUpdater = void 0;
const builder_util_runtime_1 = out;
const path = require$$1$1;
const BaseUpdater_1 = BaseUpdater$1;
const FileWithEmbeddedBlockMapDifferentialDownloader_1 = FileWithEmbeddedBlockMapDifferentialDownloader$1;
const types_1 = types;
const Provider_1 = Provider$1;
const fs_extra_1 = lib;
const windowsExecutableCodeSignatureVerifier_1 = windowsExecutableCodeSignatureVerifier;
const url_1 = require$$2$1;
class NsisUpdater extends BaseUpdater_1.BaseUpdater {
  constructor(options, app) {
    super(options, app);
    this._verifyUpdateCodeSignature = (publisherNames, unescapedTempUpdateFile) => (0, windowsExecutableCodeSignatureVerifier_1.verifySignature)(publisherNames, unescapedTempUpdateFile, this._logger);
  }
  /**
   * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
   * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
   */
  get verifyUpdateCodeSignature() {
    return this._verifyUpdateCodeSignature;
  }
  set verifyUpdateCodeSignature(value) {
    if (value) {
      this._verifyUpdateCodeSignature = value;
    }
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions,
      fileInfo,
      task: async (destinationFile, downloadOptions, packageFile, removeTempDirIfAny) => {
        const packageInfo = fileInfo.packageInfo;
        const isWebInstaller = packageInfo != null && packageFile != null;
        if (isWebInstaller && downloadUpdateOptions.disableWebInstaller) {
          throw (0, builder_util_runtime_1.newError)(`Unable to download new version ${downloadUpdateOptions.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        }
        if (!isWebInstaller && !downloadUpdateOptions.disableWebInstaller) {
          this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version.");
        }
        if (isWebInstaller || downloadUpdateOptions.disableDifferentialDownload || await this.differentialDownloadInstaller(fileInfo, downloadUpdateOptions, destinationFile, provider, builder_util_runtime_1.CURRENT_APP_INSTALLER_FILE_NAME)) {
          await this.httpExecutor.download(fileInfo.url, destinationFile, downloadOptions);
        }
        const signatureVerificationStatus = await this.verifySignature(destinationFile);
        if (signatureVerificationStatus != null) {
          await removeTempDirIfAny();
          throw (0, builder_util_runtime_1.newError)(`New version ${downloadUpdateOptions.updateInfoAndProvider.info.version} is not signed by the application owner: ${signatureVerificationStatus}`, "ERR_UPDATER_INVALID_SIGNATURE");
        }
        if (isWebInstaller) {
          if (await this.differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packageFile, provider)) {
            try {
              await this.httpExecutor.download(new url_1.URL(packageInfo.path), packageFile, {
                headers: downloadUpdateOptions.requestHeaders,
                cancellationToken: downloadUpdateOptions.cancellationToken,
                sha512: packageInfo.sha512
              });
            } catch (e) {
              try {
                await (0, fs_extra_1.unlink)(packageFile);
              } catch (_ignored) {
              }
              throw e;
            }
          }
        }
      }
    });
  }
  // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
  // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
  // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
  async verifySignature(tempUpdateFile) {
    let publisherName;
    try {
      publisherName = (await this.configOnDisk.value).publisherName;
      if (publisherName == null) {
        return null;
      }
    } catch (e) {
      if (e.code === "ENOENT") {
        return null;
      }
      throw e;
    }
    return await this._verifyUpdateCodeSignature(Array.isArray(publisherName) ? publisherName : [publisherName], tempUpdateFile);
  }
  doInstall(options) {
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No update filepath provided, can't quit and install"));
      return false;
    }
    const args = ["--updated"];
    if (options.isSilent) {
      args.push("/S");
    }
    if (options.isForceRunAfter) {
      args.push("--force-run");
    }
    if (this.installDirectory) {
      args.push(`/D=${this.installDirectory}`);
    }
    const packagePath = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
    if (packagePath != null) {
      args.push(`--package-file=${packagePath}`);
    }
    const callUsingElevation = () => {
      this.spawnLog(path.join(process.resourcesPath, "elevate.exe"), [installerPath].concat(args)).catch((e) => this.dispatchError(e));
    };
    if (options.isAdminRightsRequired) {
      this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe");
      callUsingElevation();
      return true;
    }
    this.spawnLog(installerPath, args).catch((e) => {
      const errorCode = e.code;
      this._logger.info(`Cannot run installer: error code: ${errorCode}, error message: "${e.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`);
      if (errorCode === "UNKNOWN" || errorCode === "EACCES") {
        callUsingElevation();
      } else if (errorCode === "ENOENT") {
        require$$1.shell.openPath(installerPath).catch((err) => this.dispatchError(err));
      } else {
        this.dispatchError(e);
      }
    });
    return true;
  }
  async differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packagePath, provider) {
    if (packageInfo.blockMapSize == null) {
      return true;
    }
    try {
      const downloadOptions = {
        newUrl: new url_1.URL(packageInfo.path),
        oldFile: path.join(this.downloadedUpdateHelper.cacheDir, builder_util_runtime_1.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: packagePath,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
        cancellationToken: downloadUpdateOptions.cancellationToken
      };
      if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) {
        downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
      }
      await new FileWithEmbeddedBlockMapDifferentialDownloader_1.FileWithEmbeddedBlockMapDifferentialDownloader(packageInfo, this.httpExecutor, downloadOptions).download();
    } catch (e) {
      this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
      return process.platform === "win32";
    }
    return false;
  }
}
NsisUpdater$1.NsisUpdater = NsisUpdater;
(function(exports) {
  var __createBinding = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === void 0) k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = commonjsGlobal && commonjsGlobal.__exportStar || function(m, exports2) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NsisUpdater = exports.MacUpdater = exports.RpmUpdater = exports.PacmanUpdater = exports.DebUpdater = exports.AppImageUpdater = exports.Provider = exports.NoOpLogger = exports.AppUpdater = exports.BaseUpdater = void 0;
  const fs_extra_12 = lib;
  const path2 = require$$1$1;
  var BaseUpdater_12 = BaseUpdater$1;
  Object.defineProperty(exports, "BaseUpdater", { enumerable: true, get: function() {
    return BaseUpdater_12.BaseUpdater;
  } });
  var AppUpdater_12 = AppUpdater$1;
  Object.defineProperty(exports, "AppUpdater", { enumerable: true, get: function() {
    return AppUpdater_12.AppUpdater;
  } });
  Object.defineProperty(exports, "NoOpLogger", { enumerable: true, get: function() {
    return AppUpdater_12.NoOpLogger;
  } });
  var Provider_12 = Provider$1;
  Object.defineProperty(exports, "Provider", { enumerable: true, get: function() {
    return Provider_12.Provider;
  } });
  var AppImageUpdater_1 = AppImageUpdater$1;
  Object.defineProperty(exports, "AppImageUpdater", { enumerable: true, get: function() {
    return AppImageUpdater_1.AppImageUpdater;
  } });
  var DebUpdater_1 = DebUpdater$1;
  Object.defineProperty(exports, "DebUpdater", { enumerable: true, get: function() {
    return DebUpdater_1.DebUpdater;
  } });
  var PacmanUpdater_1 = PacmanUpdater$1;
  Object.defineProperty(exports, "PacmanUpdater", { enumerable: true, get: function() {
    return PacmanUpdater_1.PacmanUpdater;
  } });
  var RpmUpdater_1 = RpmUpdater$1;
  Object.defineProperty(exports, "RpmUpdater", { enumerable: true, get: function() {
    return RpmUpdater_1.RpmUpdater;
  } });
  var MacUpdater_1 = MacUpdater$1;
  Object.defineProperty(exports, "MacUpdater", { enumerable: true, get: function() {
    return MacUpdater_1.MacUpdater;
  } });
  var NsisUpdater_1 = NsisUpdater$1;
  Object.defineProperty(exports, "NsisUpdater", { enumerable: true, get: function() {
    return NsisUpdater_1.NsisUpdater;
  } });
  __exportStar(types, exports);
  let _autoUpdater;
  function doLoadAutoUpdater() {
    if (process.platform === "win32") {
      _autoUpdater = new NsisUpdater$1.NsisUpdater();
    } else if (process.platform === "darwin") {
      _autoUpdater = new MacUpdater$1.MacUpdater();
    } else {
      _autoUpdater = new AppImageUpdater$1.AppImageUpdater();
      try {
        const identity = path2.join(process.resourcesPath, "package-type");
        if (!(0, fs_extra_12.existsSync)(identity)) {
          return _autoUpdater;
        }
        const fileType = (0, fs_extra_12.readFileSync)(identity).toString().trim();
        switch (fileType) {
          case "deb":
            _autoUpdater = new DebUpdater$1.DebUpdater();
            break;
          case "rpm":
            _autoUpdater = new RpmUpdater$1.RpmUpdater();
            break;
          case "pacman":
            _autoUpdater = new PacmanUpdater$1.PacmanUpdater();
            break;
          default:
            break;
        }
      } catch (error2) {
        console.warn("Unable to detect 'package-type' for autoUpdater (rpm/deb/pacman support). If you'd like to expand support, please consider contributing to electron-builder", error2.message);
      }
    }
    return _autoUpdater;
  }
  Object.defineProperty(exports, "autoUpdater", {
    enumerable: true,
    get: () => {
      return _autoUpdater || doLoadAutoUpdater();
    }
  });
})(main$1);
function initUpdaterIpc() {
  main$1.autoUpdater.autoDownload = true;
  main$1.autoUpdater.autoInstallOnAppQuit = true;
  require$$1.ipcMain.handle("updater:check", async () => {
    try {
      const result = await main$1.autoUpdater.checkForUpdates();
      return result;
    } catch (error2) {
      const windows = require$$1.BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].webContents.send("updater:error", error2.message || "Error checking for updates");
      }
      return null;
    }
  });
  require$$1.ipcMain.handle("updater:install", () => {
    main$1.autoUpdater.quitAndInstall(false, true);
  });
  main$1.autoUpdater.on("update-available", () => {
    const windows = require$$1.BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send("updater:available");
    }
  });
  main$1.autoUpdater.on("update-not-available", () => {
    const windows = require$$1.BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send("updater:not-available");
    }
  });
  main$1.autoUpdater.on("download-progress", (progressObj) => {
    const windows = require$$1.BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send("updater:progress", progressObj);
    }
  });
  main$1.autoUpdater.on("update-downloaded", () => {
    const windows = require$$1.BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send("updater:downloaded");
    }
  });
  main$1.autoUpdater.on("error", (err) => {
    const windows = require$$1.BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send("updater:error", err == null ? "unknown" : (err.stack || err).toString());
    }
  });
}
require$$1.app.disableHardwareAcceleration();
require$$1.app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
require$$1.app.commandLine.appendSwitch("disable-http-cache");
process.env.APP_ROOT = path$n.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const RENDERER_DIST = path$n.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$n.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
function createWindow() {
  win = new require$$1.BrowserWindow({
    width: 1280,
    height: 800,
    icon: path$n.join(process.env.VITE_PUBLIC, "logo.png"),
    webPreferences: {
      preload: path$n.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$n.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.session.on("will-download", (_event, item) => {
    item.setSaveDialogOptions({
      defaultPath: item.getFilename()
    });
  });
}
require$$1.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    require$$1.app.quit();
    win = null;
  }
});
require$$1.app.on("activate", () => {
  if (require$$1.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
require$$1.app.whenReady().then(() => {
  createWindow();
  initSettingsIpc();
  initProductsIpc();
  initPartiesIpc();
  initInvoicesIpc();
  initTreasuryIpc();
  initUsersIpc();
  initDashboardIpc();
  initReportsIpc();
  initBasicDataIpc();
  initLicenseIpc();
  setupNotificationsIPC();
  initStocktakeIpc();
  initAutoBackup();
  initTelegramBot();
  initUpdaterIpc();
});
