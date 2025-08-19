#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as chrono from "chrono-node";
import { addDays } from "date-fns/addDays";
import { addMonths } from "date-fns/addMonths";
import { subDays } from "date-fns/subDays";
import { z } from "zod";

export class TimeRange {
  static parse = (range) => {
    if (typeof range === "object") {
      range = range.time_range;
    }
    if (!range) {
      return undefined;
    }
    const parsed = chrono.parse(range);
    const [chronoRange] = parsed;
    if (!chronoRange) {
      return undefined;
    }
    return new TimeRange(chronoRange);
  };

  constructor(range) {
    this.range = range;
  }

  get hasAfter() {
    return !!this.getAfter();
  }

  /**
   * Gets after date in ISO format.
   * @param {ITimeBoundOptions} [options] - Options for time bound calculation
   * @returns {string|undefined}
   */
  getAfter = (options) => {
    if (!this.range.start) {
      return undefined;
    }
    let after = this.range.start.date();
    if (this.range.start.isCertain("hour") && !options?.ignoreTime) {
      return after.toISOString();
    }
    if (options?.exclusive) {
      after = subDays(after, 1);
    }
    return after.toISOString().split("T")[0];
  };

  get hasBefore() {
    return !!this.getBefore();
  }

  /**
   * Gets the before date in ISO format.
   * @param {ITimeBoundOptions} [options] - Options for time bound calculation
   * @returns {string|undefined}
   */
  getBefore = (options) => {
    let before = this.range.end?.date();
    if (
      !before &&
      this.range.start?.isCertain("month") &&
      !this.range.start.isCertain("day")
    ) {
      before = subDays(addMonths(this.range.start.date(), 1), 1);
    }

    if (!before) {
      return undefined;
    }

    if (this.range.end?.isCertain("hour") && !options?.ignoreTime) {
      return before.toISOString();
    }
    if (options?.exclusive) {
      before = addDays(before, 1);
    }
    return before.toISOString().split("T")[0];
  };
}

const main = async () => {
  try {
    const server = new McpServer({
      name: "Time",
      version: "1.0.0",
    });

    server.tool("get_current_time", "Get the current time", {}, async () => {
      const now = new Date();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              time_millis: now.getTime(),
              time_iso: now.toISOString(),
            }),
          },
        ],
      };
    });

    server.tool(
      "resolve_time_description",
      "Resolve a timestamp or time range from natural language time description",
      {
        time_range: z
          .string()
          .describe(
            `Text describing the date range to search within, which will be parsed by chrono-node.
    e.g. "last week", "yesterday", "17 Aug - 19 Aug", etc.
    If not provided, will search from the beginning of time.`,
          )
          .optional(),
      },
      async (params) => {
        const timeRange = TimeRange.parse(params);
        if (!timeRange) {
          return {
            content: [
              {
                type: "text",
                text: params.time_range
                  ? "Invalid time range"
                  : "No time range provided",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                after: timeRange.getAfter(params),
                before: timeRange.getBefore(params),
              }),
            },
          ],
        };
      },
    );

    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error("Time MCP server started");
  } catch (error) {
    console.error(`Error starting Time MCP server: ${error}`);
  }
};

main();
