"""FieldData MCP — a patron's own field instruments, in one vendor-neutral shape."""

import logging

from tollbooth.version import resolve_service_version

__version__ = resolve_service_version("fielddata-mcp", __file__)

# httpx logs every request URL at INFO, and both vendors' URLs carry the patron's keys.
logging.getLogger("httpx").setLevel(logging.WARNING)
