import { moduleLogger } from "#common/logger/index.ts";
import { dateToHMSString } from "#common/time.ts";

const logger = moduleLogger();

export interface PollingSchedulerOptions<T> {
	discriminator: string;
	pollRate: number;

	poll: (startInclusive: Date, endExclusive: Date) => Promise<T[]>;
	run: (task: T) => Promise<void>;

	getTimestamp: (task: T) => Date;
	debugFormat: (task: T) => string;
}

export interface PollingSchedulerHandle<T> {
	track: (task: T) => void;
}

interface State<T> {
	options: PollingSchedulerOptions<T>;
	nextStartTimestamp: Date;
}

/**
 * Start polling for tasks.
 * @return A handle to the scheduler, after the first poll is done
 */
export async function startPollingScheduler<T>(options: PollingSchedulerOptions<T>): Promise<PollingSchedulerHandle<T>> {
	const state: State<T> = {
		options,
		nextStartTimestamp: new Date(0),
	};

	await poll(state);
	setInterval(() => poll(state), state.options.pollRate).unref();

	return {
		track: task => {
			if (state.options.getTimestamp(task) >= state.nextStartTimestamp)
				return;

			setRunTimeout(state, task);
		}
	};
}

async function poll<E>(state: State<E>): Promise<void> {
	const end = new Date(Date.now() + state.options.pollRate);

	logger.debug?.(
		end.getTime()
			? `Setting initial timeouts for #${state.options.discriminator} tasks`
			: `Setting timeouts for #${state.options.discriminator} tasks `
				+ ` from ${dateToHMSString(state.nextStartTimestamp)}`
				+ ` to ${dateToHMSString(end)}`
	);

	const tasks = await state.options.poll(state.nextStartTimestamp, end);
	state.nextStartTimestamp = end;

	for (const task of tasks) {
		setRunTimeout(state, task);
	}
}

async function setRunTimeout<T>(state: State<T>, task: T) {
	const delay = Math.max(0, state.options.getTimestamp(task).getTime() - Date.now());
	setTimeout(() => state.options.run(task), delay).unref();

	logger.debug?.(`Setting up timeout for #${state.options.discriminator} task ${state.options.debugFormat(task)} with delay ${delay}`);
}
