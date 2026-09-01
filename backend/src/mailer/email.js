import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: env.SMTP_PORT === "465",
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

Handlebars.registerPartial(
  "footer",
  await fs.readFile(path.join(__dirname, "partials", "footer.hbs"), "utf8"),
);

Handlebars.registerHelper("isMultiple", function (collection) {
  return collection.length > 1;
});

async function renderTemplate(templateName, data) {
  // render the email template
  const templateSource = await fs.readFile(
    path.join(__dirname, "templates", `${templateName}.hbs`),
    "utf8",
  );

  const template = Handlebars.compile(templateSource);
  const emailBody = template(data);

  // render the base layout
  const baseLayoutSource = await fs.readFile(
    path.join(__dirname, "layout.hbs"),
    "utf8",
  );

  const baseLayout = Handlebars.compile(baseLayoutSource);

  return baseLayout({ body: emailBody });
}

export async function sendEmail({ to, subject, template, data }) {
  const html = await renderTemplate(template, data);

  return transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
}
