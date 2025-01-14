import dav from "dav";
import * as transport from "./parsing/caldav/transport";
import {
    Authentication,
    CalendarInfo,
    OFCEvent,
    ClassifyInfo,
} from "src/types";
import { EventResponse } from "./Calendar";
import RemoteCalendar from "./RemoteCalendar";
import { getEventsFromICS } from "src/calendars/parsing/ics";

export default class CalDAVCalendar extends RemoteCalendar {
    _name: string;
    credentials: Authentication;
    serverUrl: string;
    calendarUrl: string;
    private _category: ClassifyInfo[];

    events: OFCEvent[] = [];

    constructor(
        color: string,
        name: string,
        credentials: Authentication,
        serverUrl: string,
        calendarUrl: string,
        category: ClassifyInfo[]
    ) {
        super(color);
        this._name = name;
        this.credentials = credentials;
        this.serverUrl = serverUrl;
        this.calendarUrl = calendarUrl;
        this._category = category;
    }

    get category(): ClassifyInfo[] {
        return this._category;
    }

    async revalidate(): Promise<void> {
        let xhr = new transport.Basic(
            new dav.Credentials({
                username: this.credentials.username,
                password: this.credentials.password,
            })
        );
        let account = await dav.createAccount({
            xhr: xhr,
            server: this.serverUrl,
        });
        let calendar = account.calendars.find(
            (calendar) => calendar.url === this.calendarUrl
        );
        if (!calendar) {
            return;
        }
        let caldavEvents = await dav.listCalendarObjects(calendar, { xhr });
        this.events = caldavEvents
            .filter((vevent) => vevent.calendarData)
            .flatMap((vevent) => getEventsFromICS(vevent.calendarData));
    }

    get type(): CalendarInfo["type"] {
        return "caldav";
    }

    get identifier(): string {
        return this.calendarUrl;
    }

    get name(): string {
        return this._name;
    }

    async getEvents(): Promise<EventResponse[]> {
        return this.events.map((e) => [e, null]);
    }
}
