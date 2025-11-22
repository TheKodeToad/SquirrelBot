const WORD_END_PATTERN = /\s/g;
const WHITESPACE_EATER_PATTERN = /\s+/y;

export class StringReader {
	input: string;
	// TODO: track the next item instead of the current?
	cursor: number;
	private _ops: number;

	constructor(input: string) {
		this.input = input;
		this.cursor = -1;
		this._ops = 100_000;
	}

	private _trackOp(): void {
		if (--this._ops < 0) {
			throw new Error("Operation limit exceeded; infinite loop assumed");
		}
	}

	private _canRead(offset = 1): boolean {
		const i = this.cursor + offset;
		return i >= 0 && i < this.input.length;
	}

	private _read(): string {
		if (!this._canRead()) {
			throw new Error("canRead() = false");
		}

		return this.input[++this.cursor]!;
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

		if (!this._canRead(offset)) {
			throw new Error(`canRead(${offset}) = false`);
		}

		return this.input[this.cursor + offset]!;
	}

	readUntil(pattern: string | RegExp): string {
		this._trackOp();

		this._read();

		let endIndex = this.input.length;

		if (pattern instanceof RegExp) {
			if (!pattern.global) {
				throw new Error("Non-global RegExp passed");
			}

			pattern.lastIndex = this.cursor;
			const match = pattern.exec(this.input);

			if (match !== null) {
				endIndex = match.index;
			}
		} else {
			const match = this.input.indexOf(pattern, this.cursor);

			if (match !== -1) {
				endIndex = match;
			}
		}

		const result = this.input.substring(this.cursor, endIndex);
		this.cursor = endIndex - 1;

		return result;
	}

	readWord(): string {
		return this.readUntil(WORD_END_PATTERN);
	}

	match(sequence: string | RegExp, offset = 1): boolean {
		this._trackOp();

		if (this.cursor >= this.input.length) {
			return false;
		}

		if (sequence instanceof RegExp) {
			if (!sequence.sticky) {
				throw new Error("Non-sticky RegExp passed");
			}

			sequence.lastIndex = this.cursor + offset;

			const match = sequence.exec(this.input);
			return match !== null;
		} else {
			return this.input.startsWith(sequence, this.cursor + offset);
		}
	}

	skipOver(sequence: string | RegExp): boolean {
		this._trackOp();

		if (this.cursor >= this.input.length) {
			return false;
		}

		if (sequence instanceof RegExp) {
			if (!sequence.sticky) {
				throw new Error("Non-sticky RegExp passed");
			}

			sequence.lastIndex = this.cursor + 1;
			const match = sequence.exec(this.input);

			if (match === null || match.length === 0) {
				return false;
			}

			this.cursor += match[0].length;

			return true;
		} else {
			if (!this.input.startsWith(sequence, this.cursor + 1)) {
				return false;
			}

			this.cursor += sequence.length;

			return true;
		}
	}

	skipWhitespace(): boolean {
		return this.skipOver(WHITESPACE_EATER_PATTERN);
	}
}
