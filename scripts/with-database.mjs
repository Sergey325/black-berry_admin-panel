import { spawn } from "node:child_process";

const [target, command, ...args] = process.argv.slice(2);
if (!["dev", "prod"].includes(target) || !["dev", "build", "start"].includes(command)) {
    throw new Error("Usage: node scripts/with-database.mjs <dev|prod> <dev|build|start>");
}

const env = { ...process.env, DATABASE_TARGET: target };
console.log(`Database target: ${target}`);

function run(module, moduleArgs) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [module, ...moduleArgs], { env, stdio: "inherit" });
        child.on("error", reject);
        child.on("exit", (code) => resolve(code ?? 1));
    });
}

if (command === "build") {
    const code = await run("node_modules/prisma/build/index.js", ["generate"]);
    if (code !== 0) process.exit(code);
}
process.exitCode = await run("node_modules/next/dist/bin/next", [command, ...args]);
