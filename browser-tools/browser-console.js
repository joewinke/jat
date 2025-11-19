#!/usr/bin/env node

import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
	console.log("Usage: browser-console.js [options]");
	console.log("\nOptions:");
	console.log("  --follow        Keep connection open and stream console logs");
	console.log("  --errors        Show only errors");
	console.log("  --warnings      Show only warnings");
	console.log("  --help, -h      Show this help message");
	console.log("\nDescription:");
	console.log("  Captures browser console logs with stack traces.");
	console.log("  Useful for debugging JavaScript errors.");
	console.log("\nExamples:");
	console.log("  browser-console.js                   # Get current console state");
	console.log("  browser-console.js --follow          # Stream console logs");
	console.log("  browser-console.js --errors          # Show only errors");
	process.exit(0);
}

const follow = args.includes("--follow");
const errorsOnly = args.includes("--errors");
const warningsOnly = args.includes("--warnings");

const b = await puppeteer.connect({
	browserURL: "http://localhost:9222",
	defaultViewport: null,
});

const page = (await b.pages()).at(-1);

const logs = [];

// Set up console listener
page.on("console", async (msg) => {
	const type = msg.type();

	// Filter based on flags
	if (errorsOnly && type !== "error") return;
	if (warningsOnly && type !== "warning") return;

	const text = msg.text();
	const location = msg.location();

	const logEntry = {
		type,
		text,
		url: location.url,
		lineNumber: location.lineNumber,
		columnNumber: location.columnNumber,
		timestamp: new Date().toISOString(),
	};

	// For errors, try to get stack trace
	if (type === "error") {
		const args = await Promise.all(
			msg.args().map(async (arg) => {
				try {
					return await arg.jsonValue();
				} catch {
					return null;
				}
			}),
		);
		if (args.length > 0) {
			logEntry.stack = args.filter(Boolean);
		}
	}

	if (follow) {
		console.log(JSON.stringify(logEntry, null, 2));
	} else {
		logs.push(logEntry);
	}
});

// If not following, wait a bit to collect initial logs
if (!follow) {
	await new Promise((r) => setTimeout(r, 1000));
	console.log(JSON.stringify({ logs, count: logs.length }, null, 2));
	await b.disconnect();
} else {
	console.error("✓ Streaming console logs (Ctrl+C to stop)...");
	// Keep connection alive
	process.on("SIGINT", async () => {
		console.error("\n✓ Stopped");
		await b.disconnect();
		process.exit(0);
	});
}
