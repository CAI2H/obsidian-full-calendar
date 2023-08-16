import { request } from "obsidian";
import { CalendarInfo, ClassifyInfo } from "src/types";
import { EventResponse } from "./Calendar";
import { getEventsFromICS } from "./parsing/ics";
import RemoteCalendar from "./RemoteCalendar";

const WEBCAL = "webcal";

export default class ICSCalendar extends RemoteCalendar {
    private url: string;
    private response: string | null = null;
    private _category: ClassifyInfo[];

    constructor(color: string, url: string, category: ClassifyInfo[]) {
        super(color);
        if (url.startsWith(WEBCAL)) {
            url = "https" + url.slice(WEBCAL.length);
        }
        this.url = url;
        this._category = category;
    }

    get category(): ClassifyInfo[] {
        return this._category;
    }

    get type(): CalendarInfo["type"] {
        return "ical";
    }

    get identifier(): string {
        return this.url;
    }
    get name(): string {
        return this.url;
    }

    async revalidate(): Promise<void> {
        console.debug("revalidating ICS calendar " + this.name);
        this.response = await request({
            url: this.url,
            method: "GET",
        });
    }

    async getEvents(): Promise<EventResponse[]> {
        if (!this.response) {
            return [];
        }
        return getEventsFromICS(this.response).map((e) => [e, null]);
    }
}
