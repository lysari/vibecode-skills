import { useState } from "react";

function errorMessage(cause: unknown): string {
	return cause instanceof Error ? cause.message : String(cause);
}

export function useError() {
	const [error, setError] = useState<string | null>(null);

	async function runRequest(failure: string, request: () => Promise<void>): Promise<boolean> {
		try {
			await request();
			setError(null);
			return true;
		} catch (cause) {
			setError(`${failure}: ${errorMessage(cause)}`);
			return false;
		}
	}

	return { error, setError, runRequest };
}
