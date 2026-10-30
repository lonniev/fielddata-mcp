// Cloudflare Pages Function: /mcp → the FieldData operator on Horizon.
import { makeMcpProxy } from "@tollbooth-dpyc/web/pages-proxy";

export const onRequest = makeMcpProxy("https://fielddata-mcp.fastmcp.app/mcp");
