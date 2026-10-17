// Creates a user, or resets the password of an existing one.
// Usage: npm run db:create-user -- --email name@example.it --name "Mario Rossi" [--password ...]
// If --password is omitted it is asked interactively (typed characters are hidden).
import { parseArgs } from "node:util";
import postgres from "postgres";
import { hashPassword } from "#lib/server/password.ts";

const MIN_PASSWORD_LENGTH = 10;

const { values } = parseArgs({
    options: {
        email: { type: "string" },
        name: { type: "string" },
        password: { type: "string" },
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

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
}

const email = values.email?.trim().toLowerCase();
const name = values.name?.trim();
if (!email || !name) {
    console.error('Usage: npm run db:create-user -- --email name@example.it --name "Mario Rossi"');
    process.exit(1);
}

const password = values.password ?? (await askHidden("Password: "));
if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });
try {
    const passwordHash = await hashPassword(password);
    const [user] = await sql<{ id: string; created: boolean }[]>`
        insert into users (email, name, password_hash)
        values (${email}, ${name}, ${passwordHash})
        on conflict (email) do update
            set name = excluded.name,
                password_hash = excluded.password_hash,
                failed_login_attempts = 0,
                locked_until = null
        returning id, (xmax = 0) as created
    `;
    console.log(`${user.created ? "Created" : "Updated"} user ${email} (${user.id}).`);
} catch (error) {
    console.error("Could not save the user:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
} finally {
    await sql.end();
}
