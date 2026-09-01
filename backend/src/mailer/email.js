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

async function renderTemplate(templateName, data) {
    const templatePath = path.join(
        __dirname,
        "templates",
        `${templateName}.hbs`
    );

    const template = await fs.readFile(templatePath, "utf8");

    return Handlebars.compile(template)(data);
}

export async function sendEmail({
    to,
    subject,
    template,
    data,
}) {
    const html = await renderTemplate(template, data);

    return transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
    });
}