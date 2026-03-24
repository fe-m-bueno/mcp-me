export interface ToolResponse {
	isError?: boolean;
	content: Array<{ type: "text"; text: string }>;
}

export function textResult(text: string): ToolResponse {
	return { content: [{ type: "text", text }] };
}

export function errorResult(text: string): ToolResponse {
	return { isError: true, content: [{ type: "text", text }] };
}

const DATA_NOT_FOUND =
	"Data file not found. Ensure the server was built with 'npm run build'.";

export function safeLoadCv<T>(loader: () => T): T | ToolResponse {
	try {
		return loader();
	} catch {
		return errorResult(DATA_NOT_FOUND);
	}
}

export function isErrorResponse(value: unknown): value is ToolResponse {
	return (
		typeof value === "object" &&
		value !== null &&
		"isError" in value &&
		(value as ToolResponse).isError === true
	);
}
