#!/usr/bin/env node

import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
	console.log("Usage: browser-network.js [options]");
	console.log("\nOptions:");
	console.log("  --follow        Keep connection open and stream network requests");
	console.log("  --failed        Show only failed requests");
	console.log("  --help, -h      Show this help message");
	console.log("\nDescription:");
	console.log("  Monitors browser network requests with timing metrics.");
	console.log("  Useful for API testing and performance analysis.");
	console.log("\nExamples:");
	console.log("  browser-network.js                   # Get current network state");
	console.log("  browser-network.js --follow          # Stream network requests");
	console.log("  browser-network.js --failed          # Show only failed requests");
	process.exit(0);
}

const follow = args.includes("--follow");
const failedOnly = args.includes("--failed");

const b = await puppeteer.connect({
	browserURL: "http://localhost:9222",
	defaultViewport: null,
});

const page = (await b.pages()).at(-1);

const requests = [];

// Enable network tracking
const client = await page.createCDPSession();
await client.send("Network.enable");

// Track request/response timing
client.on("Network.requestWillBeSent", (event) => {
	requests[event.requestId] = {
		id: event.requestId,
		url: event.request.url,
		method: event.request.method,
		type: event.type,
		timestamp: event.timestamp,
		startTime: Date.now(),
	};
});

client.on("Network.responseReceived", (event) => {
	const req = requests[event.requestId];
	if (req) {
		const response = event.response;
		req.status = response.status;
		req.statusText = response.statusText;
		req.mimeType = response.mimeType;
		req.responseTime = Date.now() - req.startTime;
		req.headers = response.headers;

		// Filter failed requests
		if (failedOnly && req.status >= 200 && req.status < 400) {
			return;
		}

		if (follow) {
			console.log(
				JSON.stringify(
					{
						url: req.url,
						method: req.method,
						status: req.status,
						responseTime: `${req.responseTime}ms`,
						type: req.type,
					},
					null,
					2,
				),
			);
		}
	}
});

client.on("Network.loadingFailed", (event) => {
	const req = requests[event.requestId];
	if (req) {
		req.failed = true;
		req.errorText = event.errorText;
		req.canceled = event.canceled;

		if (follow) {
			console.log(
				JSON.stringify(
					{
						url: req.url,
						method: req.method,
						error: req.errorText,
						failed: true,
					},
					null,
					2,
				),
			);
		}
	}
});

// If not following, wait a bit to collect initial requests
if (!follow) {
	await new Promise((r) => setTimeout(r, 1000));

	const completedRequests = Object.values(requests).filter((r) => r.status || r.failed);

	console.log(
		JSON.stringify(
			{
				requests: completedRequests.map((r) => ({
					url: r.url,
					method: r.method,
					status: r.status,
					responseTime: r.responseTime ? `${r.responseTime}ms` : undefined,
					type: r.type,
					failed: r.failed,
					error: r.errorText,
				})),
				count: completedRequests.length,
			},
			null,
			2,
		),
	);
	await client.detach();
	await b.disconnect();
} else {
	console.error("✓ Streaming network requests (Ctrl+C to stop)...");
	// Keep connection alive
	process.on("SIGINT", async () => {
		console.error("\n✓ Stopped");
		await client.detach();
		await b.disconnect();
		process.exit(0);
	});
}
