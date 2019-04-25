export type MySQLSessionStoreOptions = {

	/** Host name for database connection: */
	host: string;

	/** Port number for database connection: */
	port: number;

	/** Database user: */
	user: string;

	/** Password for the above database user: */
	password: string;

	/** Database name: */
	database: string;



	/** Whether or not to automatically check for and clear expired sessions: */
	clearExpired?: boolean;

	/** How frequently expired sessions will be cleared; milliseconds: */
	checkExpirationInterval?: number;

	/** The maximum age of a valid session; milliseconds: */
	expiration?: number;

	/** Whether or not to create the sessions database table, if one does not already exist: */
	createDatabaseTable?: boolean;

	/** Number of connections when creating a connection pool: */
	connectionLimit?: number;

	/** Whether or not to end the database connection when the store is closed.
	The default value of this option depends on whether or not a connection was passed to the constructor.
	If a connection object is passed to the constructor, the default value for this option is false. */
	endConnectionOnClose?: boolean;

	charset?: string;

	schema?: {
		tableName: string;
		columnNames: {
			session_id: string;
			expires: string;
			data: string;
		}
	}
}



export class MySQLStore {
	constructor(options: MySQLSessionStoreOptions, connection?: any, callback?: (error?: any) => void);
	constructor(options: Partial<MySQLSessionStoreOptions>, connection: any, callback?: (error?: any) => void);

	setOptions(options: MySQLSessionStoreOptions): any;
	validateOptions(options: any): boolean;
	createDatabaseTable(cb: (error?: any) => void): any;

	// Internal functions
	private query(sql: any, params: any, cb: any): any;
	private clearExpiredSessions(cb: (error?: any) => void): any;
	private setExpirationInterval(interval: number): any;
	private clearExpirationInterval(): any;
	private close(cb: (error?: any) => void): any;

	// Implemented Store methods
	get: (sid: string, callback: (err: any, session?: Express.SessionData | null) => void) => void;
	set: (sid: string, session: Express.SessionData, callback?: (err?: any) => void) => void;
	destroy: (sid: string, callback?: (err?: any) => void) => void;
	all: (callback: (err: any, obj?: { [sid: string]: Express.SessionData; } | null) => void) => void;
	length: (callback: (err: any, length?: number | null) => void) => void;
	clear: (callback?: (err?: any) => void) => void;
	touch: (sid: string, session: Express.SessionData, callback?: (err?: any) => void) => void;
}


export default function MySQLStoreFactory(session: any): typeof MySQLStore;
