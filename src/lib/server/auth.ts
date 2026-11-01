import { createHash, randomBytes } from "node:crypto";
import type { Cookies } from "@sveltejs/kit";
import { dev } from "$app/env";
import { sql } from "./db.ts";
import { hashPassword, verifyPassword } from "./password.ts";

export const SESSION_COOKIE = "session";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;
const SESSION_RENEWAL_THRESHOLD_MS = SESSION_DURATION_MS / 2;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// Verified when the email is unknown, so that response time does not reveal which emails exist.
const DUMMY_HASH =
    "scrypt$00000000000000000000000000000000$" + "00".repeat(64);

export interface SessionUser {
    id: string;
    email: string;
    name: string;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type LoginResult =
    | { status: "success"; user: SessionUser }
    | { status: "invalid-credentials" }
    | { status: "locked" };

export async function authenticate(email: string, password: string): Promise<LoginResult> {
    const [user] = await sql<
        (SessionUser & { passwordHash: string; isLocked: boolean })[]
    >`
        select id, email, name, password_hash as "passwordHash",
               coalesce(locked_until > now(), false) as "isLocked"
        from users
        where email = ${email.trim().toLowerCase()}
    `;

    if (!user) {
        await verifyPassword(password, DUMMY_HASH);
        return { status: "invalid-credentials" };
    }
    if (user.isLocked) return { status: "locked" };

    if (!(await verifyPassword(password, user.passwordHash))) {
        // After a lock has expired the count starts again, otherwise a single mistake would lock the account again.
        await sql`
            update users
            set failed_login_attempts = case
                    when locked_until is not null and locked_until <= now() then 1
                    else failed_login_attempts + 1
                end,
                locked_until = case
                    when (case when locked_until is not null and locked_until <= now() then 1 else failed_login_attempts + 1 end) >= ${MAX_FAILED_ATTEMPTS}
                    then now() + make_interval(mins => ${LOCK_DURATION_MINUTES})
                end
            where id = ${user.id}
        `;
        return { status: "invalid-credentials" };
    }

    await sql`
        update users
        set failed_login_attempts = 0, locked_until = null, last_login_at = now()
        where id = ${user.id}
    `;
    return { status: "success", user: { id: user.id, email: user.email, name: user.name } };
}

export async function createSession(cookies: Cookies, userId: string) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await sql`delete from sessions where expires_at < now()`;
    await sql`
        insert into sessions (id, user_id, expires_at)
        values (${hashToken(token)}, ${userId}, ${expiresAt})
    `;
    setSessionCookie(cookies, token, expiresAt);
}

export async function validateSession(cookies: Cookies): Promise<SessionUser | null> {
    const token = cookies.get(SESSION_COOKIE);
    if (!token) return null;

    const [session] = await sql<(SessionUser & { expiresAt: Date })[]>`
        select u.id, u.email, u.name, s.expires_at as "expiresAt"
        from sessions s
        join users u on u.id = s.user_id
        where s.id = ${hashToken(token)} and s.expires_at > now()
    `;

    if (!session) {
        cookies.delete(SESSION_COOKIE, { path: "/" });
        return null;
    }

    if (session.expiresAt.getTime() - Date.now() < SESSION_RENEWAL_THRESHOLD_MS) {
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        await sql`update sessions set expires_at = ${expiresAt} where id = ${hashToken(token)}`;
        setSessionCookie(cookies, token, expiresAt);
    }

    return { id: session.id, email: session.email, name: session.name };
}

export async function destroySession(cookies: Cookies) {
    const token = cookies.get(SESSION_COOKIE);
    if (token) await sql`delete from sessions where id = ${hashToken(token)}`;
    cookies.delete(SESSION_COOKIE, { path: "/" });
}

function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date) {
    cookies.set(SESSION_COOKIE, token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: !dev,
        expires: expiresAt,
    });
}

// --- Registration ------------------------------------------------------------------------

export async function registerUser(input: { email: string; name: string; password: string }) {
    const [user] = await sql<SessionUser[]>`
        insert into users (email, name, password_hash)
        values (${input.email.trim().toLowerCase()}, ${input.name.trim()}, ${await hashPassword(input.password)})
        on conflict (email) do nothing
        returning id, email, name
    `;
    return user ?? null;
}

// --- Password reset ----------------------------------------------------------------------

const RESET_TOKEN_DURATION_MINUTES = 60;
// A new link is not created (nor sent) if one was requested less than this long ago.
const RESET_REQUEST_INTERVAL_SECONDS = 120;

/**
 * Creates a single-use token to reset the password of the user with that email.
 * Returns null when there is no such user or a link was just requested.
 */
export async function createPasswordReset(email: string) {
    const [user] = await sql<SessionUser[]>`
        select id, email, name from users where email = ${email.trim().toLowerCase()}
    `;
    if (!user) return null;

    const [recent] = await sql<{ id: string }[]>`
        select id from password_reset_tokens
        where user_id = ${user.id} and created_at > now() - make_interval(secs => ${RESET_REQUEST_INTERVAL_SECONDS})
    `;
    if (recent) return null;

    const token = randomBytes(32).toString("base64url");
    await sql`delete from password_reset_tokens where user_id = ${user.id} or expires_at < now()`;
    await sql`
        insert into password_reset_tokens (id, user_id, expires_at)
        values (${hashToken(token)}, ${user.id}, now() + make_interval(mins => ${RESET_TOKEN_DURATION_MINUTES}))
    `;
    return { user, token };
}

export async function isPasswordResetTokenValid(token: string) {
    const [row] = await sql<{ id: string }[]>`
        select id from password_reset_tokens where id = ${hashToken(token)} and expires_at > now()
    `;
    return Boolean(row);
}

/** Sets the new password, ends every session of the user and makes the token unusable. */
export async function completePasswordReset(token: string, newPassword: string) {
    const passwordHash = await hashPassword(newPassword);

    return sql.begin(async (transaction) => {
        const [reset] = await transaction<{ userId: string }[]>`
            delete from password_reset_tokens
            where id = ${hashToken(token)} and expires_at > now()
            returning user_id as "userId"
        `;
        if (!reset) return null;

        const [user] = await transaction<SessionUser[]>`
            update users
            set password_hash = ${passwordHash}, failed_login_attempts = 0, locked_until = null
            where id = ${reset.userId}
            returning id, email, name
        `;
        await transaction`delete from sessions where user_id = ${reset.userId}`;
        await transaction`delete from password_reset_tokens where user_id = ${reset.userId}`;
        return user;
    });
}
