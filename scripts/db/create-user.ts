// Creates users, or resets the password of existing ones. There is no sign-up page by design.
//
// One user (the password is asked interactively, typed characters are hidden):
//   npm run db:create-user -- --email name@example.it --name "Mario Rossi" [--password ...]
//
// Many users from a CSV file with lines "email,name[,password]" (lines starting with # are ignored).
// A random password is generated for the lines without one and printed once at the end.
// Users that already exist are skipped, unless --reset-passwords is given:
//   npm run db:create-user -- --file users.local.csv [--reset-passwords]
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import postgres from "postgres";
import { hashPassword } from "#lib/server/password.ts";

const MIN_PASSWORD_LENGTH = 10;

interface NewUser {
    email: string;
    name: string;
    password?: string;
}

const { values } = parseArgs({
    options: {
        email: { type: "string" },
        name: { type: "string" },
        password: { type: "string" },
        file: { type: "string" },
        "reset-passwords": { type: "boolean", default: false },
    },
});

const askHidden = (question: string) =>
    new Promise<string>((resolve) => {
        process.stdout.write(question);
        const stdin = process.stdin;
        stdin.setRawMode?.(true);
        stdin.resume();
        stdin.setEncoding("utf8");

        let answer = "";
        const onData = (character: string) => {
            if (character === "\r" || character === "\n" || character === "\u0004") {
                stdin.setRawMode?.(false);
                stdin.pause();
                stdin.removeListener("data", onData);
                process.stdout.write("\n");
                resolve(answer);
            } else if (character === "\u0003") {
                process.exit(1);
            } else if (character === "\u007f" || character === "\b") {
                answer = answer.slice(0, -1);
            } else {
                answer += character;
            }
        };
        stdin.on("data", onData);
    });

const fail = (message: string): never => {
    console.error(message);
    process.exit(1);
};

async function readUsersFile(path: string): Promise<NewUser[]> {
    const lines = (await readFile(path, "utf8")).split(/\r?\n/).map((line) => line.trim());
    const users: NewUser[] = [];

    for (const [index, line] of lines.entries()) {
        if (!line || line.startsWith("#") || /^email\s*[,;]/i.test(line)) continue;

        const [email, name, ...rest] = line.split(/[,;]/).map((part) => part.trim());
        const password = rest.join(",") || undefined;
        if (!email?.includes("@") || !name) fail(`Line ${index + 1}: expected "email,name[,password]".`);
        if (password && password.length < MIN_PASSWORD_LENGTH) {
            fail(`Line ${index + 1}: the password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
        }
        users.push({ email: email.toLowerCase(), name, password });
    }
    return users;
}

// Migrations and users change the database directly: use the non-pooled connection.
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) fail("DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set.");

let users: NewUser[];
let overwrite: boolean;

if (values.file) {
    users = await readUsersFile(values.file);
    overwrite = values["reset-passwords"];
    if (users.length === 0) fail("The file does not contain any user.");
} else {
    const email = values.email?.trim().toLowerCase();
    const name = values.name?.trim();
    if (!email || !name) {
        fail('Usage: npm run db:create-user -- --email name@example.it --name "Mario Rossi"');
    }

    const password = values.password ?? (await askHidden("Password: "));
    if (password.length < MIN_PASSWORD_LENGTH) {
        fail(`The password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    }
    users = [{ email: email!, name: name!, password }];
    overwrite = true;
}

const sql = postgres(connectionString!, { max: 1, connect_timeout: 60 });
const report: { email: string; result: string; password: string }[] = [];

try {
    console.log(`Database: ${new URL(connectionString!).host}`);

    for (const user of users) {
        const generated = !user.password;
        const password = user.password ?? randomBytes(12).toString("base64url");
        const passwordHash = await hashPassword(password);

        const [saved] = overwrite
            ? await sql<{ created: boolean }[]>`
                insert into users (email, name, password_hash)
                values (${user.email}, ${user.name}, ${passwordHash})
                on conflict (email) do update
                    set name = excluded.name,
                        password_hash = excluded.password_hash,
                        failed_login_attempts = 0,
                        locked_until = null
                returning (xmax = 0) as created
            `
            : await sql<{ created: boolean }[]>`
                insert into users (email, name, password_hash)
                values (${user.email}, ${user.name}, ${passwordHash})
                on conflict (email) do nothing
                returning true as created
            `;

        report.push({
            email: user.email,
            result: !saved ? "skipped (already exists)" : saved.created ? "created" : "password reset",
            // Only show passwords that were generated here: the others are already known to the person.
            password: saved && generated ? password : "",
        });
    }

    console.table(report);
    if (report.some((row) => row.password)) {
        console.log("Passwords are shown only now: hand them out and do not store them in plain text.");
    }
} catch (error) {
    console.error("Could not save the users:", error instanceof Error ? error.message || (error as NodeJS.ErrnoException).code || error.name : error);
    process.exitCode = 1;
} finally {
    await sql.end();
}
