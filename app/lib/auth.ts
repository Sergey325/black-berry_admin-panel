import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signToken() {
    return await new SignJWT({ role: "admin" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret, {algorithms: ["HS256"]});
        return payload.role === "admin" && typeof payload.exp === "number" ? payload : null;
    } catch {
        return null;
    }
}
