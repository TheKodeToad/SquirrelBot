const WORD_END_PATTERN = /\s/g;
const WHITESPACE_EATER_PATTERN = /\s+/y;

export class StringReader {
	private _input: string;
	// TODO: track the next item instead of the current?
	private _cursor: number;
	private _markedCursor: number | null;
	private _ops: number;

	constructor(input: string) {
		this._input = input;
		this._cursor = -1;
		this._markedCursor = null;
		this._ops = 100_000;
	}

	private _trackOp(): void {
		if (--this._ops < 0)
			throw new Error("Operation limit exceeded; infinite loop assumed");
	}

	private _canRead(offset = 1): boolean {
		const i = this._cursor + offset;
		return i >= 0 && i < this._input.length;
	}

	private _read(): string {
		if (!this._canRead())
			throw new Error("canRead() = false");

		return this._input[++this._cursor]!;
	}

	canRead(offset = 1): boolean {
		this._trackOp();

		return this._canRead(offset);
	}

	read(): string {
		this._trackOp();

		return this._read();
	}

	peek(offset = 1): string {
		this._trackOp();

		if (!this._canRead(offset))
			throw new Error(`canRead(${offset}) = false`);

		return this._input[this._cursor + offset]!;
	}

	mark(): void {
		if (this._markedCursor !== null)
			throw new Error("Already marked");

		this._markedCursor = this._cursor;
	}

	unmark(): void {
		this._markedCursor = null;
	}

	reset(): void {
		if (this._markedCursor === null)
			throw new Error("No mark set");

		this._cursor = this._markedCursor;

		this._markedCursor = null;
	}

	readUntil(pattern: string | RegExp): string {
		this._trackOp();

		this._read();

		let endIndex = this._input.length;

		if (pattern instanceof RegExp) {
			if (!pattern.global)
				throw new Error("Non-global RegExp passed");

			pattern.lastIndex = this._cursor;
			const match = pattern.exec(this._input);

			if (match !== null)
				endIndex = match.index;
		} else {
			const match = this._input.indexOf(pattern, this._cursor);

			if (match !== -1)
				endIndex = match;
		}

		const result = this._input.substring(this._cursor, endIndex);
		this._cursor = endIndex - 1;

		return result;
	}

	readWord(): string {
		return this.readUntil(WORD_END_PATTERN);
	}

	match(sequence: string | RegExp, offset = 1): boolean {
		this._trackOp();

		if (this._cursor >= this._input.length)
			return false;

		if (sequence instanceof RegExp) {
			if (!sequence.sticky)
				throw new Error("Non-sticky RegExp passed");

			sequence.lastIndex = this._cursor + offset;

			const match = sequence.exec(this._input);
			return match !== null;
		} else
			return this._input.startsWith(sequence, this._cursor + offset);
	}

	skipOver(sequence: string | RegExp): boolean {
		this._trackOp();

		if (this._cursor >= this._input.length)
			return false;

		if (sequence instanceof RegExp) {
			if (!sequence.sticky)
				throw new Error("Non-sticky RegExp passed");

			sequence.lastIndex = this._cursor + 1;
			const match = sequence.exec(this._input);

			if (match === null || match.length === 0)
				return false;

			this._cursor += match[0].length;

			return true;
		} else {
			if (!this._input.startsWith(sequence, this._cursor + 1))
				return false;

			this._cursor += sequence.length;

			return true;
		}
	}

	skipWhitespace(): boolean {
		return this.skipOver(WHITESPACE_EATER_PATTERN);
	}
}
