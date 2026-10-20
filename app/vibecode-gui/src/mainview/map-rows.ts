export interface MapRowSpace {
	widths: number[];
	gap: number;
	available: number;
}

function gridWidth(widths: number[], gap: number, columns: number): number {
	let total = gap * (columns - 1);
	for (let column = 0; column < columns; column++) {
		let widest = 0;
		for (let index = column; index < widths.length; index += columns) widest = Math.max(widest, widths[index]);
		total += widest;
	}
	return total;
}

export function wrapMapRows<T>(items: T[], { widths, gap, available }: MapRowSpace): T[][] {
	let columns = items.length;
	while (columns > 1 && gridWidth(widths, gap, columns) > available) columns--;
	const rows: T[][] = [];
	for (let start = 0; start < items.length; start += columns) rows.push(items.slice(start, start + columns));
	return rows;
}
