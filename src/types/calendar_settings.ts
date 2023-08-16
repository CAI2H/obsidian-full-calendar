import { ZodError, z } from "zod";
import { OFCEvent } from "./schema";

const classify = z.object({ name: z.string(), color: z.string() });
const calendarOptionsSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("local"),
        directory: z.string(),
        category: z.array(classify),
    }),
    z.object({
        type: z.literal("dailynote"),
        heading: z.string(),
        category: z.array(classify),
    }),
    z.object({
        type: z.literal("ical"),
        url: z.string().url(),
        category: z.array(classify),
    }),
    z.object({
        type: z.literal("caldav"),
        name: z.string(),
        url: z.string().url(),
        homeUrl: z.string().url(),
        username: z.string(),
        password: z.string(),
        category: z.array(classify),
    }),
]);

const colorValidator = z.object({ color: z.string() });

export type TestSource = {
    type: "FOR_TEST_ONLY";
    id: string;
    events?: OFCEvent[];
};

export type ClassifyInfo = z.infer<typeof classify>;

export type CalendarInfo = (
    | z.infer<typeof calendarOptionsSchema>
    | TestSource
) &
    z.infer<typeof colorValidator>;

export function parseCalendarInfo(obj: unknown): CalendarInfo {
    const options = calendarOptionsSchema.parse(obj);
    const color = colorValidator.parse(obj);

    return { ...options, ...color };
}

export function safeParseCalendarInfo(obj: unknown): CalendarInfo | null {
    try {
        return parseCalendarInfo(obj);
    } catch (e) {
        if (e instanceof ZodError) {
            console.debug("Parsing calendar info failed with errors", {
                obj,
                error: e.message,
            });
        }
        return null;
    }
}

/**
 * Construct a partial calendar source of the specified type
 */
export function makeDefaultPartialCalendarSource(
    type: CalendarInfo["type"] | "icloud"
): Partial<CalendarInfo> {
    if (type === "icloud") {
        return {
            type: "caldav",
            color: getComputedStyle(document.body)
                .getPropertyValue("--interactive-accent")
                .trim(),
            url: "https://caldav.icloud.com",
        };
    }
    const category = new Array<ClassifyInfo>();
    category.push({
        name: "default",
        color: "#8f4d4d",
    });
    return {
        type: type,
        category,
        color: getComputedStyle(document.body)
            .getPropertyValue("--interactive-accent")
            .trim(),
    };
}
